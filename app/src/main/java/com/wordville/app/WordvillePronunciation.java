package com.wordville.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import java.util.Locale;
import java.util.Set;

final class WordvillePronunciation {
 interface Result {
  void send(int id, String state);
 }

 private static final class Request {
  final int id;
  final String word;
  final Locale locale;

  Request(int id, String word, Locale locale) {
   this.id=id;
   this.word=word;
   this.locale=locale;
  }
 }

 private final Context context;
 private final Result result;
 private final Handler main=new Handler(Looper.getMainLooper());
 private TextToSpeech engine;
 private boolean ready;
 private Request active;

 WordvillePronunciation(Context context, Result result) {
  this.context=context.getApplicationContext();
  this.result=result;
 }

 void speak(String word, String accent, int id) {
  stop();
  Locale locale="en-US".equals(accent)?Locale.US:Locale.UK;
  active=new Request(id,word,locale);
  if(engine==null) {
   engine=new TextToSpeech(context,status->main.post(()->onInit(status)));
  } else if(ready) {
   speakActive();
  }
 }

 private void onInit(int status) {
  if(engine==null)return;
  if(status!=TextToSpeech.SUCCESS) {
   engine.shutdown();
   engine=null;
   if(active!=null)finish("unavailable");
   return;
  }
  ready=true;
  engine.setSpeechRate(.88f);
  engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
   @Override public void onStart(String id) { postState(id,"playing"); }
   @Override public void onDone(String id) { postState(id,"done"); }
   @Override public void onError(String id) { postState(id,"unavailable"); }
  });
  if(active!=null)speakActive();
 }

 private void postState(String id,String state) {
  main.post(()->{
   if(active==null||!Integer.toString(active.id).equals(id))return;
   if("playing".equals(state))result.send(active.id,state);
   else finish(state);
  });
 }

 private void speakActive() {
  Voice voice=voiceFor(active.locale);
  if(voice==null||engine.setVoice(voice)!=TextToSpeech.SUCCESS
   ||engine.speak(active.word,TextToSpeech.QUEUE_FLUSH,null,Integer.toString(active.id))!=TextToSpeech.SUCCESS) {
   finish("unavailable");
  }
 }

 private Voice voiceFor(Locale locale) {
  Set<Voice> voices=engine.getVoices();
  if(voices==null)return null;
  Voice best=null;
  for(Voice voice:voices) {
   Locale actual=voice.getLocale();
   if(!locale.getLanguage().equals(actual.getLanguage())||!locale.getCountry().equals(actual.getCountry()))continue;
   if(voice.getFeatures()!=null&&voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED))continue;
   if(best==null||preferred(voice,best))best=voice;
  }
  return best;
 }

 private static boolean preferred(Voice candidate,Voice current) {
  if(candidate.isNetworkConnectionRequired()!=current.isNetworkConnectionRequired())return !candidate.isNetworkConnectionRequired();
  if(candidate.getQuality()!=current.getQuality())return candidate.getQuality()>current.getQuality();
  return candidate.getName().compareTo(current.getName())<0;
 }

 private void finish(String state) {
  int id=active.id;
  active=null;
  result.send(id,state);
 }

 void stop() {
  active=null;
  if(ready&&engine!=null)engine.stop();
 }

 void close() {
  stop();
  if(engine!=null)engine.shutdown();
  engine=null;
  ready=false;
 }
}
