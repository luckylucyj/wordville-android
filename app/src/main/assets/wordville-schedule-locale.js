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
const extra=Object.fromEntries([["아침 식사와 준비","Have breakfast and get ready","吃早餐并做准备","朝食と身支度"],["근력 운동","Strength training","力量训练","筋力トレーニング"],["달리기 지도","Coach runners","指导跑步","ランニング指導"],["운동 회원 지도","Coach gym members","指导健身会员","ジム会員の指導"],["수영 훈련","Swim training","游泳训练","水泳トレーニング"],["저녁과 휴식","Dinner and rest","晚餐和休息","夕食と休息"],["친구들과 대화","Chat with friends","与朋友聊天","友達とおしゃべり"],["샤워 후 취침","Shower then sleep","洗澡后睡觉","シャワー後に就寝"],["신간 정리","Organize new books","整理新书","新刊の整理"],["시집 집필","Write poetry","写诗集","詩集の執筆"],["전시 감상","Visit an exhibition","欣赏展览","展覧会を鑑賞"],["문학 모임","Literature club","文学聚会","文学サークル"],["원고 수정","Edit a manuscript","修改手稿","原稿の推敲"],["진료 준비와 회진","Prepare for consultations and rounds","准备诊疗和查房","診察準備と回診"],["환자 진료","See patients","诊治患者","患者の診察"],["가벼운 산책","Take a short walk","轻松散步","軽い散歩"],["진료 기록 정리","Organize medical records","整理诊疗记录","診療記録の整理"],["기타 연습","Practice guitar","练习吉他","ギターの練習"],["밴드 합주와 녹음","Band rehearsal and recording","乐队合奏与录音","バンド練習と録音"],["버스킹 공연","Play street music","街头表演","路上ライブ"],["친구들과 음악 대화","Talk music with friends","与朋友聊音乐","友達と音楽談義"],["신곡 연습","Rehearse a new song","练习新歌","新曲の練習"],["게임과 코딩","Games and coding","玩游戏和编程","ゲームとコーディング"],["음향 장비 조정","Adjust sound equipment","调试音响设备","音響機器の調整"],["커피 마시기","Drink coffee","喝咖啡","コーヒーを飲む"],["음악 믹싱","Mix music","混音","音楽のミキシング"],["실내 운동","Exercise indoors","室内锻炼","室内トレーニング"],["친구들과 보드게임","Play board games with friends","与朋友玩桌游","友達とボードゲーム"],["코딩 후 휴식","Rest after coding","编程后休息","コーディング後の休息"],["동물 먹이 주기","Feed the animals","喂动物","動物に餌をあげる"],["상품 진열과 재고 확인","Stock shelves and check inventory","商品上架并检查库存","品出しと在庫確認"],["계산과 배송 확인","Handle checkout and deliveries","收银并确认配送","会計と配送確認"],["정리와 휴식","Tidy up and rest","整理和休息","片づけと休息"],["아침과 일정 확인","Breakfast and check plans","早餐并确认日程","朝食と予定確認"],["사진 촬영 준비","Prepare for a photo shoot","准备拍摄","撮影の準備"],["거리 사진 촬영","Take street photos","街头摄影","街の写真撮影"],["디저트 먹기","Enjoy dessert","吃甜点","デザートを食べる"],["꽃 사진 촬영","Photograph flowers","拍花卉","花の写真撮影"],["수영과 휴식","Swim and relax","游泳和休息","水泳と休息"],["촬영 사진 정리","Organize photos","整理拍摄的照片","撮影写真の整理"],["피부 관리와 취침 준비","Skin care and bedtime routine","护肤并准备睡觉","スキンケアと就寝準備"],["식물 관찰과 스케치","Observe and sketch plants","观察植物并写生","植物観察とスケッチ"],["조각 작업","Work on sculptures","制作雕塑","彫刻制作"],["목공과 도구 정비","Woodworking and tool care","木工及工具保养","木工と道具の手入れ"],["전시 관람","See an exhibition","参观展览","展示を見学"],["동물 스케치","Sketch animals","画动物速写","動物のスケッチ"],["그림 정리와 휴식","Organize artwork and rest","整理画作并休息","絵を片づけて休む"],["식물 데이터 관찰","Observe plant data","观察植物数据","植物データを観察"],["의료 장비 점검","Inspect medical equipment","检查医疗设备","医療機器を点検"],["연구 장비 테스트","Test research equipment","测试研究设备","研究機器のテスト"],["표본 분석","Analyze specimens","分析标本","標本を分析"],["전자 장비 수리","Repair electronics","维修电子设备","電子機器の修理"],["연구 노트 기록","Write research notes","记录研究笔记","研究ノートを書く"],["대출 도서 정리","Organize borrowed books","整理借阅图书","貸出図書の整理"],["어린이 도서 고르기","Choose children's books","挑选儿童读物","児童書を選ぶ"],["독서 모임 지도","Lead a reading group","组织读书会","読書会を指導"],["아침 산책","Morning walk","晨间散步","朝の散歩"],["전시품 둘러보기","Look around the exhibits","参观展品","展示品を見て回る"],["모험 소설 읽기","Read an adventure novel","读冒险小说","冒険小説を読む"],["산책과 친구 만나기","Walk and meet friends","散步并见朋友","散歩と友達との交流"],["주민들과 게임","Play games with villagers","与居民一起玩游戏","住民とゲーム"],["옷감 재단과 재봉","Cut fabric and sew","裁剪布料和缝纫","布の裁断と裁縫"],["원단과 소품 구입","Buy fabric and accessories","购买布料和配件","生地と小物を購入"],["옷 수선과 제작","Mend and make clothes","修补和制作衣服","衣服のお直しと制作"],["휴식과 디저트","Rest and dessert","休息并吃甜品","休息とデザート"],["주민 행사 준비","Prepare for village events","筹备居民活动","住民イベントの準備"],["친구들과 저녁","Dinner with friends","与朋友共进晚餐","友達と夕食"],["옷 정리 후 취침","Put away clothes and sleep","整理衣服后睡觉","服を片づけて就寝"],["햄버거 메뉴 살펴보기","Look at burger options","看看汉堡菜单","ハンバーガーのメニューを見る"],["햄버거 먹기","Eat a burger","吃汉堡","ハンバーガーを食べる"],["따뜻한 빵과 감자튀김 정리","Put away buns and fries","整理面包和薯条","パンとポテトを片づける"],["집에 가져갈 간식 고르기","Choose snacks to take home","挑选带回家的零食","持ち帰るおやつを選ぶ"],["간식 정리 후 취침","Tidy snacks and sleep","整理零食后睡觉","おやつを片づけて就寝"],["오늘의 아이스크림 맛 살펴보기","Check today's ice cream flavors","看看今天的冰淇淋口味","今日のアイスの味をチェック"],["아이스크림 맛보기","Taste ice cream","品尝冰淇淋","アイスクリームの試食"],["새 맛을 친구에게 추천하기","Recommend a new flavor to friends","向朋友推荐新口味","新しい味を友達にすすめる"],["뜀뛰기","Jump around","蹦蹦跳跳","ぴょんぴょん跳ねる"],["공방 재료 살펴보기","Look over workshop supplies","查看工坊材料","工房の材料を見る"],["나무 장난감 만들기","Make wooden toys","制作木制玩具","木のおもちゃを作る"],["장난감 색칠하고 공구 정리","Paint toys and put tools away","给玩具上色并整理工具","おもちゃの色塗りと工具の片づけ"],["아이스크림 고르기","Choose ice cream","挑选冰淇淋","アイスを選ぶ"],["간식 먹고 취침","Have a snack and sleep","吃零食后睡觉","おやつを食べて就寝"],["아침 체력 훈련","Morning fitness training","晨练","朝の体力トレーニング"],["화분 흙 상태 확인","Check potting soil","检查花盆土壤","鉢植えの土を確認"],["온실 꽃과 나무 살펴보기","Inspect greenhouse flowers and trees","查看温室里的花草树木","温室の花と木を見て回る"],["어린 식물에 물 주기","Water young plants","给幼苗浇水","苗に水をやる"],["후배와 산책","Walk with a junior colleague","与后辈散步","後輩と散歩"],["장비 정리 후 취침","Put equipment away then sleep","整理装备后睡觉","装備を片づけて就寝"],["펍에 가져갈 간식 고르기","Choose snacks for the pub","挑选带去酒吧的小吃","パブに持っていくおつまみを選ぶ"],["펍의 테이블 정리","Tidy pub tables","整理酒吧桌子","パブのテーブルを片づける"],["따뜻한 안주 맛보기","Taste warm bar snacks","品尝热乎的小吃","温かいおつまみを味見"],["친구들과 펍에서 한잔하기","Have a drink at the pub with friends","与朋友去酒吧喝一杯","友達とパブで一杯"],["저녁 산책","Evening walk","傍晚散步","夕方の散歩"],["컵 정리 후 취침","Wash cups then sleep","收拾杯子后睡觉","カップを片づけて就寝"],["꽃에 물 주기","Water the flowers","给花浇水","花に水をやる"],["반납 도서 정리","Sort returned books","整理归还图书","返却本の整理"],["창가에서 책 읽기","Read by the window","在窗边读书","窓辺で読書"],["토시로에게 추천할 책 고르기","Choose a book for Toshiro","挑选推荐给冬狮郎的书","冬獅郎にすすめる本を選ぶ"],["토시로와 약속한 산책","Go on a planned walk with Toshiro","与冬狮郎约好去散步","冬獅郎との約束の散歩"],["아침 수련","Morning training","晨间修炼","朝の稽古"],["준비 운동과 수영 연습","Warm up and practice swimming","热身并练习游泳","準備運動と水泳練習"],["수영 후 휴식","Rest after swimming","游泳后休息","水泳後の休息"],["기록 측정과 수건 정리","Check times and tidy towels","记录成绩并整理毛巾","記録測定とタオルの片づけ"],["모모와 약속한 산책","Go on a planned walk with Momo","与桃约好去散步","雛森との約束の散歩"],["서예 자료 읽기","Read calligraphy references","阅读书法资料","書道資料を読む"],["신간과 오래된 책 정리","Organize new and old books","整理新旧书籍","新刊と古書の整理"],["서예 책 읽기","Read a calligraphy book","读书法书籍","書道の本を読む"],["책 고르는 손님 돕기","Help customers choose books","帮助顾客选书","本を選ぶお客さんを手伝う"],["차를 마시며 생각 정리","Reflect over tea","边喝茶边整理思绪","お茶を飲みながら考えを整理"],["전시 도록 고르기","Choose exhibition catalogues","挑选展览画册","展示図録を選ぶ"],["오래된 시계 전시 관람","View antique clock exhibits","参观古钟表展览","古い時計の展示を見る"],["마도카가 좋아할 그림 찾아보기","Find artwork Madoka would like","寻找圆喜欢的画","まどかが好きそうな絵を探す"],["마도카에게 줄 엽서 고르기","Choose a postcard for Madoka","挑选送给圆的明信片","まどかに贈る絵はがきを選ぶ"],["마도카에게 줄 엽서를 들고 먼저 기다리기","Wait early with a postcard for Madoka","拿着给圆的明信片提前等候","まどかへの絵はがきを持って先に待つ"],["마도카에게 먼저 마음을 전하기","Tell Madoka how I feel first","先向圆表达心意","まどかに先に想いを伝える"],["만남을 일기에 쓰고 취침","Write about the meeting then sleep","在日记里写下相遇后睡觉","会ったことを日記に書いて就寝"],["작은 동물 돌보기","Care for small animals","照顾小动物","小動物の世話"],["오늘의 디저트 고르기","Choose today's dessert","挑选今天的甜点","今日のデザートを選ぶ"],["딸기 케이크 먹기","Eat strawberry cake","吃草莓蛋糕","いちごケーキを食べる"],["호무라에게 줄 차 고르기","Choose tea for Homura","挑选送给焰的茶","ほむらに贈るお茶を選ぶ"],["호무라에게 줄 리본 묶기","Tie a ribbon for Homura","给焰系蝴蝶结","ほむらに贈るリボンを結ぶ"],["호무라를 만나 마음에 답하기","Meet Homura and return her feelings","见到焰并回应心意","ほむらに会って気持ちに応える"],["리본 정리 후 취침","Put ribbons away then sleep","收好缎带后睡觉","リボンを片づけて就寝"]].map(([ko,en,zh,ja])=>[ko,[en,zh,ja]]));
function knownAction(raw,lang=language()){
 if(idx(lang)===0)return String(raw||'');
 return (common[String(raw||'')]||extra[String(raw||'')])?.[idx(lang)-1]||null;
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
