package com.wordville.app;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import java.io.IOException;
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
  final String wordId;

  Request(int id, String word, Locale locale, String wordId) {
   this.id=id;
   this.word=word;
   this.locale=locale;
   this.wordId=wordId;
  }
 }

 private final Context context;
 private final Result result;
 private final Handler main=new Handler(Looper.getMainLooper());
 private TextToSpeech engine;
 private boolean ready;
 private Request active;
 private MediaPlayer bundled;
 private final Runnable ukVoiceTimeout=this::playBundledUk;

 WordvillePronunciation(Context context, Result result) {
  this.context=context.getApplicationContext();
  this.result=result;
 }

 void speak(String word, String accent, int id, String wordId) {
  stop();
  Locale locale="en-US".equals(accent)?Locale.US:Locale.UK;
  active=new Request(id,word,locale,wordId);
  if(Locale.UK.equals(locale))main.postDelayed(ukVoiceTimeout,2500);
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
   if(active!=null&&bundled==null)onVoiceUnavailable();
   return;
  }
  ready=true;
  engine.setSpeechRate(.88f);
  engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
   @Override public void onStart(String id) { postState(id,"playing"); }
   @Override public void onDone(String id) { postState(id,"done"); }
   @Override public void onError(String id) { postState(id,"unavailable"); }
  });
  if(active!=null&&bundled==null)speakActive();
 }

 private void postState(String id,String state) {
  main.post(()->{
   if(active==null||bundled!=null||!Integer.toString(active.id).equals(id))return;
   main.removeCallbacks(ukVoiceTimeout);
   if("playing".equals(state))result.send(active.id,state);
   else if("unavailable".equals(state))onVoiceUnavailable();
   else finish(state);
  });
 }

 private void speakActive() {
  Voice voice=voiceFor(active.locale);
  if(voice==null||engine.setVoice(voice)!=TextToSpeech.SUCCESS
   ||engine.speak(active.word,TextToSpeech.QUEUE_FLUSH,null,Integer.toString(active.id))!=TextToSpeech.SUCCESS) {
   onVoiceUnavailable();
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

 private void onVoiceUnavailable() {
  if(Locale.UK.equals(active.locale))playBundledUk();
  else finish("unavailable");
 }

 private void playBundledUk() {
  main.removeCallbacks(ukVoiceTimeout);
  Request request=active;
  if(request==null||bundled!=null)return;
  if(request.wordId==null||!request.wordId.matches("[a-z0-9][a-z0-9-]{0,179}")) {
   finish("unavailable");
   return;
  }
  if(ready&&engine!=null)engine.stop();
  try(AssetFileDescriptor clip=context.getAssets().openFd("pronunciation/uk/"+request.wordId+".mp3")) {
   MediaPlayer player=new MediaPlayer();
   bundled=player;
   player.setAudioAttributes(new AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_MEDIA)
    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
    .build());
   player.setDataSource(clip.getFileDescriptor(),clip.getStartOffset(),clip.getLength());
   player.setOnPreparedListener(media->{
    if(active!=request||bundled!=media)return;
    try {
     media.start();
     result.send(request.id,"playing");
    } catch(IllegalStateException ignored) {
     finish("unavailable");
    }
   });
   player.setOnCompletionListener(media->{
    if(active==request&&bundled==media)finish("done");
   });
   player.setOnErrorListener((media,what,extra)->{
    if(active==request&&bundled==media)finish("unavailable");
    return true;
   });
   player.prepareAsync();
  } catch(IOException|RuntimeException ignored) {
   finish("unavailable");
  }
 }

 private void clearPlayback() {
  active=null;
  main.removeCallbacks(ukVoiceTimeout);
  if(bundled!=null) {
   bundled.release();
   bundled=null;
  }
 }

 private void finish(String state) {
  int id=active.id;
  clearPlayback();
  result.send(id,state);
 }

 void stop() {
  clearPlayback();
  if(ready&&engine!=null)engine.stop();
 }

 void close() {
  stop();
  if(engine!=null)engine.shutdown();
  engine=null;
  ready=false;
 }
}
