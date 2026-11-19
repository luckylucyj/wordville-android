package com.wordville.app;
import android.app.Activity;
import android.content.Intent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
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
import com.google.mlkit.nl.translate.Translation;
import com.google.mlkit.nl.translate.TranslateLanguage;
import com.google.mlkit.nl.translate.Translator;
import com.google.mlkit.nl.translate.TranslatorOptions;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.android.gms.tasks.Task;
import org.json.JSONArray;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Arrays;
import java.util.function.BiConsumer;


public class MainActivity extends Activity {
 private static final String CLOUD_HOST="tvqzgyxsyuxiesplfyyg.supabase.co";
 private static final String HOST="appassets.androidplatform.net";
 private static final String HOME="https://"+HOST+"/assets/index.html";
 private WebView web;
 private WordvillePronunciation pronunciation;
 private static final String SKELL_HOST="skell.sketchengine.eu";
 private static final String DICTIONARY_HOST="dictionary.cambridge.org";
 private static final String OXFORD_HOST="www.oxfordlearnersdictionaries.com";
 private final class WordvilleDictionaryClipboardBridge {
  private final WebView owner;
  WordvilleDictionaryClipboardBridge(WebView owner){this.owner=owner;}
  @JavascriptInterface public void paste(int id){
   if(id<1)return;
   runOnUiThread(()->{
    if(owner!=web||!pageReady||!foreground)return;
    String result="null";
    try{
     if(owner.hasWindowFocus()){
      ClipboardManager clipboard=getSystemService(ClipboardManager.class);
      ClipData clip=clipboard==null?null:clipboard.getPrimaryClip();
      CharSequence text=clip==null||clip.getItemCount()==0?null:clip.getItemAt(0).getText();
      result=JSONObject.quote(text==null?"":text.subSequence(0,Math.min(text.length(),6001)).toString());
     }
    }catch(SecurityException ignored){}
    owner.evaluateJavascript("window.WordvilleDictionary?.onPaste("+id+","+result+");",null);
   });
  }
 }
 private final class WordvilleSpeechBridge {
  @JavascriptInterface public void speak(String word,String accent,int id,String wordId){
   if(word==null||word.trim().isEmpty()||word.length()>180||id<1)return;
   if(!("en-US".equals(accent)||"en-GB".equals(accent)))return;
   runOnUiThread(()->{
    if(foreground&&pageReady&&pronunciation!=null)pronunciation.speak(word,accent,id,wordId);
   });
  }
  @JavascriptInterface public void stop(){
   runOnUiThread(()->{if(pronunciation!=null)pronunciation.stop();});
  }
 }
 private void onPronunciationResult(int id,String state){
  WebView current=web;
  if(current!=null&&pageReady&&foreground){
   current.evaluateJavascript("window.WordvillePronunciation?.onNativeResult("+id+","+JSONObject.quote(state)+");",null);
  }
 }
 private FrameLayout root;
 private ValueCallback<Uri[]> chooser;
 private static final long STARTUP_TIMEOUT_MS=20000;
 private static final long RESUME_TIMEOUT_MS=5000;
 private final Handler mainHandler=new Handler(Looper.getMainLooper());
 private boolean foreground;
 private boolean pageReady;
 private boolean recoveryAttempted;
 private long screenCheckId;
 private Runnable screenTimeout;
 private LinearLayout recoveryPanel=null;
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



 // ML Kit translates vocabulary glosses and explicitly submitted source text
 // on device. Translation models can be downloaded on first use.
 private final HashMap<String,Translator> wordTranslators=new HashMap<>();
 private static final List<String> INTERPRETATION_SOURCES=Arrays.asList("en","ja","zh","es","fr","de");

 private Translator translationClient(String source,String target){
  String key=source+">"+target;
  Translator client=wordTranslators.get(key);
  if(client==null){
   TranslatorOptions options=new TranslatorOptions.Builder()
    .setSourceLanguage(source).setTargetLanguage(target).build();
   client=Translation.getClient(options);
   wordTranslators.put(key,client);
  }
  return client;
 }

 private void translateOnDevice(List<String> originals,String source,String target,BiConsumer<JSONArray,String> finish){
  Translator client=translationClient(source,target);
  DownloadConditions conditions=new DownloadConditions.Builder().build();
  client.downloadModelIfNeeded(conditions).addOnSuccessListener(unused->{
   String[] results=new String[originals.size()];
   int[] finished={0};
   for(int i=0;i<originals.size();i++){
    final int index=i;
    client.translate(originals.get(i)).addOnCompleteListener(task->{
     results[index]=task.isSuccessful()?task.getResult():"";
     if(++finished[0]==originals.size()){
      JSONArray output=new JSONArray();
      for(String value:results)output.put(value==null?"":value);
      finish.accept(output,"");
     }
    });
   }
  }).addOnFailureListener(error->finish.accept(new JSONArray(),"model-download-failed"));
 }

 private final class WordvilleInterpretationBridge {
  private final WebView owner;
  WordvilleInterpretationBridge(WebView owner){this.owner=owner;}
  @JavascriptInterface public void translate(String json,String language,int id){
   if(language==null||!INTERPRETATION_SOURCES.contains(language)||id<1||json==null||json.length()>10000)return;
   final List<String> originals=new ArrayList<>();
   try {
    JSONArray items=new JSONArray(json);
    if(items.length()<1||items.length()>8)return;
    int total=0;
    for(int i=0;i<items.length();i++){
     Object item=items.get(i);
     if(!(item instanceof String))return;
     String text=((String)item).trim();
     total+=text.length();
     if(text.isEmpty()||total>1600)return;
     originals.add(text);
    }
   }catch(Exception ignored){return;}
   runOnUiThread(()->{
    if(owner!=web||!pageReady)return;
    try{
     translateOnDevice(originals,language,TranslateLanguage.KOREAN,
      (values,error)->sendInterpretation(owner,id,values,error));
    }catch(Exception e){sendInterpretation(owner,id,new JSONArray(),"translation-error");}
   });
  }
 }
 private void sendInterpretation(WebView owner,int id,JSONArray values,String error){
  if(owner!=web||!pageReady)return;
  JSONObject payload=new JSONObject();
  try{
   payload.put("id",id);payload.put("values",values);payload.put("error",error);
  }catch(Exception ignored){return;}
  String js="window.WordvilleInterpretation?.onNativeResult("+JSONObject.quote(payload.toString())+");";
  owner.evaluateJavascript(js,null);
 }
 private final class WordvilleTranslationBridge {
  @JavascriptInterface public void translateBatch(String json,String locale,int requestId){
   if(requestId<1||requestId>2147483000||json==null||json.length()>7000)return;
   if(!("en".equals(locale)||"ja".equals(locale)||"zh-CN".equals(locale)))return;
   runOnUiThread(()->{
    try {
     JSONArray items=new JSONArray(json);
     if(items.length()<1||items.length()>16)return;
     List<String> originals=new ArrayList<>();
     for(int i=0;i<items.length();i++){
      String v=items.optString(i,"");
      if(v.length()<1||v.length()>220)return;
      originals.add(v);
     }
     String target="en".equals(locale)?TranslateLanguage.ENGLISH:
        "ja".equals(locale)?TranslateLanguage.JAPANESE:TranslateLanguage.CHINESE;
     translateOnDevice(originals,TranslateLanguage.KOREAN,target,
      (values,error)->sendTranslations(requestId,locale,values,error));
    }catch(Exception e){sendTranslations(requestId,locale,new JSONArray(),"translation-error");}
   });
  }
 }
 private void sendTranslations(int requestId,String locale,JSONArray values,String error){
  WebView current=web;
  if(current==null||!pageReady)return;
  JSONObject payload=new JSONObject();
  try{
   payload.put("id",requestId);payload.put("locale",locale);
   payload.put("values",values);payload.put("error",error);
  }catch(Exception ignored){return;}
  String js="window.WordvilleVocabularyLocale&&window.WordvilleVocabularyLocale.onNativeResult("+JSONObject.quote(payload.toString())+");";
  current.post(()->{if(current==web&&pageReady)current.evaluateJavascript(js,null);});
 }

 @Override public void onCreate(Bundle saved) {
  super.onCreate(saved);
  pronunciation=new WordvillePronunciation(this,this::onPronunciationResult);
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
  view.addJavascriptInterface(new WordvilleSpeechBridge(),"WordvilleSpeech");
  view.addJavascriptInterface(new WordvilleInterpretationBridge(view),"WordvilleInterpretationNative");
  view.addJavascriptInterface(new WordvilleTranslationBridge(),"WordvilleTranslate");
  view.addJavascriptInterface(new WordvilleDictionaryClipboardBridge(view),"WordvilleDictionaryClipboard");
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder()
    .addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  view.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView w,WebResourceRequest request){
    Uri url=request.getUrl();
    if("https".equals(url.getScheme())&&HOST.equals(url.getHost())){
     WebResourceResponse response=loader.shouldInterceptRequest(url);
     if(response!=null)return response;
    }
    if("https".equals(url.getScheme())&&(CLOUD_HOST.equals(url.getHost())||"commons.wikimedia.org".equals(url.getHost())||"upload.wikimedia.org".equals(url.getHost())||"thumb.wikimedia.org".equals(url.getHost())))return null;
    return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
   }
   @Override public boolean shouldOverrideUrlLoading(WebView w,WebResourceRequest request){
    Uri destination=request.getUrl();
    if("https".equals(destination.getScheme())&&HOST.equals(destination.getHost()))return false;
    if(request.isForMainFrame()&&"https".equals(destination.getScheme())){
     String host=destination.getHost();
     if(!("commons.wikimedia.org".equals(host)||SKELL_HOST.equals(host)||DICTIONARY_HOST.equals(host)||OXFORD_HOST.equals(host)||"translate.google.com".equals(host)))return true;
     try{startActivity(new Intent(Intent.ACTION_VIEW,destination));}catch(ActivityNotFoundException ignored){}
    }
    return true;
   }
   @Override public void onPageStarted(WebView w,String url,android.graphics.Bitmap favicon){
    if(w==web)pageReady=false;
   }
   @Override public void onPageFinished(WebView w,String url){
    if(w!=web||!HOME.equals(url))return;
    pageReady=true;
    if(foreground&&screenTimeout==null)watchScreen(STARTUP_TIMEOUT_MS);
   }
   @Override public boolean onRenderProcessGone(WebView w,RenderProcessGoneDetail detail){
    if(w==web)recoverScreen("화면 처리기가 반복 종료되었습니다.");
    return true;
   }
  });
  view.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView w,ValueCallback<Uri[]> callback,FileChooserParams params){
    if(chooser!=null)chooser.onReceiveValue(null);
    chooser=callback;
    Intent intent=new Intent(Intent.ACTION_GET_CONTENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("image/*");
     intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
    try{startActivityForResult(intent,100);}
    catch(ActivityNotFoundException e){chooser.onReceiveValue(null);chooser=null;}
    return true;
   }
  });
  view.loadUrl(HOME);
  if(foreground)watchScreen(STARTUP_TIMEOUT_MS);
 }

 private void watchScreen(long timeoutMs){
  cancelScreenCheck();
  WebView expected=web;
  long checkId=screenCheckId;
  // The native deadline also runs when JavaScript or the compositor never calls back.
  screenTimeout=()->{
   if(isCurrentCheck(expected,checkId))recoverScreen("마을 화면이 정상적으로 열리지 않았습니다.");
  };
  mainHandler.postDelayed(screenTimeout,timeoutMs);
  checkScreen(expected,checkId);
 }

 private boolean isCurrentCheck(WebView expected,long checkId){
  return foreground&&expected==web&&checkId==screenCheckId&&!isFinishing()&&!isDestroyed();
 }

 private void cancelScreenCheck(){
  screenCheckId++;
  if(screenTimeout!=null)mainHandler.removeCallbacks(screenTimeout);
  screenTimeout=null;
 }

 private void checkScreen(WebView expected,long checkId){
  if(!isCurrentCheck(expected,checkId))return;
  if(!pageReady){
   mainHandler.postDelayed(()->checkScreen(expected,checkId),250);
   return;
  }
  String probe="(function(){document.dispatchEvent(new Event('wordville-app-resume'));"
    +"var cover=document.getElementById('wv-loading-cover'),dock=document.getElementById('wv-bottom-dock');"
    +"return !!window.WordvilleShell && !!cover && cover.hidden && !!dock && dock.getBoundingClientRect().height>0;})()";
  expected.evaluateJavascript(probe,result->{
   if(!isCurrentCheck(expected,checkId))return;
   if(!"true".equals(result)){
    mainHandler.postDelayed(()->checkScreen(expected,checkId),250);
    return;
   }
   expected.postVisualStateCallback(checkId,new WebView.VisualStateCallback(){
    @Override public void onComplete(long requestId){
     if(!isCurrentCheck(expected,requestId))return;
     expected.invalidate();
     recoveryAttempted=false;
     cancelScreenCheck();
    }
   });
  });
 }

 private void closeWebView(){
  if(pronunciation!=null)pronunciation.stop();
  cancelScreenCheck();
  if(chooser!=null){chooser.onReceiveValue(null);chooser=null;}
  if(web!=null){
   WebView previous=web;
   web=null;
   root.removeView(previous);
   previous.destroy();
  }
  pageReady=false;
 }

 private void recoverScreen(String message){
  closeWebView();
  if(isFinishing()||isDestroyed())return;
  if(recoveryAttempted){
   showRecovery(message);
  }else if(foreground){
   recoveryAttempted=true;
   // Recreate the view without clearing the origin's storage or native preferences.
   createWebView();
  }
 }

 private void showRecovery(String message){
  if(root==null||isFinishing()||recoveryPanel!=null)return;
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
   recoveryPanel=null;
   closeWebView();
   recoveryAttempted=false;
   createWebView();
  });
  panel.addView(label);
  panel.addView(retry);
  recoveryPanel=panel;
  root.addView(panel,new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
    ViewGroup.LayoutParams.WRAP_CONTENT));
 }

 @Override protected void onResume(){
  super.onResume();
  foreground=true;
  if(recoveryPanel!=null)return;
  if(web==null){
   recoveryAttempted=true;
   createWebView();
  }else{
   web.onResume();
   watchScreen(pageReady?RESUME_TIMEOUT_MS:STARTUP_TIMEOUT_MS);
  }
 }
 @Override protected void onPause(){
  foreground=false;
  if(pronunciation!=null)pronunciation.stop();
  cancelScreenCheck();
  if(web!=null)web.onPause();
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
  if(pronunciation!=null)pronunciation.close();
  for(Translator translator:wordTranslators.values())translator.close();
  wordTranslators.clear();
  closeWebView();
  recoveryPanel=null;
  super.onDestroy();
 }
}
