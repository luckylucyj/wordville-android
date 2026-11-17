/* All private rooms use the existing medium venue grid. Fixtures are also the
 * source of collision rectangles, so a layout edit moves both art and collision. */
(function(root){
'use strict';
const BACK_WALL_ROWS=4;
const prop=(kind,x,y,w,h,label,art=kind)=>({kind,x,y,w,h,label,art});
const bed=(x,y)=>prop('bed',x,y,5,5,'침대');
const sofa=(x,y)=>prop('sofa',x,y,6,3,'소파');
const plant=(x,y)=>prop('planter',x,y,2,2,'화분');
const books=(x,y,w=4)=>prop('shelf',x,y,w,3,'책장');
// Wall, shaded wall, floor, floor seam, wood, accent, shade, textile trim.
function guestRoom(theme, colors, wall, window, fixture, variant){
 const bedX=variant%2===0?2:17, counterX=variant%2===0?17:2;
 return {
  theme,colors,wall,window,windowX:96,floor:variant<5?'plank':'parquet',rug:[7,8,10,6],
  fixtures:[bed(bedX,4),fixture(counterX,5),books(10,4,4),plant(2+variant,14),
   prop('table',9,9+variant%3,4,2,'찻잔과 탁자','tea'),sofa(16,13)]
 };
}
const rooms={
 alex:{
  theme:['스포츠 훈련실','Training room','运动训练室','トレーニングルーム'],
  colors:['#9eb7aa','#698b80','#d2a675','#b1805d','#835637','#588d67','#305a48','#f1c777'],
  wall:'trophy',window:'blind',windowX:9,floor:'parquet',rug:[9,8,8,5],
  fixtures:[bed(2,4),prop('equipment',17,5,5,3,'웨이트 벤치','weights'),prop('shelf',10,4,4,2,'트로피 진열장','display'),prop('table',3,11,4,2,'공과 스포츠 용품','sports'),sofa(16,12),plant(21,9)]
 },
 elliott:{
  theme:['해안가 작가의 서재','Coastal writer’s study','海滨作家书房','海辺の作家の書斎'],
  colors:['#994d54','#69343d','#bd8a62','#8e5949','#683d3a','#526d9a','#363e66','#dfb875'],
  wall:'portrait',window:'arch',windowX:168,floor:'plank',rug:[7,9,12,6],
  fixtures:[books(2,4,5),prop('desk',16,5,6,3,'타자기가 놓인 집필 책상','writer'),prop('bed',16,11,6,5,'침대'),prop('sofa',2,9,5,3,'독서용 소파'),prop('table',8,10,3,2,'편지와 찻잔','tea'),plant(2,14)]
 },
 harvey:{
  theme:['항공 수집가의 서재','Aviation collector’s study','航空收藏家的书房','航空コレクターの書斎'],
  colors:['#b4ccbb','#789e91','#bdc6bb','#92a399','#795e47','#6c9c92','#3c6764','#e9d194'],
  wall:'plane',window:'blind',windowX:126,floor:'tile',rug:[8,9,8,6],
  fixtures:[prop('desk',2,5,6,3,'무전기 책상','radio'),books(10,4,4),bed(17,4),prop('shelf',2,11,4,3,'모형 비행기 진열대','display'),sofa(16,12),plant(20,10)]
 },
 sam:{
  theme:['밴드 연습실','Band rehearsal room','乐队排练室','バンド練習室'],
  colors:['#d89968','#ad604f','#ddae77','#bf845e','#784c3d','#c16c44','#843f39','#f9db75'],
  wall:'record',window:'plain',windowX:24,floor:'parquet',rug:[8,8,12,6],
  fixtures:[bed(2,4),prop('equipment',12,4,5,3,'기타와 앰프','guitar'),prop('desk',18,8,4,3,'믹싱 테이블','radio'),sofa(2,11),prop('table',10,10,4,2,'레코드 플레이어','radio'),prop('counter',18,13,4,2,'스케이트보드 수납대','skate')]
 },
 sebastian:{
  theme:['심야 개발 작업실','Late-night coding studio','深夜编程工作室','深夜の開発部屋'],
  colors:['#66677d','#45475e','#747180','#565269','#40374e','#827aa9','#504768','#b3dfcb'],
  wall:'moon',window:'night',windowX:157,floor:'tile',rug:[9,8,11,6],
  fixtures:[prop('desk',2,4,7,3,'듀얼 모니터 개발 책상','computer'),bed(17,4),prop('counter',12,4,3,2,'PC 본체','radio'),prop('sofa',15,12,7,3,'회색 소파'),prop('table',3,11,4,3,'보드게임 테이블','kit'),plant(21,10)]
 },
 shane:{
  theme:['닭을 돌보는 농가','Poultry keeper’s cottage','养鸡人的农舍','ニワトリ飼育の家'],
  colors:['#b6aa86','#837b62','#bf936c','#9a704e','#6f5343','#748c72','#4c695b','#f0ce8d'],
  wall:'hen',window:'plain',windowX:91,floor:'plank',rug:[8,9,9,6],
  fixtures:[bed(16,4),prop('shelf',2,4,5,3,'모이와 장갑 선반','display'),prop('counter',10,4,4,2,'주방 싱크대','sink'),prop('table',3,10,4,3,'달걀 바구니와 모이 통','eggs'),sofa(16,12),plant(20,10)]
 },
 haley:{
  theme:['햇살 사진 작업실','Sunlit photography studio','阳光摄影工作室','陽だまりの写真室'],
  colors:['#f2c7c4','#cc929f','#ecc89d','#d7a884','#9c6765','#df8ca4','#af5d83','#fff1b1'],
  wall:'photos',window:'wide',windowX:22,floor:'plank',rug:[7,8,13,6],
  fixtures:[prop('sofa',2,5,6,3,'분홍 소파'),prop('desk',16,4,6,3,'사진 편집 책상','computer'),prop('equipment',17,9,4,3,'삼각대 카메라','camera'),prop('bed',2,10,5,5,'침대'),prop('table',10,10,4,2,'인화 사진 테이블','photos'),plant(21,14)]
 },
 leah:{
  theme:['숲속 공방','Woodland art studio','森林艺术工作室','森のアトリエ'],
  colors:['#c4c99f','#92a375','#c4956a','#a37252','#80543e','#8d9c60','#506c4e','#efc882'],
  wall:'landscape',window:'plain',windowX:23,floor:'parquet',rug:[8,9,10,6],
  fixtures:[prop('equipment',2,5,5,3,'풍경화 이젤','easel'),prop('desk',16,4,6,3,'조각 작업대','kit'),books(11,4),prop('bed',17,10,5,5,'침대'),prop('table',3,11,4,3,'물감과 붓','photos'),plant(2,14),plant(8,5)]
 },
 maru:{
  theme:['별 관측과 발명 연구실','Astronomy and invention lab','天文与发明实验室','天体観測と発明の研究室'],
  colors:['#6d80a9','#4e5b87','#acb8d0','#8693b0','#505d7b','#77abae','#426974','#f1cf80'],
  wall:'stars',window:'observatory',windowX:156,floor:'tile',rug:[8,9,11,5],
  fixtures:[prop('desk',2,4,6,3,'전자 부품 실험대','computer'),prop('equipment',17,5,4,3,'망원경','telescope'),prop('shelf',11,4,4,3,'부품 서랍','display'),bed(2,10),prop('table',15,11,5,3,'조립 중인 로봇','robot'),plant(21,13)]
 },
 penny:{
  theme:['독서와 과외의 방','Reading and tutoring room','阅读与辅导室','読書と勉強の部屋'],
  colors:['#e4d6ab','#bea77e','#dcb085','#b78863','#866149','#88a181','#647a60','#f7dc9b'],
  wall:'landscape',window:'drape',windowX:97,floor:'plank',rug:[7,9,12,6]
 },
 abigail:{
  theme:['모험가의 수집실','Adventurer’s collection room','冒险家收藏室','冒険家のコレクション部屋'],
  colors:['#84749f','#5b527b','#b998a8','#957487','#674861','#a47db6','#694e91','#f2c879'],
  wall:'sword',window:'night',windowX:40,floor:'parquet',rug:[8,8,9,7],
  fixtures:[bed(2,4),prop('shelf',16,4,6,3,'자수정과 광물 진열장','display'),prop('equipment',3,11,4,3,'모험 배낭과 장비','kit'),sofa(16,12),prop('table',10,9,4,3,'게임기와 주사위','radio'),plant(21,9)]
 },
 emily:{
  theme:['색실과 직물 재봉실','Textile and sewing studio','彩线与布艺缝纫室','色糸と布の裁縫室'],
  colors:['#8dbab5','#5e9695','#e3b58c','#c79070','#865154','#cb7293','#9b536f','#ffe286'],
  wall:'quilt',window:'arch',windowX:155,floor:'plank',rug:[7,8,12,7],
  fixtures:[prop('desk',2,5,7,3,'재봉틀 작업대','sewing'),prop('shelf',16,4,6,3,'직물과 색실 수납장','display'),prop('table',10,10,5,3,'천을 재단하는 테이블','photos'),bed(17,10),prop('sofa',2,12,5,3,'쿠션 소파'),plant(21,8)]
 },
 chiikawa:guestRoom(['작은 풀밭 오두막','Meadow cottage','草地小屋','草原の小屋'],
  ['#edddcf','#bfaa9f','#e9c09b','#c89b7c','#875d55','#dc9ead','#ad7581','#f9e7a8'],
  'landscape','arch',(x,y)=>prop('shelf',x,y,5,3,'간식 선반','display'),0),
 hachiware:guestRoom(['파란 책 읽는 방','Blue reading room','蓝色读书房','青い読書部屋'],
  ['#adc7dd','#779cbe','#c7ac97','#9f8370','#765d57','#658fbe','#456da0','#f1dfac'],
  'landscape','plain',(x,y)=>prop('desk',x,y,5,3,'모험 일기 책상','writer'),1),
 usagi:guestRoom(['노란 놀이방','Sunny playroom','黄色游戏室','黄色い遊び部屋'],
  ['#e9cd8d','#c69d58','#e5bc86','#bd9565','#905e43','#dfab50','#b37a3e','#fff0aa'],
  'record','wide',(x,y)=>prop('equipment',x,y,5,3,'놀이 도구','kit'),2),
 rakko:guestRoom(['훈련과 휴식의 방','Training retreat','训练休息室','稽古と休息の部屋'],
  ['#b3b0a0','#888a7c','#d4ad8c','#ab896c','#775e53','#8eaa9f','#557b73','#e6ce9f'],
  'trophy','blind',(x,y)=>prop('equipment',x,y,5,3,'훈련 기구','weights'),3),
 kurimanju:guestRoom(['밤색 간식방','Chestnut tea room','栗色茶室','栗色のお茶の間'],
  ['#daba8e','#b68767','#d3a077','#a87657','#805943','#be8154','#925a44','#f4d796'],
  'quilt','drape',(x,y)=>prop('counter',x,y,5,3,'간식 만드는 조리대','sink'),4),
 momo:guestRoom(['꽃과 편지의 방','Flowers and letters','花与信笺的房间','花と手紙の部屋'],
  ['#e7c1bc','#c7969e','#d9af8d','#b08570','#835c60','#c788a1','#9f5f7f','#f5d5a7'],
  'quilt','arch',(x,y)=>prop('desk',x,y,5,3,'편지 쓰는 책상','writer'),5),
 toshiro:guestRoom(['서늘한 수련실','Frost training room','冰霜训练室','氷の稽古部屋'],
  ['#a6c6cf','#7096a8','#b4bdc9','#8795a5','#586a7d','#76b2b5','#4b8294','#d5ebe3'],
  'trophy','blind',(x,y)=>prop('equipment',x,y,5,3,'수련 기구','weights'),6),
 aizen:guestRoom(['서예와 독서의 서재','Calligraphy study','书法书房','書道の書斎'],
  ['#c6af93','#9d826a','#c49976','#976d56','#614a43','#99806f','#736057','#ebcc93'],
  'portrait','plain',(x,y)=>prop('desk',x,y,5,3,'붓과 종이','writer'),7),
 homura:guestRoom(['보라색 시계방','Violet clock room','紫色时钟室','紫の時計の部屋'],
  ['#a19ab9','#6f668a','#a199ac','#776d89','#534865','#846da7','#5c4b84','#d3c7eb'],
  'moon','night',(x,y)=>prop('desk',x,y,5,3,'시계 수리 책상','kit'),8),
 madoka:guestRoom(['분홍 리본 공방','Pink ribbon room','粉色丝带工坊','ピンクのリボン工房'],
  ['#f1c4d1','#d596ad','#e6bea9','#c39692','#906569','#d982ab','#ae618c','#fde3ab'],
  'quilt','wide',(x,y)=>prop('desk',x,y,5,3,'리본과 재봉틀','sewing'),9)
};
const get=id=>Object.hasOwn(rooms,id)?rooms[id]:null;
const mapId=id=>get(id)?id+'Home':'home';
const forMap=id=>id?.endsWith('Home')?get(id.slice(0,-4)):null;
root.WordvilleHomes={get,mapId,forMap,BACK_WALL_ROWS};
})(globalThis);
