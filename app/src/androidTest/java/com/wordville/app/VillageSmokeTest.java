package com.wordville.app;
import android.app.Activity;
import android.content.Intent;
import android.webkit.WebView;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import static org.junit.Assert.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
public class VillageSmokeTest {
 private WebView findWebView(android.view.View view) {
   if (view instanceof WebView) return (WebView)view;
   if (view instanceof android.view.ViewGroup) {
     android.view.ViewGroup group=(android.view.ViewGroup)view;
     for (int i=0;i<group.getChildCount();i++) {
       WebView result=findWebView(group.getChildAt(i));
       if (result!=null)return result;
     }
   }
   return null;
 }
 private String eval(WebView web, String js) throws Exception {
  // A fresh emulator may start its WebView renderer after Activity.onCreate.
  // Retry the callback instead of interpreting cold-start latency as app failure.
  for (int attempt=0; attempt<4; attempt++) {
   AtomicReference<String> result=new AtomicReference<>();
   CountDownLatch latch=new CountDownLatch(1);
   InstrumentationRegistry.getInstrumentation().runOnMainSync(
    () -> web.evaluateJavascript(js, value -> {result.set(value);latch.countDown();}));
   if (latch.await(10,TimeUnit.SECONDS)) return result.get();
   Thread.sleep(400);
  }
  throw new AssertionError("WebView did not respond after cold-start retries");
 }
 @Test public void villageAndWordCardRunOnAndroid() throws Exception {
  android.app.Instrumentation inst=InstrumentationRegistry.getInstrumentation();
  Activity activity=inst.startActivitySync(new Intent(inst.getTargetContext(), MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  android.view.ViewGroup content=activity.findViewById(android.R.id.content);
  WebView web=findWebView(content);
  assertNotNull("WebView is present inside the safe-inset container",web);
  boolean ready=false;for(int i=0;i<100;i++){if("true".equals(eval(web,"!!globalThis.WordvilleVillage && document.querySelectorAll('.word').length===60"))){ready=true;break;}Thread.sleep(200);}
  assertTrue("Bundled app initializes",ready);
  assertEquals("32",eval(web,"document.getElementById('day-filter').options.length"));
  assertEquals("true",eval(web,"document.getElementById('next-page').click();document.getElementById('page-info').textContent.startsWith('2 /')"));
  assertEquals("true",eval(web,"var day=document.getElementById('day-filter');day.value='2';day.dispatchEvent(new Event('change'));document.getElementById('page-info').textContent.startsWith('1 /')"));
  assertEquals("12",eval(web,"WordvilleVillage.residents.length"));
  boolean artReady=false;
  for(int i=0;i<55;i++){
   if("true".equals(eval(web,"globalThis.WordvilleWorldArt?.reference?.naturalWidth===840&&Object.keys(globalThis.WordvilleWorldArt?.venueImages||{}).length===17&&Object.values(globalThis.WordvilleWorldArt.venueImages).every(img=>img.complete&&img.naturalWidth===640)"))){artReady=true;break;}
   Thread.sleep(200);
  }
  assertTrue("All 18 reference art images must decode on Android",artReady);
  boolean residentArtReady=false;
  for(int i=0;i<60;i++){
   if("true".equals(eval(web,"WordvillePortraits.image.naturalWidth===1536&&WordvillePortraits.image.naturalHeight===1152&&WordvillePortraits.spriteImage.naturalWidth===2560&&WordvillePortraits.spriteImage.naturalHeight===768"))){residentArtReady=true;break;}
   Thread.sleep(150);
  }
  assertTrue("Original high resolution portraits and sprite atlas must decode on Android",residentArtReady);
  // The on-device renderer must decode the user-supplied 12×4-direction atlas.
  boolean walkAtlasReady=false;
  for(int i=0;i<70;i++){
   if("true".equals(eval(web,"WordvilleWalk.referenceAtlas.complete&&WordvilleWalk.referenceAtlas.naturalWidth===384&&WordvilleWalk.referenceAtlas.naturalHeight===576"))){walkAtlasReady=true;break;}
   Thread.sleep(150);
  }
  assertTrue("4-direction reference walk atlas is available in the APK",walkAtlasReady);
  assertEquals("3",eval(web,"WordvilleWalk.sourceFrameCount"));
  assertEquals("true",eval(web,"(function(){var c=document.createElement('canvas').getContext('2d');return WordvilleWalk.paint(c,{id:'alex',direction:'down',steps:0},30,90,{height:50,width:32});})()"));
  // Open a real indoor venue and verify that the route avoids modeled furniture.
  assertEquals("true",eval(web,"WordvillePlaces.show('places');WordvillePlaces.pick('bookstore');WordvilleVenueSpec.isBlocked('bookstore',2,2)&&!WordvilleVenueSpec.isBlocked('bookstore',8,10)"));
  boolean venueReady=false;
  for(int i=0;i<30;i++){
   if("true".equals(eval(web,"WordvilleVenueRuntime.scene==='bookstore'&&WordvilleVenueRuntime.actors.length>=2"))){venueReady=true;break;}
   Thread.sleep(150);
  }
  assertTrue("Indoor resident scene starts",venueReady);
  assertEquals("true",eval(web,"(function(){var a=WordvilleVenueRuntime.actors[0],q=WordvilleVenueSpec.nearest('bookstore',1,1);return WordvilleVenueRuntime.moveTo(a,q.x,q.y)&&a.route.length>0&&a.route.every(t=>!WordvilleVenueSpec.isBlocked('bookstore',t.x,t.y));})()"));
  assertEquals("true",eval(web,"WordvillePlaces.show('map');document.getElementById('wv-places-view').hidden"));

  assertEquals("true",eval(web,"VillageModel.links.every(([a,b])=>!VillageModel.segmentHitsFountain(VillageModel.nodes[a],VillageModel.nodes[b]))"));
  assertEquals("true",eval(web,"VillageModel.isStairEdge(7,8)&&VillageModel.isStairEdge(8,9)"));
  // PixelCopy captures this Activity window, excluding unrelated Android launcher ANR dialogs.
  Thread.sleep(1600);
  int width=activity.getWindow().getDecorView().getWidth();
  int height=activity.getWindow().getDecorView().getHeight();
  assertTrue("Window has laid out",width>100&&height>100);
  android.graphics.Bitmap bitmap=android.graphics.Bitmap.createBitmap(width,height,android.graphics.Bitmap.Config.ARGB_8888);
  java.util.concurrent.CountDownLatch copied=new java.util.concurrent.CountDownLatch(1);
  java.util.concurrent.atomic.AtomicReference<Integer> code=new java.util.concurrent.atomic.AtomicReference<>(-1);
  android.os.HandlerThread screenshotThread=new android.os.HandlerThread("wordville-visual-qa");
  screenshotThread.start();
  try{
   android.view.PixelCopy.request(activity.getWindow(),bitmap,result->{code.set(result);copied.countDown();},new android.os.Handler(screenshotThread.getLooper()));
   assertTrue("Window capture callback",copied.await(10,TimeUnit.SECONDS));
   assertEquals("Window capture success",android.view.PixelCopy.SUCCESS,code.get().intValue());
  }finally{screenshotThread.quitSafely();}
  java.io.File screenshots=inst.getTargetContext().getExternalFilesDir(null);
  assertNotNull("App screenshot directory",screenshots);
  java.io.File screenshot=new java.io.File(screenshots,"wordville-map-emulator.png");
  try(java.io.FileOutputStream fos=new java.io.FileOutputStream(screenshot)){
   assertTrue("PNG screenshot encoded",bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,fos));
  }
  bitmap.recycle();
  assertTrue("PNG screenshot created",screenshot.length()>120000);
  assertEquals("true",eval(web,"document.querySelector('.word').click();document.getElementById('detail-meaning').hidden"));
  assertEquals("false",eval(web,"document.getElementById('reveal').click();document.getElementById('detail-meaning').hidden"));
  assertEquals("true",eval(web,"document.getElementById('reveal').click();document.getElementById('detail-meaning').hidden"));
  assertEquals("\"night\"",eval(web,"document.getElementById('close-dialog').click();var mode=document.getElementById('village-time-mode');mode.value='night';mode.dispatchEvent(new Event('change'));WordvilleVillage.period"));
  assertEquals("true",eval(web,"WordvilleVillage.select('alex');!document.getElementById('village-dialogue').hidden"));
  inst.runOnMainSync(activity::finish);
 }
}
