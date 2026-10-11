package io.github.heesoctrl.nyangseojae;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.OutputStream;

/**
 * 냥서재 안드로이드 앱: 배포된 웹앱(GitHub Pages)을 주소창 없이 띄운다.
 * 화면·기능은 웹앱 그대로이고, 웹앱의 서비스워커가 오프라인 동작을 맡는다.
 * 기록(IndexedDB)은 이 앱 안에 따로 저장된다(Chrome 과 공유하지 않음).
 */
public class MainActivity extends Activity {
    private static final String HOST = "heeso-ctrl.github.io";
    private static final String PATH = "/nyang-seojae/";
    private static final String START_URL = "https://" + HOST + PATH;
    private static final int FILE_REQUEST = 1001;

    private WebView web;
    /** 뷰어가 열려 있으면 웹앱이 true 로 알려 준다. 그동안 BOOX 페이지 버튼(음량 키)을 페이지 넘김으로 보낸다. */
    private volatile boolean readerActive = false;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 개인용 앱: PC 의 chrome://inspect 로 문제를 볼 수 있게 디버깅을 켠다.
        WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);
        s.setSupportZoom(false);

        web.addJavascriptInterface(new Bridge(), "NyangAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                // epub 뷰어는 본문을 iframe 안의 blob: 주소로 띄운다. iframe 이동이나 blob:/data:/about: 주소를
                // 가로채면 본문이 영영 안 열려 백지가 된다(BOOX 실기기 백지 원인). 이런 이동은 그대로 둔다.
                if (!request.isForMainFrame()) return false;
                String scheme = u.getScheme() == null ? "" : u.getScheme();
                if (scheme.equals("blob") || scheme.equals("data") || scheme.equals("about")) return false;
                String path = u.getPath() == null ? "" : u.getPath();
                if (HOST.equals(u.getHost()) && path.startsWith(PATH)) return false;
                // 냥서재 밖의 http(s) 주소만 바깥 브라우저로 연다.
                if (!scheme.equals("http") && !scheme.equals("https")) return true;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // 웹앱 console 메시지를 logcat(NyangConsole)에 남긴다. 기기 점검용.
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i("NyangConsole", m.messageLevel() + " " + m.message() + " @" + m.sourceId() + ":" + m.lineNumber());
                return true;
            }

            // 표지 이미지 선택, 백업 가져오기용 파일 선택 창
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_REQUEST);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
        web.requestFocus();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_REQUEST && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    /** BOOX 옆면 페이지 버튼은 음량 키로 들어온다(기기 점검: gpio-keys KEY_VOLUMEUP). 뷰어가 열려 있을 때만 넘김으로 바꾼다. */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if (readerActive && (code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN)) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                String dir = code == KeyEvent.KEYCODE_VOLUME_UP ? "previous" : "next";
                web.evaluateJavascript("window.dispatchEvent(new CustomEvent('nyang-page',{detail:'" + dir + "'}))", null);
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    /** 웹앱에서 window.NyangAndroid 로 부르는 통로 */
    private class Bridge {
        /** 백업 JSON 을 '다운로드/냥서재' 폴더에 저장한다. */
        @JavascriptInterface
        public boolean saveFile(String name, String mime, String base64) {
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                v.put(MediaStore.Downloads.MIME_TYPE, mime);
                v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/냥서재");
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) return false;
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out == null) return false;
                    out.write(bytes);
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void setReaderActive(boolean active) {
            readerActive = active;
        }

        @JavascriptInterface
        public String appVersion() {
            return "android";
        }
    }
}
