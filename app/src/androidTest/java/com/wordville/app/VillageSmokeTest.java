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
  // Pre-generated walking sheets have 8 distinct four-phase alternate-foot poses; standing sheets have 4.
  assertEquals("8",eval(web,"WordvilleWalk.frameCount"));
  assertEquals("4",eval(web,"WordvilleWalk.idle48FrameCount"));
  assertEquals("43",eval(web,"WordvilleWalk.anchorY"));
  assertEquals("true",eval(web,"WordvilleWalk.walkAtlas.width===256&&WordvilleWalk.walkAtlas.height===2304"));
  boolean idleSpritesReady=false;
  for(int i=0;i<60;i++){
   if("true".equals(eval(web,"Object.values(WordvilleWalk.idle48Sheets).length===12&&Object.values(WordvilleWalk.idle48Sheets).every(im=>im.complete&&im.naturalWidth===192&&im.naturalHeight===384)"))){idleSpritesReady=true;break;}
   Thread.sleep(150);
  }
  assertTrue("All 12 anchored idle sprite sheets decode in Android WebView",idleSpritesReady);
  assertEquals("true",eval(web,"(function(){var c=document.createElement('canvas').getContext('2d');return WordvilleWalk.paint(c,{id:'alex',direction:'down',steps:0},30,90,{height:48,width:48,walking:false,idlePhase:2});})()"));
  assertEquals("true",eval(web,"(function(){var c=document.createElement('canvas').getContext('2d');return WordvilleWalk.paint(c,{id:'alex',direction:'down',steps:0},30,90,{height:48,width:48,walking:true,phase:2});})()"));
  // Freeze the schedule at 13:00: Penny is working in the bookstore then.
  assertEquals("true",eval(web,"(function(){var s=document.getElementById('wv-schedule-hour');s.value='13';s.dispatchEvent(new Event('change'));return WordvilleVillage.schedulePreview==='13' && WordvilleSchedule.at('penny',13*60).place==='bookstore';})()"));
  // Open a real indoor venue and verify that the route avoids modeled furniture.
  assertEquals("true",eval(web,"WordvillePlaces.show('places');WordvillePlaces.pick('bookstore');WordvilleVenueSpec.isBlocked('bookstore',2,2)&&!WordvilleVenueSpec.isBlocked('bookstore',8,10)"));
  boolean venueReady=false;
  for(int i=0;i<30;i++){
   if("true".equals(eval(web,"WordvilleVenueRuntime.scene==='bookstore'&&WordvilleVenueRuntime.actors.length>=2"))){venueReady=true;break;}
   Thread.sleep(150);
  }
  assertTrue("Indoor resident scene starts",venueReady);
  assertEquals("true",eval(web,"WordvilleVillage.visitResident('penny')&&WordvillePlaces.active==='bookstore'&&WordvilleVenueRuntime.focusedResident==='penny'"));
  assertEquals("true",eval(web,"WordvilleVenueRuntime.actors.some(a=>a.id==='penny')"));
  assertEquals("true",eval(web,"(function(){var s=document.getElementById('wv-schedule-hour');s.value='23';s.dispatchEvent(new Event('change'));return WordvilleVillage.visitResident('harvey')&&WordvillePlaces.active==='home'&&WordvilleVenueRuntime.focusedResident==='harvey';})()"));
  assertEquals("true",eval(web,"WordvilleVenueRuntime.actors.some(a=>a.id==='harvey')"));
  assertEquals("true",eval(web,"WordvilleVenueRuntime.actors.filter(a=>!a.player).length===1&&WordvilleVenueRuntime.actors.find(a=>!a.player).id==='harvey'"));
  assertEquals("true",eval(web,"WordvillePlaces.pick('bookstore');WordvillePlaces.active==='bookstore'"));

  assertEquals("true",eval(web,"(function(){var a=WordvilleVenueRuntime.actors[0],q=WordvilleVenueSpec.nearest('bookstore',1,1);return WordvilleVenueRuntime.moveTo(a,q.x,q.y)&&a.route.length>0&&a.route.every(t=>!WordvilleVenueSpec.isBlocked('bookstore',t.x,t.y));})()"));
  assertEquals("true",eval(web,"WordvilleShell.activate('town');document.getElementById('wv-map-view').hidden===false&&document.getElementById('wv-places-view').hidden"));

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
 @Test public void resumesWithoutBrownScreenAndHasLauncherIcon() throws Exception {
  android.app.Instrumentation inst=InstrumentationRegistry.getInstrumentation();
  Activity activity=inst.startActivitySync(new Intent(inst.getTargetContext(), MainActivity.class)
   .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  WebView web=findWebView(activity.findViewById(android.R.id.content));
  assertNotNull("WebView exists after cold start",web);
  assertTrue("Wordville has a custom launcher icon",activity.getPackageManager()
    .getApplicationIcon(activity.getApplicationInfo())!=null);
  boolean ready=false;
  for(int i=0;i<100;i++){
   if("true".equals(eval(web,"!!globalThis.WordvilleShell&&document.getElementById('wv-loading-cover').hidden"))){
    ready=true;break;
   }
   Thread.sleep(180);
  }
  assertTrue("Initial loading screen finishes",ready);
  // Exercise the same onPause/onResume callbacks used when switching Android apps.
  inst.runOnMainSync(()->{
   ((MainActivity)activity).onPause();
   ((MainActivity)activity).onResume();
  });
  boolean recovered=false;
  for(int i=0;i<50;i++){
   if("true".equals(eval(web,"document.getElementById('wv-loading-cover').hidden&&WordvilleShell.screen==='town'&&document.querySelector('#village-canvas').width>20"))){
    recovered=true;break;
   }
   Thread.sleep(180);
  }
  assertTrue("Returning to Wordville keeps a visible usable village",recovered);
  assertEquals("true",eval(web,"document.querySelector('.brand .wv-logo').getAttribute('src')==='favicon.svg'"));
  assertEquals("true",eval(web,"WordvilleShell.activate('places');WordvilleShell.screen==='places'&&document.getElementById('wv-places-view').hidden===false"));
  inst.runOnMainSync(activity::finish);
 }

 @Test public void wordTabRestoresDayThirtyAfterWebViewReload() throws Exception {
  android.app.Instrumentation inst=InstrumentationRegistry.getInstrumentation();
  Activity activity=inst.startActivitySync(new Intent(inst.getTargetContext(), MainActivity.class)
   .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  WebView web=findWebView(activity.findViewById(android.R.id.content));
  assertNotNull("Wordville WebView present",web);
  boolean initialized=false;
  for(int i=0;i<110;i++){
   if("true".equals(eval(web,"!!globalThis.WordvilleShell&&!!document.querySelector('#day-filter option[value=\"30\"]')&&document.querySelectorAll('.word').length>0"))){
    initialized=true;break;
   }
   Thread.sleep(150);
  }
  assertTrue("Day 30 vocabulary loaded",initialized);
  assertEquals("true",eval(web,"(function(){WordvilleShell.activate('learn');var d=document.getElementById('day-filter');d.value='30';d.dispatchEvent(new Event('change'));var q=document.getElementById('search');q.value='fatigue';q.dispatchEvent(new Event('input'));return d.value==='30'&&q.value==='fatigue';})()"));
  assertEquals("true",eval(web,"JSON.parse(localStorage.getItem('wordville.word-tab.view.v1')).day==='30'"));
  inst.runOnMainSync(web::reload);
  boolean restored=false;
  for(int i=0;i<110;i++){
   if("true".equals(eval(web,"!!globalThis.WordvilleShell&&WordvilleShell.screen==='learn'&&document.getElementById('day-filter').value==='30'&&document.getElementById('search').value==='fatigue'&&document.querySelector('.word strong')?.textContent==='fatigue'"))){
    restored=true;break;
   }
   Thread.sleep(150);
  }
  assertTrue("Android WebView reload restores the last Word tab, Day 30, and search",restored);
  // Avoid carrying this test fixture into the other emulator smoke tests.
  assertEquals("true",eval(web,"(function(){WordvilleShell.activate('town');var d=document.getElementById('day-filter');d.value='';d.dispatchEvent(new Event('change'));var q=document.getElementById('search');q.value='';q.dispatchEvent(new Event('input'));return true;})()"));
  inst.runOnMainSync(activity::finish);
 }
}
