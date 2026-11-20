/* Localize schedule displays without rewriting the Korean source schedules. */
(function(root){
'use strict';
const langs=['ko','en','zh-CN','ja'];
const placeWords={
 home:['집','Home','家','家'],pool:['수영장','Swimming pool','游泳池','プール'],
 ranch:['목장','Ranch','牧场','牧場'],gym:['헬스장','Gym','健身房','ジム'],
 burger:['햄버거 가게','Burger shop','汉堡店','ハンバーガー店'],
 icecream:['아이스크림 가게','Ice cream shop','冰淇淋店','アイスクリーム店'],
 pub:['펍','Pub','酒吧','パブ'],museum:['미술관','Museum','美术馆','美術館'],
 greenhouse:['식물원','Botanical garden','植物园','植物園'],cafe:['카페','Café','咖啡馆','カフェ'],
 bookstore:['서점','Bookstore','书店','書店'],clinic:['진료소','Clinic','诊所','診療所'],
 library:['도서관','Library','图书馆','図書館'],studio:['음악 작업실','Music studio','音乐工作室','音楽スタジオ'],
 market:['시장','Market','市场','市場'],square:['마을 광장','Town square','村庄广场','村の広場'],
 workshop:['공방','Workshop','工作坊','工房'],park:['공원','Park','公园','公園']
};
const words={
 auto:['실제 시각','Current time','当前时间','現在時刻'],
 morning:['낮','Day','白天','昼'],dusk:['저녁','Dusk','傍晚','夕方'],night:['밤','Night','夜晚','夜'],
 preview:['일정 미리보기','Schedule preview','日程预览','予定プレビュー'],
 clock:['실제 시각','Local time','当地时间','現地時刻'],
 current:['현재','Now','当前','現在'],
 edited:['수정됨','Edited','已编辑','編集済み'],
 edit:['수정','Edit','编辑','編集'],
 editTime:['일정 수정','Edit schedule','编辑日程','予定を編集'],
 nextDay:['다음 날','Next day','次日','翌日'],
 moving:['이동 중','On the way','前往途中','移動中'],
 doing:['활동 중','Doing','正在活动','活動中'],
 talk:['와 대화 중','Talking with','正在与…交谈','と会話中'],
 write:['게시글 작성 중','Writing a board post','正在撰写留言','掲示板に投稿中'],
 pending:['활동 번역 중…','Translating activity…','正在翻译活动…','活動を翻訳中…'],
 unavailable:['활동 내용','Daily activity','日常活动','日々の活動'],
 save:['이 시간 저장','Save this hour','保存此时段','この時間を保存'],
 reset:['기본 일정으로','Reset hour','恢复默认日程','既定の予定に戻す'],
 cancel:['닫기','Close','关闭','閉じる'],
 success:['일정을 저장했습니다.','Schedule saved.','日程已保存。','予定を保存しました。']
};
const common={
 '잠자기':['Sleep','睡觉','睡眠'],
 '아침 식사':['Have breakfast','吃早餐','朝食をとる'],
 '점심 식사':['Have lunch','吃午饭','昼食をとる'],
 '저녁 식사':['Have dinner','吃晚饭','夕食をとる'],
 '기상과 아침':['Wake up and have breakfast','起床并吃早餐','起床して朝食'],
 '일기 쓰고 취침':['Write a diary and sleep','写日记后睡觉','日記を書いて就寝'],
 '카메라를 들고 사진 찍기':['Take photos with a camera','用相机拍照','カメラで写真を撮る'],
 '음식 만들어 먹기':['Cook a meal','做饭','料理して食べる'],
 '토벌하러 가기':['Go on a quest','外出讨伐','討伐に出かける'],
 '우사기 랩 하기':['Perform Usagi rap','进行乌萨奇说唱','うさぎラップをする'],
 '제초 5급 시험 공부':['Study for the weeding exam','备考除草五级考试','草むしり検定5級の勉強'],
 '잡초 뽑기':['Pull weeds','除草','草むしり'],
 '책 읽기':['Read a book','读书','読書'],
 '차를 마시며 독서':['Read while drinking tea','边喝茶边读书','お茶を飲みながら読書'],
 '산책':['Take a walk','散步','散歩'],
 '공원 산책':['Walk in the park','公园散步','公園を散歩'],
 '편지를 쓰고 취침':['Write a letter and sleep','写信后睡觉','手紙を書いて就寝'],
 '하루를 기록하고 취침':['Journal before bed','睡前记录一天','一日を記録して就寝'],
 '독서 후 취침':['Read before bed','读书后睡觉','読書して就寝'],
 '서예 연습 후 취침':['Practice calligraphy before bed','睡前练习书法','書道の練習後に就寝'],
 '하루 기록':['Record the day','记录一天','一日を記録'],
 '장소 방문':['Visit a place','访问地点','場所を訪問']
};
const language=()=>root.WordvilleI18n?.language||'ko';
const idx=lang=>Math.max(0,langs.indexOf(lang||language()));
const tr=(key,lang)=>words[key]?.[idx(lang)]||key;
function place(id,lang){return placeWords[id]?.[idx(lang)]||id;}
function knownAction(raw,lang=language()){
 if(idx(lang)===0)return String(raw||'');
 return common[String(raw||'')]?.[idx(lang)-1]||null;
}
function activity(raw,lang=language()){
 const s=String(raw||'');
 if(idx(lang)===0||!/[가-힣]/.test(s))return s;
 return knownAction(s,lang)||root.WordvilleVocabularyLocale?.display?.(s,lang)||tr('unavailable',lang);
}
function bindAction(node,raw,lang=language()){
 if(!node)return;
 const known=knownAction(raw,lang);
 node.removeAttribute('data-wv-original-gloss');
 if(idx(lang)===0||known||!/[가-힣]/.test(String(raw))){
  node.textContent=known||String(raw||'');
  return;
 }
 if(lang===language()&&root.WordvilleVocabularyLocale?.bindText){
  root.WordvilleVocabularyLocale.bindText(node,String(raw||''));
 }else node.textContent=tr('unavailable',lang);
}
function appendSlot(node,slot,lang=language()){
 if(!node||!slot)return;
 const site=root.document?.createElement('strong'),task=root.document?.createElement('span');
 if(!site||!task)return;
 site.textContent=place(slot.place,lang)+' · ';
 bindAction(task,slot.activity,lang);
 node.replaceChildren(site,task);
}
root.WordvilleScheduleLocale={place,tr,activity,knownAction,bindAction,appendSlot,language};
if(typeof module!=='undefined')module.exports=root.WordvilleScheduleLocale;
})(globalThis);
