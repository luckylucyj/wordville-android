package com.wordville.app;
import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.view.WindowInsets;
import android.view.ViewGroup;
import android.widget.FrameLayout;
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
  // Android 15+ draws behind system bars. Reserve bar insets OUTSIDE the WebView
  // so scrolling content cannot pass behind the status clock or gesture area.
  getWindow().setStatusBarColor(Color.rgb(83,55,34));
  getWindow().setNavigationBarColor(Color.rgb(83,55,34));
  getWindow().getDecorView().setSystemUiVisibility(
    View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
  if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
  FrameLayout root = new FrameLayout(this);
  root.setBackgroundColor(Color.rgb(83,55,34));
  web = new WebView(this);
  root.addView(web,new FrameLayout.LayoutParams(
    ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.MATCH_PARENT));
  root.setOnApplyWindowInsetsListener((view,insets) -> {
    int l,t,r,b;
    if (Build.VERSION.SDK_INT >= 30) {
      android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());
      l=bars.left; t=bars.top; r=bars.right; b=bars.bottom;
    } else {
      l=insets.getSystemWindowInsetLeft(); t=insets.getSystemWindowInsetTop();
      r=insets.getSystemWindowInsetRight(); b=insets.getSystemWindowInsetBottom();
    }
    view.setPadding(l,t,r,b);
    return insets;
  });
  setContentView(root);
  root.requestApplyInsets();
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
