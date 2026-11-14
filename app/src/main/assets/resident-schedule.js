/* Deterministic 24-hour daily routines for all 12 Wordville residents.
 * One slot per local clock hour (00:00 through 24:00); no network data.
 * Custom overrides belong to the current device, not another user's account.
 */
(function(root){
'use strict';
const PLACE_NAMES={
 home:'집',pool:'수영장',ranch:'목장',gym:'헬스장',burger:'햄버거 가게',
 icecream:'아이스크림 가게',pub:'펍',museum:'미술관',greenhouse:'식물원',
 cafe:'카페',bookstore:'서점',clinic:'진료소',library:'도서관',
 studio:'음악 작업실',market:'시장',square:'마을 광장',
 workshop:'공방',park:'공원'
};
// [hour, place, concrete action]; a new block ends when the next begins.
const BLOCKS={
 alex:[
  [0,'home','잠자기'],[6,'home','아침 식사와 준비'],[7,'gym','근력 운동'],
  [10,'park','달리기 지도'],[12,'burger','점심 식사'],[13,'gym','운동 회원 지도'],
  [17,'pool','수영 훈련'],[19,'cafe','저녁과 휴식'],[21,'square','친구들과 대화'],
  [22,'home','샤워 후 취침']],
 elliott:[
  [0,'home','잠자기'],[7,'cafe','차를 마시며 독서'],[9,'bookstore','신간 정리'],
  [12,'cafe','점심 식사'],[13,'library','시집 집필'],[16,'museum','전시 감상'],
  [19,'pub','문학 모임'],[21,'home','원고 수정'],[23,'home','잠자기']],
 harvey:[
  [0,'home','잠자기'],[6,'home','아침 식사'],[7,'clinic','진료 준비와 회진'],
  [12,'cafe','점심 식사'],[13,'clinic','환자 진료'],[18,'park','가벼운 산책'],
  [19,'cafe','책 읽기'],[21,'home','진료 기록 정리'],[23,'home','잠자기']],
 sam:[
  [0,'home','잠자기'],[8,'cafe','아침 식사'],[9,'studio','기타 연습'],
  [12,'burger','점심 식사'],[13,'studio','밴드 합주와 녹음'],
  [17,'square','버스킹 공연'],[19,'pub','친구들과 음악 대화'],
  [21,'studio','신곡 연습'],[23,'home','잠자기']],
 sebastian:[
  [0,'home','게임과 코딩'],[3,'home','잠자기'],[9,'home','기상과 아침'],
  [11,'studio','음향 장비 조정'],[14,'cafe','커피 마시기'],
  [15,'studio','음악 믹싱'],[18,'gym','실내 운동'],
  [20,'pub','친구들과 보드게임'],[23,'home','코딩 후 휴식']],
 shane:[
  [0,'home','잠자기'],[7,'ranch','동물 먹이 주기'],
  [9,'market','상품 진열과 재고 확인'],[12,'burger','점심 식사'],
  [13,'market','계산과 배송 확인'],[18,'pub','저녁 식사'],
  [21,'home','정리와 휴식'],[23,'home','잠자기']],
 haley:[
  [0,'home','잠자기'],[8,'cafe','아침과 일정 확인'],
  [9,'studio','사진 촬영 준비'],[11,'square','거리 사진 촬영'],
  [12,'icecream','디저트 먹기'],[14,'greenhouse','꽃 사진 촬영'],
  [16,'pool','수영과 휴식'],[18,'cafe','촬영 사진 정리'],
  [21,'home','피부 관리와 취침 준비'],[23,'home','잠자기']],
 leah:[
  [0,'home','잠자기'],[7,'greenhouse','식물 관찰과 스케치'],
  [10,'workshop','조각 작업'],[12,'cafe','점심 식사'],
  [13,'workshop','목공과 도구 정비'],[16,'museum','전시 관람'],
  [19,'ranch','동물 스케치'],[21,'home','그림 정리와 휴식'],
  [23,'home','잠자기']],
 maru:[
  [0,'home','잠자기'],[7,'cafe','아침 식사'],[8,'greenhouse','식물 데이터 관찰'],
  [10,'clinic','의료 장비 점검'],[12,'cafe','점심 식사'],
  [13,'clinic','연구 장비 테스트'],[16,'greenhouse','표본 분석'],
  [18,'studio','전자 장비 수리'],[21,'home','연구 노트 기록'],
  [23,'home','잠자기']],
 penny:[
  [0,'home','잠자기'],[6,'home','아침 식사'],[8,'library','대출 도서 정리'],
  [12,'cafe','점심 식사'],[13,'bookstore','어린이 도서 고르기'],
  [15,'library','독서 모임 지도'],[18,'icecream','디저트 먹기'],
  [20,'park','공원 산책'],[22,'home','독서 후 취침']],
 abigail:[
  [0,'home','잠자기'],[9,'square','아침 산책'],
  [10,'museum','전시품 둘러보기'],[12,'burger','점심 식사'],
  [13,'library','모험 소설 읽기'],[15,'park','산책과 친구 만나기'],
  [17,'square','주민들과 게임'],[20,'pub','친구들과 대화'],
  [23,'home','잠자기']],
 emily:[
  [0,'home','잠자기'],[7,'workshop','옷감 재단과 재봉'],
  [10,'market','원단과 소품 구입'],[12,'cafe','점심 식사'],
  [13,'workshop','옷 수선과 제작'],[17,'icecream','휴식과 디저트'],
  [18,'square','주민 행사 준비'],[20,'pub','친구들과 저녁'],
  [22,'home','옷 정리 후 취침']]
};
// Visible three-step behavior loops while NPCs remain at each venue.
const TASK_STEPS=Object.freeze({
 home:['개인 정리','휴식','하루 기록'],pool:['준비 운동','수영 연습','수건 정리'],
 ranch:['동물 상태 확인','먹이와 물 관리','우리 정리'],gym:['스트레칭','운동 기구 사용','회복 운동'],
 burger:['메뉴 고르기','주문과 식사','식탁 정리'],icecream:['메뉴 고르기','디저트 먹기','친구와 이야기'],
 pub:['테이블 찾기','저녁 식사','동행과 대화'],museum:['전시 관람','작품 감상','관람 기록'],
 greenhouse:['화분 확인','식물 관찰','물과 환경 점검'],cafe:['주문하기','음료 마시기','일정 정리'],
 bookstore:['서가 둘러보기','책 선택하기','책 정리'],clinic:['진료 준비','진찰·점검','진료 기록'],
 library:['책 고르기','읽기·필기','도서 정리'],studio:['장비 점검','녹음·연습','음원 확인'],
 market:['상품 확인','판매·구매','재고 정리'],square:['주민 만나기','행사·놀이','주변 정리'],
 workshop:['작업 재료 준비','제작·수선','작업 도구 정리'],park:['산책','운동·관찰','쉬기']
});
function behaviorStages(place,activity){
 if(!Object.hasOwn(TASK_STEPS,place))return [activity,activity,activity];
 if(place==='home'&&/잠|취침|수면/.test(activity))return ['잠자기','잠자기','잠자기'];
 const stages=TASK_STEPS[place];
 return [stages[0],activity,stages[2]];
}
const STORAGE_KEY='wordville:resident-schedules:v1';
const overrides=Object.create(null);
function hourOf(minute){
 if(!Number.isFinite(minute))return 0;
 return ((Math.floor(minute/60)%24)+24)%24; // 24:00 => next day's 00:00
}
function formatHour(h){return String(h).padStart(2,'0')+':00';}
function valid(id){return Object.hasOwn(BLOCKS,id);}
function load(){
 try {
  const stored=JSON.parse(root.localStorage?.getItem(STORAGE_KEY)||'{}');
  if(!stored||typeof stored!=='object'||Array.isArray(stored))return;
  for(const id of Object.keys(BLOCKS)){
   const rows=stored[id];if(!rows||typeof rows!=='object')continue;
   for(const [key,obj] of Object.entries(rows)){
    const hour=Number(key);
    if(!Number.isInteger(hour)||hour<0||hour>23||!obj||!Object.hasOwn(PLACE_NAMES,obj.place)
       ||typeof obj.activity!=='string'||obj.activity.trim().length===0||obj.activity.length>36)continue;
    (overrides[id]||=(Object.create(null)))[hour]={place:obj.place,activity:obj.activity.trim()};
   }
  }
 }catch(_){/* private browsing or invalid storage: use safe defaults */}
}
function persist(){
 try{root.localStorage?.setItem(STORAGE_KEY,JSON.stringify(overrides));root.document?.dispatchEvent(new Event('wordville-record-changed'));return true;}
 catch(_){return false;}
}
function at(id,minute){
 if(!valid(id))return null;
 const hour=hourOf(minute);
 let base=BLOCKS[id][0];
 for(const row of BLOCKS[id]){
  if(row[0]>hour)break;
  base=row;
 }
 const custom=overrides[id]?.[hour];
 return {hour,place:custom?.place||base[1],activity:custom?.activity||base[2],
  placeName:PLACE_NAMES[custom?.place||base[1]],custom:!!custom};
}
function day(id){
 if(!valid(id))return [];
 return Array.from({length:24},(_,hour)=>at(id,hour*60));
}
function setHour(id,hour,place,activity){
 if(!valid(id)||!Number.isInteger(hour)||hour<0||hour>=24||!Object.hasOwn(PLACE_NAMES,place)
    ||typeof activity!=='string'||!activity.trim()||activity.trim().length>36)throw Error('시간·장소·활동을 확인해 주세요.');
 (overrides[id]||=(Object.create(null)))[hour]={place,activity:activity.trim()};
 return persist();
}
function resetHour(id,hour){
 if(!valid(id)||!Number.isInteger(hour)||hour<0||hour>=24)throw Error('올바른 주민과 시간을 선택해 주세요.');
 if(overrides[id])delete overrides[id][hour];
 return persist();
}
function occupants(place,minute){
 return Object.keys(BLOCKS).filter(id=>at(id,minute).place===place);
}
function minuteNow(date=new Date()){return date.getHours()*60+date.getMinutes();}
for(const [id,blocks] of Object.entries(BLOCKS)){
 if(blocks[0][0]!==0)throw Error('Schedule must start at 00:00: '+id);
 let last=-1;
 for(const [hour,place,activity] of blocks){
  if(hour<=last||hour>23||!Object.hasOwn(PLACE_NAMES,place)||!activity)throw Error('Invalid schedule: '+id);
  last=hour;
 }
}
load();
const api={PLACE_NAMES,BLOCKS,TASK_STEPS,behaviorStages,STORAGE_KEY,at,day,setHour,resetHour,occupants,
 hourOf,formatHour,minuteNow};
root.WordvilleSchedule=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
