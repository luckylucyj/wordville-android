package com.wordville.app;
import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
public class MainActivity extends Activity {
 private WebView web; private ValueCallback<Uri[]> chooser;
 private static final String CLOUD_HOST = "tvqzgyxsyuxiesplfyyg.supabase.co";
 private static final String HOST = "appassets.androidplatform.net";
 @Override public void onCreate(Bundle saved) {
  super.onCreate(saved);
  web = new WebView(this); setContentView(web);
  web.setOnApplyWindowInsetsListener((v, insets) -> { v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom()); return insets; });
  web.requestApplyInsets();
  WebSettings settings = web.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false); settings.setAllowContentAccess(false); settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  WebViewAssetLoader loader = new WebViewAssetLoader.Builder().addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient() {
   @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
    Uri url=request.getUrl();
    if ("https".equals(url.getScheme()) && HOST.equals(url.getHost())) { WebResourceResponse r=loader.shouldInterceptRequest(url); if(r!=null)return r; }
    if ("https".equals(url.getScheme()) && CLOUD_HOST.equals(url.getHost())) return null;
    return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return !("https".equals(request.getUrl().getScheme()) && HOST.equals(request.getUrl().getHost())); }
  });
  web.setWebChromeClient(new WebChromeClient() {
   @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
    if(chooser!=null)chooser.onReceiveValue(null); chooser=callback;
    Intent intent=new Intent(Intent.ACTION_GET_CONTENT); intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("image/*");
    try { startActivityForResult(intent, 100); } catch(ActivityNotFoundException e) { chooser.onReceiveValue(null);chooser=null; } return true;
   }
  });
  web.loadUrl("https://"+HOST+"/assets/index.html");
 }
 @Override protected void onActivityResult(int request, int result, Intent data) { super.onActivityResult(request,result,data); if(request==100 && chooser!=null) { chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));chooser=null; } }
 @Override protected void onDestroy() { if(chooser!=null)chooser.onReceiveValue(null);web.destroy();super.onDestroy(); }
}
