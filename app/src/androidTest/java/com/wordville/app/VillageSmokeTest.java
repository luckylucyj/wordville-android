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
 private String eval(WebView web, String js) throws Exception {
  AtomicReference<String> result = new AtomicReference<>(); CountDownLatch latch = new CountDownLatch(1);
  InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.evaluateJavascript(js, v -> {result.set(v);latch.countDown();}));
  assertTrue("WebView callback",latch.await(5,TimeUnit.SECONDS));return result.get();
 }
 @Test public void villageAndWordCardRunOnAndroid() throws Exception {
  android.app.Instrumentation inst=InstrumentationRegistry.getInstrumentation();
  Activity activity=inst.startActivitySync(new Intent(inst.getTargetContext(), MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  WebView web=(WebView)((android.view.ViewGroup)activity.findViewById(android.R.id.content)).getChildAt(0);
  boolean ready=false;for(int i=0;i<100;i++){if("true".equals(eval(web,"!!globalThis.WordvilleVillage && document.querySelectorAll('.word').length===60"))){ready=true;break;}Thread.sleep(200);}
  assertTrue("Bundled app initializes",ready);
  assertEquals("32",eval(web,"document.getElementById('day-filter').options.length"));
  assertEquals("true",eval(web,"document.getElementById('next-page').click();document.getElementById('page-info').textContent.startsWith('2 /')"));
  assertEquals("true",eval(web,"var day=document.getElementById('day-filter');day.value='2';day.dispatchEvent(new Event('change'));document.getElementById('page-info').textContent.startsWith('1 /')"));
  assertEquals("12",eval(web,"WordvilleVillage.residents.length"));
  assertEquals("true",eval(web,"document.querySelector('.word').click();document.getElementById('detail-meaning').hidden"));
  assertEquals("false",eval(web,"document.getElementById('reveal').click();document.getElementById('detail-meaning').hidden"));
  assertEquals("true",eval(web,"document.getElementById('reveal').click();document.getElementById('detail-meaning').hidden"));
  assertEquals("\"night\"",eval(web,"document.getElementById('close-dialog').click();var mode=document.getElementById('village-time-mode');mode.value='night';mode.dispatchEvent(new Event('change'));WordvilleVillage.period"));
  assertEquals("true",eval(web,"WordvilleVillage.select('alex');!document.getElementById('village-dialogue').hidden"));
  assertEquals("12",eval(web,"document.querySelectorAll('[data-home]').length"));
  assertEquals("13",eval(web,"document.querySelectorAll('[data-facility]').length"));
  assertEquals("true",eval(web,"VillageHomes.homes.every(function(h){WordvilleHomes.open(h.id);var ok=document.getElementById('home-dialog').open && document.querySelectorAll('#home-objects button').length===3;document.getElementById('home-close').click();return ok;})"));
  assertEquals("true",eval(web,"VillageFacilities.facilities.every(function(f){WordvilleFacilities.open(f.id);document.querySelector('#facility-actions button').click();var ok=document.getElementById('facility-dialog').open && document.getElementById('facility-result').textContent===f.results[0];document.getElementById('facility-close').click();return ok;})"));
  assertEquals("true",eval(web,"WordvilleFacilities.open('burger');document.getElementById('facility-study').click();document.getElementById('word-dialog').open && document.getElementById('detail-word').textContent==='customer'"));
  assertEquals("true",eval(web,"document.getElementById('close-dialog').click();WordvilleFacilities.open('botanical');document.querySelector('#facility-records').textContent.includes('1회')"));
  assertEquals("true",eval(web,"JSON.parse(localStorage.getItem(VillageFacilities.KEY)).records.botanical.counts[0]===1"));
  assertEquals("25",eval(web,"VillageLife.places.length"));
  assertEquals("true",eval(web,"document.getElementById('facility-close').click();Object.assign(WordvilleLifeUI.state,VillageLife.create(23));VillageLife.invite(WordvilleLifeUI.state,'alex','burger');WordvilleLifeUI.state.residents.find(function(p){return p.id==='alex';}).stage==='walking'"));
  assertEquals("true",eval(web,"for(var i=0;i<2000;i++){VillageLife.tick(WordvilleLifeUI.state,.1);if(VillageLife.occupants(WordvilleLifeUI.state,'burger').some(function(p){return p.id==='alex';}))break;}VillageLife.occupants(WordvilleLifeUI.state,'burger').some(function(p){return p.id==='alex';})"));
  assertEquals("true",eval(web,"WordvilleLifeUI.open('burger');document.querySelector('#facility-life [data-life-person=alex]').click();!document.querySelector('#facility-life .life-dialogue').hidden && document.querySelector('#facility-life .life-first').textContent.includes('알렉스')"));
  assertEquals("true",eval(web,"document.querySelector('#facility-actions button').click();document.querySelector('#facility-life .life-first').textContent.includes('같이 참여')"));
  inst.runOnMainSync(activity::finish);
 }
}
