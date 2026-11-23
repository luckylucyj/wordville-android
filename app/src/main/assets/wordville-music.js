/* Town BGM: user-supplied offline MP3s, chosen from the displayed Town hour
 * and manually selected pixel weather. Audio never autoplays on first launch.
 * The five songs are installed from wordville-music.zip during Android build.
 */
(function(root) {
 'use strict';
 const TRACKS=Object.freeze({
  morning:'audio/01_morning_sunny.mp3',
  noon:'audio/02_noon_sunny.mp3',
  evening:'audio/03_evening_sunny.mp3',
  night:'audio/04_night_clear.mp3',
  cloudy:'audio/05_cloudy.mp3'
 });
 const CLOUDY=new Set(['clouds','overcast','rain']);
 function resolveTrack(hour,weather='clear') {
  const n=Number(hour);
  const h=Number.isFinite(n)?((Math.floor(n)%24)+24)%24:0;
  if(CLOUDY.has(weather))return TRACKS.cloudy;
  if(h>=6&&h<11)return TRACKS.morning;
  if(h>=11&&h<17)return TRACKS.noon;
  if(h>=17&&h<20)return TRACKS.evening;
  return TRACKS.night;
 }
 function trackLabel(path) {
  const labels={
   [TRACKS.morning]:'맑음 · 아침',[TRACKS.noon]:'맑음 · 점심',
   [TRACKS.evening]:'맑음 · 저녁',[TRACKS.night]:'맑음 · 밤',
   [TRACKS.cloudy]:'흐림 · 하루 종일'
  };
  return labels[path]||'';
 }
 let enabled=false, audio=null, currentTrack='', clockMinute=null;
 let button=null, indicator=null, playAttempt=0;
 const api={TRACKS,resolveTrack,trackLabel,
  get enabled(){return enabled;},
  get currentTrack(){return currentTrack;},
  setEnabled(value){toggle(Boolean(value));},
  refresh(){refresh();}
 };
 root.WordvilleTownMusic=api;
 if(!root.document)return;
 const doc=root.document;
 function showStatus(message) {
  if(indicator)indicator.textContent=message;
 }
 function updateButton(){
  if(!button)return;
  button.textContent=enabled?'♫ 배경음악 끄기':'♫ 배경음악 켜기';
  button.setAttribute('aria-pressed',String(enabled));
 }
 function stopAudio(){
  playAttempt++;
  if(audio)audio.pause();
 }
 function toggle(next){
  enabled=next;
  updateButton();
  if(!next){
   stopAudio();
   showStatus('배경음악 꺼짐');
  }else{
   refresh();
  }
 }
 function handlePlayError(error,request){
  if(request!==playAttempt||!enabled)return;
  enabled=false;
  stopAudio();
  updateButton();
  showStatus(error?.name==='NotAllowedError'
   ?'재생이 차단되었습니다. 음악 켜기를 다시 눌러주세요.'
   :'음원 재생 실패 · 음악 파일이 앱에 포함되었는지 확인해주세요.');
 }
 function refresh(){
  if(!enabled||doc.hidden)return;
  if(!audio)return;
  const now=new Date();
  const displayedMinute=Number.isFinite(clockMinute)?clockMinute
   :(root.WordvilleVillage?.clockMinute??(now.getHours()*60+now.getMinutes()));
  const weather=root.WordvillePixelStyle?.weather||'clear';
  const path=resolveTrack(Math.floor(displayedMinute/60),weather);
  if(path!==currentTrack){
   stopAudio();
   currentTrack=path;
   audio.src=path;
   audio.load();
  }
  if(!audio.paused)return;
  const request=++playAttempt;
  try {
   const result=audio.play();
   if(result&&typeof result.then==='function'){
    result.then(()=>{
     if(request===playAttempt&&enabled)showStatus(trackLabel(path)+' · 재생 중');
    }).catch(error=>handlePlayError(error,request));
   }else showStatus(trackLabel(path)+' · 재생 중');
  }catch(error){handlePlayError(error,request);}
 }
 function install(){
  const controls=doc.querySelector('.village-controls');
  if(!controls||doc.getElementById('wv-town-music'))return;
  audio=doc.createElement('audio');
  audio.id='wv-town-music-audio';
  audio.loop=true;
  audio.preload='none';
  audio.volume=.28;
  audio.addEventListener('error',()=>{
   if(enabled)handlePlayError(new Error('missing MP3'),playAttempt);
  });
  const row=doc.createElement('div');
  row.className='wv-town-music-control';
  button=doc.createElement('button');
  button.id='wv-town-music';
  button.type='button';
  button.setAttribute('aria-label','Wordville 마을 배경음악 재생 또는 중지');
  button.addEventListener('click',()=>toggle(!enabled));
  indicator=doc.createElement('small');
  indicator.id='wv-town-music-status';
  indicator.setAttribute('role','status');
  indicator.setAttribute('aria-live','polite');
  row.append(button,indicator,audio);
  controls.append(row);
  updateButton();
  showStatus('마을 날씨·시간대에 따라 곡이 바뀝니다. 처음에는 꺼져 있습니다.');
 }
 doc.addEventListener('wordville-time-changed',event=>{
  if(Number.isFinite(event.detail?.minute))clockMinute=event.detail.minute;
  refresh();
 });
 doc.addEventListener('wordville-weather-changed',refresh);
 doc.addEventListener('visibilitychange',()=>{
  if(doc.hidden)stopAudio();
  else refresh();
 });
 doc.addEventListener('wordville-app-resume',()=>{if(!doc.hidden)refresh();});
 root.addEventListener?.('pagehide',stopAudio);
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})(typeof globalThis!=='undefined'?globalThis:this);
