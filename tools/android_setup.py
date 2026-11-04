"""Customise the generated Capacitor Android project:
launcher icons, splash, landscape lock, full-screen immersive mode, keep-screen-on and version numbers."""
import os, re, glob
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AND = os.path.join(ROOT, 'android', 'app')
RES = os.path.join(AND, 'src', 'main', 'res')
ART = os.path.join(ROOT, 'art')
PKG = 'com.runewarden.game'
BG = '#0D0A08'

icon = Image.open(os.path.join(ART, 'icon.png')).convert('RGBA')
fg = Image.open(os.path.join(ART, 'icon_foreground.png')).convert('RGBA')
splash = Image.open(os.path.join(ART, 'splash.png')).convert('RGB')

def round_mask(im):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).ellipse((0, 0, im.size[0] - 1, im.size[1] - 1), fill=255)
    out = im.copy(); out.putalpha(m); return out

# launcher icons per density
for d, px, fpx in [('mdpi', 48, 108), ('hdpi', 72, 162), ('xhdpi', 96, 216), ('xxhdpi', 144, 324), ('xxxhdpi', 192, 432)]:
    folder = os.path.join(RES, 'mipmap-' + d)
    os.makedirs(folder, exist_ok=True)
    i = icon.resize((px, px), Image.LANCZOS)
    i.save(os.path.join(folder, 'ic_launcher.png'))
    round_mask(i).save(os.path.join(folder, 'ic_launcher_round.png'))
    fg.resize((fpx, fpx), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_foreground.png'))

# adaptive icon background colour
vals = os.path.join(RES, 'values')
os.makedirs(vals, exist_ok=True)
open(os.path.join(vals, 'ic_launcher_background.xml'), 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">%s</color>\n</resources>\n' % BG)

# splash images: cover-crop the artwork into every size the template ships
for p in glob.glob(os.path.join(RES, 'drawable*', 'splash.png')):
    w, h = Image.open(p).size
    s = max(w / splash.width, h / splash.height)
    im = splash.resize((max(w, round(splash.width * s)), max(h, round(splash.height * s))), Image.LANCZOS)
    l, t = (im.width - w) // 2, (im.height - h) // 2
    im.crop((l, t, l + w, t + h)).save(p)

# landscape lock on the main activity
man = os.path.join(AND, 'src', 'main', 'AndroidManifest.xml')
x = open(man, encoding='utf-8').read()
if 'android:screenOrientation' not in x:
    x = re.sub(r'(<activity\b)', r'\1\n            android:screenOrientation="sensorLandscape"', x, count=1)
open(man, 'w', encoding='utf-8').write(x)

# full-screen immersive game activity that keeps the screen awake
java_dir = os.path.join(AND, 'src', 'main', 'java', *PKG.split('.'))
os.makedirs(java_dir, exist_ok=True)
open(os.path.join(java_dir, 'MainActivity.java'), 'w').write('''package %s;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
''' % PKG)

# version numbers: CI run number, so every build installs over the previous one
run = os.environ.get('GITHUB_RUN_NUMBER')
if run:
    g = os.path.join(AND, 'build.gradle')
    t = open(g, encoding='utf-8').read()
    t = re.sub(r'versionCode \d+', 'versionCode %d' % int(run), t)
    t = re.sub(r'versionName "[^"]*"', 'versionName "1.0.%s"' % run, t)
    open(g, 'w', encoding='utf-8').write(t)
# release signing with your own key (set up through the repository's Actions secrets)
if os.environ.get('KEYSTORE_FILE'):
    g = os.path.join(AND, 'build.gradle')
    t = open(g, encoding='utf-8').read()
    if 'signingConfigs' not in t:
        sign = '''signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE"))
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEYSTORE_PASSWORD")
        }
    }
    buildTypes {'''
        t = t.replace('buildTypes {', sign, 1)
        t = re.sub(r'(buildTypes \{\s*release \{)', r'\1\n            signingConfig signingConfigs.release', t, count=1)
        open(g, 'w', encoding='utf-8').write(t)
        print('release signing configured')
print('android project customised')
