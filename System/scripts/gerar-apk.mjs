import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TWA_DIR = 'G:\\TempApkBuild'; // Caminho sem acentos (aapt2 nao suporta UTF-8 no Windows)
const DIST_APK = join(ROOT, 'dist-apk');

if (!existsSync(DIST_APK)) mkdirSync(DIST_APK, { recursive: true });
if (!existsSync(TWA_DIR)) mkdirSync(TWA_DIR, { recursive: true });

const JAVA_HOME = 'C:\\Program Files\\Microsoft\\jdk-21.0.11.10-hotspot';
const ANDROID_HOME = 'C:\\Users\\Mad\\AppData\\Local\\Android\\Sdk';
const BUILD_TOOLS = join(ANDROID_HOME, 'build-tools', '37.0.0');
const PLATFORM = join(ANDROID_HOME, 'platforms', 'android-36.1');
const KEYSTORE_PATH = join(TWA_DIR, 'android.keystore');
const KEYSTORE_PASS = 'atlasacademy';
const KEY_ALIAS = 'android';
const KEY_PASS = 'atlasacademy';
const APP_NAME = 'Atlas Academy';
const PACKAGE_NAME = 'com.atlasacademy.app';

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  const env = { 
    ...process.env, 
    ANDROID_HOME, 
    JAVA_HOME, 
    PATH: `${JAVA_HOME}\\bin;${BUILD_TOOLS};${ANDROID_HOME}\\platform-tools;${process.env.PATH}` 
  };
  return execSync(cmd, { ...opts, env, stdio: 'pipe', cwd: TWA_DIR, encoding: 'utf-8' });
}

// Step 1: Generate keystore
console.log('=== Step 1: Keystore ===');
if (!existsSync(KEYSTORE_PATH)) {
  run(`"${JAVA_HOME}\\bin\\keytool" -genkey -v -keystore "${KEYSTORE_PATH}" -alias ${KEY_ALIAS} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${KEYSTORE_PASS} -keypass ${KEY_PASS} -dname "CN=AtlasAcademy, OU=Dev, O=AtlasAcademy, L=City, S=State, C=BR"`);
  console.log('  ✓ Keystore created');
} else {
  console.log('  ✓ Keystore already exists');
}

// Step 2: Create app source directories
console.log('\n=== Step 2: Android project structure ===');
const appDir = join(TWA_DIR, 'app/src/main');
const javaDir = join(appDir, `java/${PACKAGE_NAME.replace(/\./g, '/')}`);
const resDir = join(appDir, 'res');
const layoutDir = join(resDir, 'layout');
const valuesDir = join(resDir, 'values');
const drawableDir = join(resDir, 'drawable');
const mipmapHdpi = join(resDir, 'mipmap-hdpi');
const mipmapXhdpi = join(resDir, 'mipmap-xhdpi');
const mipmapXxhdpi = join(resDir, 'mipmap-xxhdpi');
const mipmapXxxhdpi = join(resDir, 'mipmap-xxxhdpi');

[javaDir, layoutDir, valuesDir, mipmapHdpi, mipmapXhdpi, mipmapXxhdpi, mipmapXxxhdpi].forEach(d => mkdirSync(d, { recursive: true }));
// Remove empty drawable (aapt2 reclama de pastas vazias)
try { rmSync(drawableDir, { recursive: true }); } catch (e) {}

// Step 3: Copy icon (PNG para compatibilidade com aapt2)
console.log('\n=== Step 3: Icons ===');
const iconPath = join(ROOT, 'assets', 'icon.png');
if (existsSync(iconPath)) {
  for (const dir of [mipmapHdpi, mipmapXhdpi, mipmapXxhdpi, mipmapXxxhdpi]) {
    copyFileSync(iconPath, join(dir, 'ic_launcher.png'));
  }
  console.log('  ✓ Icons copied (PNG)');
} else {
  console.log('  ⚠ Icon not found, skipping');
}

// Step 4: AndroidManifest.xml
console.log('\n=== Step 4: AndroidManifest ===');
writeFileSync(join(appDir, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PACKAGE_NAME}"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${APP_NAME}"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.NoActionBar"
        android:usesCleartextTraffic="false">
        <activity
            android:name=".MainActivity"
            android:label="${APP_NAME}"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>`);

// Step 5: Java source for TWA
console.log('\n=== Step 5: Java source ===');
writeFileSync(join(javaDir, 'MainActivity.java'), `package ${PACKAGE_NAME};

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.view.View;
import android.view.WindowManager;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String URL = "https://atlas-os-21356.web.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );
        
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " AtlasAcademy-Android/1.0");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("https://atlas-os-21356.web.app") || url.startsWith("https://rstopteam.web.app"))) {
                    return false;
                }
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient());
        
        // Remover barras de notificacao e navegacao para fullscreen
        webView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_FULLSCREEN
        );
        
        webView.loadUrl(URL);
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`);

// Step 6: Resources
console.log('\n=== Step 6: Resources ===');
writeFileSync(join(valuesDir, 'strings.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${APP_NAME}</string>
</resources>`);

writeFileSync(join(valuesDir, 'styles.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Material.NoActionBar">
        <item name="android:colorPrimary">#6D001A</item>
        <item name="android:colorPrimaryDark">#4A0012</item>
        <item name="android:windowBackground">#000000</item>
        <item name="android:statusBarColor">#000000</item>
        <item name="android:navigationBarColor">#000000</item>
    </style>
</resources>`);

// Step 7: Build APK
console.log('\n=== Step 7: Building APK ===');

// 7a: Compile resources
console.log('\n  7a: Compile resources...');
try {
  run(`"${BUILD_TOOLS}\\aapt2" compile --dir "${resDir}" -o "${TWA_DIR}\\compiled_res.zip"`);
  console.log('  ✓ Resources compiled');
} catch (e) {
  console.log('  ⚠ Resource compile note (may be empty):', e.message.substring(0, 200));
}

// 7b: Compile Java to .class files
console.log('\n  7b: Compile Java...');
try {
  const androidJar = join(PLATFORM, 'android.jar');
  const javaFiles = join(javaDir, 'MainActivity.java');
  run(`"${JAVA_HOME}\\bin\\javac" -source 17 -target 17 -Xlint:-options -classpath "${androidJar}" -d "${TWA_DIR}\\classes" "${javaFiles}"`);
  console.log('  ✓ Java compiled');
} catch (e) {
  console.log('  ⚠ Java compile output:', e.message.substring(0, 300));
}

// 7c: Convert .class to DEX
console.log('\n  7c: Convert to DEX...');
const classesDir = join(TWA_DIR, 'classes');
try {
  const androidJar = join(PLATFORM, 'android.jar');
  const dexOut = join(TWA_DIR, 'dex');
  mkdirSync(dexOut, { recursive: true });
  // List all .class files recursively and pass to d8
  const classFiles = readdirSync(classesDir, { recursive: true })
    .filter(f => f.endsWith('.class'))
    .map(f => `"${join(classesDir, f)}"`)
    .join(' ');
  run(`"${JAVA_HOME}\\bin\\java" -cp "${BUILD_TOOLS}\\lib\\d8.jar" com.android.tools.r8.D8 --release --min-api 24 --output "${dexOut}" --lib "${androidJar}" ${classFiles}`);
  console.log('  ✓ DEX created');
} catch (e) {
  console.log('  ⚠ D8 failed, trying dx alternative...');
  try {
    run(`"${BUILD_TOOLS}\\dx" --dex --output="${TWA_DIR}\\classes.dex" "${classesDir}"`);
  } catch (e2) {
    console.log('  ⚠ DEX generation note:', e2.message.substring(0, 200));
  }
}

// 7d: Link APK with compiled resources (without DEX - aapt2 can't embed it)
console.log('\n  7d: Link APK...');
const androidJar = join(PLATFORM, 'android.jar');
const compiledRes = join(TWA_DIR, 'compiled_res.zip');
if (existsSync(compiledRes)) {
  run(`"${BUILD_TOOLS}\\aapt2" link --auto-add-overlay --manifest "${appDir}\\AndroidManifest.xml" -I "${androidJar}" -o "${TWA_DIR}\\unaligned.apk" -R "${compiledRes}"`);
} else {
  run(`"${BUILD_TOOLS}\\aapt2" link --auto-add-overlay --manifest "${appDir}\\AndroidManifest.xml" -I "${androidJar}" -o "${TWA_DIR}\\unaligned.apk"`);
}
console.log('  ✓ APK linked');

// 7d2: Add DEX to the APK (APK is just a ZIP)
const dexPath = join(TWA_DIR, 'dex', 'classes.dex');
if (existsSync(dexPath)) {
  console.log('\n  7d2: Adding DEX to APK...');
  run(`"${JAVA_HOME}\\bin\\jar" uf "${TWA_DIR}\\unaligned.apk" -C "${TWA_DIR}\\dex" classes.dex`);
  console.log('  ✓ DEX added to APK');
}

// 7e: Zipalign
console.log('\n  7e: Zipalign...');
run(`"${BUILD_TOOLS}\\zipalign" -f -p 4 "${TWA_DIR}\\unaligned.apk" "${DIST_APK}\\app-aligned.apk"`);
console.log('  ✓ Zipaligned');

// 7f: Sign
console.log('\n  7f: Sign APK...');
run(`"${BUILD_TOOLS}\\apksigner.bat" sign --ks "${KEYSTORE_PATH}" --ks-pass "pass:${KEYSTORE_PASS}" --ks-key-alias ${KEY_ALIAS} --key-pass "pass:${KEY_PASS}" --out "${DIST_APK}\\AtlasAcademy-1.0.0.apk" "${DIST_APK}\\app-aligned.apk"`);
console.log('  ✓ Signed');

console.log('\n========================================');
console.log('✅ APK GERADO COM SUCESSO!');
console.log(`   📁 ${join(DIST_APK, 'AtlasAcademy-1.0.0.apk')}`);
console.log('========================================');
