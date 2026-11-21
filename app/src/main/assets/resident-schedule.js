/* Deterministic 24-hour daily routines for Wordville residents.
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
const PRIMARY_PLACES=Object.freeze({
 momo:'library',aizen:'bookstore',hachiware:'icecream',chiikawa:'burger',
 toshiro:'pool',homura:'museum',rakko:'greenhouse',madoka:'cafe',kurimanju:'pub',usagi:'workshop'
});
const PRIMARY_START=9;
const PRIMARY_END=17;
const mascotActivities=Object.freeze({
 study:'제초 5급 시험 공부',
 weed:'잡초 뽑기',
 photo:'카메라를 들고 사진 찍기',
 cook:'음식 만들어 먹기',
 patrol:'토벌하러 가기',
 rap:'우사기 랩 하기'
});
function daytime(id,[morning,lunch,afternoon]){
 const place=PRIMARY_PLACES[id];
 return [[PRIMARY_START,place,morning],[12,place,lunch],[14,place,afternoon]];
}
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
  [17,'square','게시판에 새 공고 작성'],[20,'pub','친구들과 대화'],
  [23,'home','잠자기']],
 emily:[
  [0,'home','잠자기'],[7,'workshop','옷감 재단과 재봉'],
  [10,'market','원단과 소품 구입'],[12,'cafe','점심 식사'],
  [13,'workshop','옷 수선과 제작'],[17,'icecream','휴식과 디저트'],
  [18,'square','게시판에 주민 행사 안내 작성'],[20,'pub','친구들과 저녁'],
  [22,'home','옷 정리 후 취침']],
 chiikawa:[
  [0,'home','잠자기'],[6,'home',mascotActivities.study],[7,'park',mascotActivities.weed],
  ...daytime('chiikawa',["햄버거 가게 개점과 재료 준비","손님 주문받고 햄버거 조리","조리대 청소와 손님 응대"]),
  [17,'park',mascotActivities.weed],[18,'market','집에 가져갈 간식 고르기'],
  [19,'home',mascotActivities.study],[21,'home','간식 정리 후 취침']],
 hachiware:[
  [0,'home','잠자기'],[6,'home',mascotActivities.cook],[7,'park',mascotActivities.photo],
  ...daytime('hachiware',["아이스크림 재료와 냉동고 점검","아이스크림 만들고 손님 주문받기","새 메뉴 개발과 매장 정리"]),
  [17,'square',mascotActivities.patrol],[18,'park',mascotActivities.photo],
  [19,'home',mascotActivities.cook],[21,'home','일기 쓰고 취침']],
 usagi:[
  [0,'home','잠자기'],[7,'park','뜀뛰기'],
  ...daytime('usagi',["공방 개점과 나무 재료 확인","장난감 제작과 손님 판매","완성품 진열과 공구 정리"]),
  [17,'icecream','아이스크림 고르기'],[20,'park',mascotActivities.rap],[22,'home','간식 먹고 취침']],
 rakko:[
  [0,'home','잠자기'],[6,'gym','아침 체력 훈련'],
  ...daytime('rakko',["식물원 개원과 화분 관리","관람객에게 식물 설명하기","온실 점검과 어린 식물 물 주기"]),
  [17,'park','후배와 산책'],[21,'home','장비 정리 후 취침']],
 kurimanju:[
  [0,'home','잠자기'],[8,'market','펍에 가져갈 간식 고르기'],
  ...daytime('kurimanju',["펍 개점 준비와 테이블 점검","손님 맞이와 간단한 안주 만들기","음료 제공과 매장 정리"]),
  [18,'park','저녁 산책'],[22,'home','컵 정리 후 취침']],
 momo:[
  [0,'home','잠자기'],[7,'greenhouse','꽃에 물 주기'],
  ...daytime('momo',["도서관 대출·반납 준비","대출·반납 접수와 열람실 안내","추천 도서 진열과 서가 정리"]),
  [17,'park','토시로와 약속한 산책'],[20,'home','편지를 쓰고 취침']],
 toshiro:[
  [0,'home','잠자기'],[6,'gym','아침 수련'],
  ...daytime('toshiro',["수영장 개장 전 안전 점검","수영 강습과 수영객 안전 관리","수영장 마감 점검과 수건 정리"]),
  [17,'park','모모와 약속한 산책'],[20,'home','하루를 기록하고 취침']],
 aizen:[
  [0,'home','잠자기'],[7,'library','서예 자료 읽기'],
  ...daytime('aizen',["서점 개점과 신간 진열","책 추천과 손님 계산 돕기","서가 정리와 판매 마감"]),
  [17,'cafe','차를 마시며 생각 정리'],[22,'home','서예 연습 후 취침']],
 homura:[
  [0,'home','잠자기'],[7,'bookstore','전시 도록 고르기'],
  ...daytime('homura',["미술관 개관과 전시품 점검","관람객 안내와 전시 해설","작품 상태 확인과 전시 도록 정리"]),
  [17,'square','마도카에게 줄 엽서를 들고 먼저 기다리기'],
  [18,'square','마도카에게 먼저 마음을 전하기'],[21,'home','만남을 일기에 쓰고 취침']],
 madoka:[
  [0,'home','잠자기'],[8,'ranch','작은 동물 돌보기'],
  ...daytime('madoka',["카페 개점과 원두·재료 점검","음료 제조와 손님 계산","디저트 진열과 컵·테이블 정리"]),
  [17,'workshop','호무라에게 줄 리본 묶기'],
  [18,'square','호무라를 만나 마음에 답하기'],[21,'home','리본 정리 후 취침']]
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
const WORK_STEPS=Object.freeze({
  burger:['식재료 확인','주문·조리·응대','조리 공간 정리'],
  icecream:['냉동고 점검','디저트 제조·판매','재료 보충'],
  workshop:['도구 점검','제작·판매','완성품 진열'],
  greenhouse:['화분·온실 점검','관람객 안내·관리','급수·정리'],
  pub:['테이블 준비','손님 안내·음료 제공','매장 마감'],
  library:['반납 도서 정리','자료 안내·대출','서가 정돈'],
  pool:['안전 설비 점검','강습·안전 관리','시설 정리'],
  bookstore:['신간 진열','도서 추천·계산','서가 정리'],
  museum:['전시품 점검','관람객 안내·해설','전시실 정리'],
  cafe:['원두·재료 준비','음료 제조·판매','컵·테이블 정리']
});
const mascotSteps=new Map([
 [mascotActivities.study,['제초 문제집 펴기','오답 다시 보기']],
 [mascotActivities.weed,['잡초가 난 자리 살피기','뽑은 잡초 모으기']],
 [mascotActivities.photo,['카메라 꺼내기','찍은 사진 확인하기']],
 [mascotActivities.cook,['재료 손질하기','식기 정리하기']],
 [mascotActivities.patrol,['토벌 준비하기','토벌 결과 기록하기']],
 [mascotActivities.rap,['박자 맞추기','랩 마무리하기']]
]);
function behaviorStages(place,activity){
 if(!Object.hasOwn(TASK_STEPS,place))return [activity,activity,activity];
 if(place==='home'&&/잠|취침|수면/.test(activity))return ['잠자기','잠자기','잠자기'];
 const steps=mascotSteps.get(activity);
 if(steps)return [steps[0],activity,steps[1]];
 const work=WORK_STEPS[place];
 if(work&&/근무|개점|개관|개장|주문|손님|판매|계산|안내|관람객|안전|서가|진열|제조|조리|강습|대출|반납|전시|화분 관리|온실 점검|매장 정리|마감|재료|공구 정리|음료 제공/.test(activity))
  return [work[0],activity,work[2]];
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
const api={PLACE_NAMES,BLOCKS,PRIMARY_PLACES,PRIMARY_START,PRIMARY_END,TASK_STEPS,behaviorStages,STORAGE_KEY,at,day,setHour,resetHour,occupants,
 hourOf,formatHour,minuteNow};
root.WordvilleSchedule=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
