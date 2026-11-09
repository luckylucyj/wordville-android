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
  inst.runOnMainSync(activity::finish);
 }
}
