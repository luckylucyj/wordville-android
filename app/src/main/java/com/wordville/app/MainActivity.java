package com.wordville.app;
import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.SystemClock;
import android.graphics.Color;
import android.view.WindowInsets;
import android.view.ViewGroup;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
import android.webkit.JavascriptInterface;
import android.content.SharedPreferences;
import org.json.JSONObject;

public class MainActivity extends Activity {
 private static final String CLOUD_HOST="tvqzgyxsyuxiesplfyyg.supabase.co";
 private static final String HOST="appassets.androidplatform.net";
 private static final String HOME="https://"+HOST+"/assets/index.html";
 private WebView web;
 private FrameLayout root;
 private ValueCallback<Uri[]> chooser;
 private long previousRendererRecovery=0L;
 private boolean pageReady=false;
 // Native backup is independent of WebView's localStorage and survives WebView
 // renderer recreation, app process restarts, and compatible APK upgrades.
 private static final String SETTINGS_FILE="wordville_wordview_preferences";
 private static final String NATIVE_VIEW_KEY="last_word_view";
 private static final String NATIVE_TAB_KEY="last_active_tab";
 private final class WordvilleSettingsBridge {
  private SharedPreferences prefs(){
   return getApplicationContext().getSharedPreferences(SETTINGS_FILE,MODE_PRIVATE);
  }
  @JavascriptInterface public String getWordView(){
   return prefs().getString(NATIVE_VIEW_KEY,"");
  }
  @JavascriptInterface public boolean saveWordView(String json){
   if(json==null||json.length()>1500)return false;
   try{
    JSONObject o=new JSONObject(json);
    if(o.optInt("version",-1)!=1)return false;
    String day=o.optString("day","");
    if(day.length()>2)return false;
    if(!day.isEmpty()){
     int d=Integer.parseInt(day);
     if(d<0||d>90)return false;
    }
    String status=o.optString("status","all");
    if(!("all".equals(status)||"N".equals(status)||"R".equals(status)||
      "F".equals(status)||"X".equals(status)||"U".equals(status)||
      "C".equals(status)||"✓".equals(status)))return false;
    if(o.optString("search","").length()>200)return false;
    int page=o.optInt("page",-1);
    if(page<0||page>10000)return false;
    if(!o.isNull("pdf")){
     int pdf=o.optInt("pdf",-1);
     if(pdf<1||pdf>10000)return false;
    }
    return prefs().edit().putString(NATIVE_VIEW_KEY,json).commit();
   }catch(Exception ex){return false;}
  }
  @JavascriptInterface public String getLastTab(){
   return prefs().getString(NATIVE_TAB_KEY,"");
  }
  @JavascriptInterface public boolean saveLastTab(String screen){
   if(!("learn".equals(screen)||"town".equals(screen)))return false;
   return prefs().edit().putString(NATIVE_TAB_KEY,screen).commit();
  }
 }


 @Override public void onCreate(Bundle saved) {
  super.onCreate(saved);
  // Keep the status and navigation bar insets outside of the WebView.
  getWindow().setStatusBarColor(Color.rgb(83,55,34));
  getWindow().setNavigationBarColor(Color.rgb(83,55,34));
  getWindow().getDecorView().setSystemUiVisibility(
    View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
  if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
  root=new FrameLayout(this);
  root.setBackgroundColor(Color.rgb(248,236,214));
  root.setOnApplyWindowInsetsListener((view,insets)->{
   int left,top,right,bottom;
   if(Build.VERSION.SDK_INT>=30){
    android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());
    left=bars.left;top=bars.top;right=bars.right;bottom=bars.bottom;
   } else {
    left=insets.getSystemWindowInsetLeft();top=insets.getSystemWindowInsetTop();
    right=insets.getSystemWindowInsetRight();bottom=insets.getSystemWindowInsetBottom();
   }
   view.setPadding(left,top,right,bottom);
   return insets;
  });
  setContentView(root);
  root.requestApplyInsets();
  createWebView();
 }

 private void createWebView(){
  pageReady=false;
  web=new WebView(this);
  final WebView view=web;
  view.setBackgroundColor(Color.rgb(248,236,214));
  root.addView(view,0,new FrameLayout.LayoutParams(
    ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.MATCH_PARENT));
  WebSettings settings=view.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);
  settings.setAllowContentAccess(false);
  settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  settings.setCacheMode(WebSettings.LOAD_DEFAULT);
  // The bridge exposes only validated display preferences, never credentials
  // or progress, and the WebView restricts page navigation to bundled assets.
  view.addJavascriptInterface(new WordvilleSettingsBridge(),"WordvilleSettings");
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder()
    .addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  view.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView w,WebResourceRequest request){
    Uri url=request.getUrl();
    if("https".equals(url.getScheme())&&HOST.equals(url.getHost())){
     WebResourceResponse response=loader.shouldInterceptRequest(url);
     if(response!=null)return response;
    }
    if("https".equals(url.getScheme())&&CLOUD_HOST.equals(url.getHost()))return null;
    return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
   }
   @Override public boolean shouldOverrideUrlLoading(WebView w,WebResourceRequest request){
    return !("https".equals(request.getUrl().getScheme())&&HOST.equals(request.getUrl().getHost()));
   }
   @Override public void onPageFinished(WebView w,String url){
    super.onPageFinished(w,url);
    if(w!=web||url==null||!url.startsWith(HOME))return;
    pageReady=true;
    if(!isFinishing()&&!isDestroyed())notifyJsResume();
   }
   @Override public void onReceivedError(WebView w,WebResourceRequest req,WebResourceError error){
    super.onReceivedError(w,req,error);
    if(req.isForMainFrame()&&w==web)showRecovery("마을 화면을 읽지 못했습니다.");
   }
   @Override public boolean onRenderProcessGone(WebView w,RenderProcessGoneDetail detail){
    // Android may kill a background WebView renderer without killing the Activity.
    // The old WebView is unusable and MUST be removed/destroyed before re-creating it.
    if(w!=web)return true;
    if(chooser!=null){chooser.onReceiveValue(null);chooser=null;}
    root.removeView(w);
    w.destroy();
    web=null;
    pageReady=false;
    long now=SystemClock.elapsedRealtime();
    if(now-previousRendererRecovery<8000){
     showRecovery("화면 처리기가 반복 종료되었습니다.");
     return true;
    }
    previousRendererRecovery=now;
    createWebView();
    return true;
   }
  });
  view.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView w,ValueCallback<Uri[]> callback,FileChooserParams params){
    if(chooser!=null)chooser.onReceiveValue(null);
    chooser=callback;
    Intent intent=new Intent(Intent.ACTION_GET_CONTENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("image/*");
    try{startActivityForResult(intent,100);}
    catch(ActivityNotFoundException e){chooser.onReceiveValue(null);chooser=null;}
    return true;
   }
  });
  view.loadUrl(HOME);
 }

 private void notifyJsResume(){
  WebView current=web;
  if(current==null)return;
  current.post(()->{
   if(current!=web||!pageReady)return;
   current.evaluateJavascript("document.dispatchEvent(new Event('wordville-app-resume'));",null);
  });
 }

 private void showRecovery(String message){
  if(root==null||isFinishing())return;
  // Explicit recovery UI rather than leaving the user on a blank brown surface.
  LinearLayout panel=new LinearLayout(this);
  panel.setOrientation(LinearLayout.VERTICAL);
  panel.setPadding(36,40,36,40);
  panel.setBackgroundColor(Color.rgb(249,236,209));
  TextView label=new TextView(this);
  label.setText("WORDVILLE\n"+message+"\n학습 기록을 삭제하지 않고 다시 시작할 수 있습니다.");
  label.setTextColor(Color.rgb(83,55,34));label.setTextSize(17f);
  Button retry=new Button(this);retry.setText("마을 다시 열기");
  retry.setOnClickListener(v->{
   root.removeView(panel);
   if(web!=null){root.removeView(web);web.destroy();web=null;}
   previousRendererRecovery=0;
   createWebView();
  });
  panel.addView(label);
  panel.addView(retry);
  root.addView(panel,new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
    ViewGroup.LayoutParams.WRAP_CONTENT));
 }

 @Override protected void onResume(){
  super.onResume();
  if(web!=null){web.onResume();web.resumeTimers();notifyJsResume();}
 }
 @Override protected void onPause(){
  if(web!=null){web.onPause();web.pauseTimers();}
  super.onPause();
 }
 @Override protected void onActivityResult(int request,int result,Intent data){
  super.onActivityResult(request,result,data);
  if(request==100&&chooser!=null){
   chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
   chooser=null;
  }
 }
 @Override protected void onDestroy(){
  if(chooser!=null){chooser.onReceiveValue(null);chooser=null;}
  if(web!=null){root.removeView(web);web.destroy();web=null;}
  super.onDestroy();
 }
}
