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
import android.view.KeyEvent;
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
    private ValueCallback<Uri[]> fileCallback;
    /** 웹앱 뷰어가 열려 있는지. 열려 있을 때만 볼륨 키(BOOX 물리 버튼)를 쪽 넘김으로 쓴다. */
    private volatile boolean readerOpen = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
                String path = u.getPath() == null ? "" : u.getPath();
                if (HOST.equals(u.getHost()) && path.startsWith(PATH)) return false;
                // 냥서재 밖의 주소는 바깥 브라우저로 연다.
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // 표지 이미지 선택, epub 추가, 백업 가져오기용 파일 선택 창.
            // 웹의 accept(".epub" 같은 확장자)를 그대로 넘기면 BOOX 파일 선택 창이 빈 목록을 보여서,
            // 이미지가 아니면 모든 파일을 보여 주고 형식 확인은 웹앱이 한다.
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                boolean imagesOnly = true;
                String[] accept = params.getAcceptTypes();
                if (accept == null || accept.length == 0) imagesOnly = false;
                else for (String a : accept) if (a == null || !a.trim().startsWith("image/")) { imagesOnly = false; break; }
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(imagesOnly ? "image/*" : "*/*");
                try {
                    startActivityForResult(intent, FILE_REQUEST);
                } catch (ActivityNotFoundException e) {
                    try {
                        startActivityForResult(params.createIntent(), FILE_REQUEST);
                    } catch (ActivityNotFoundException e2) {
                        fileCallback = null;
                        return false;
                    }
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

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if (readerOpen && (code == KeyEvent.KEYCODE_VOLUME_DOWN || code == KeyEvent.KEYCODE_VOLUME_UP)) {
            if (event.getAction() == KeyEvent.ACTION_DOWN) {
                String key = code == KeyEvent.KEYCODE_VOLUME_DOWN ? "PageDown" : "PageUp";
                web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'" + key + "',code:'" + key + "',bubbles:true,cancelable:true}))", null);
            }
            return true; // 음량 막대가 뜨지 않게 소비한다.
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
        public void setReaderOpen(boolean open) {
            readerOpen = open;
        }

        @JavascriptInterface
        public String appVersion() {
            return "android";
        }
    }
}
