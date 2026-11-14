/* Wordville offline UI localization. Learning words/meanings and saved records remain unchanged. */
(() => {
'use strict';
const KEY='wordville.ui-language.v1';
const LANGS=['ko','en','zh-CN','ja'];
const NAMES={ko:'한국어',en:'English','zh-CN':'简体中文',ja:'日本語'};
const SHORT={ko:'한국어',en:'English','zh-CN':'中文',ja:'日本語'};
const lines=[
["마을","Town","村庄","村"],
["장소","Places","地点","場所"],
["주민","Residents","居民","住民"],
["단어","Words","单词","単語"],
["복습","Review","复习","復習"],
["더보기","More","更多","その他"],
["학습 메뉴","Learning menu","学习菜单","学習メニュー"],
["Wordville 화면 이동","Wordville navigation","Wordville 导航","Wordville ナビゲーション"],
["Wordville 추가 기능","Wordville more features","Wordville 更多功能","Wordville その他の機能"],
["Wordville 주민 만나기","Meet Wordville residents","认识 Wordville 居民","Wordville の住民に会う"],
["메뉴","Menu","菜单","メニュー"],
["화면","screen","页面","画面"],
["마을 주민 12명","12 village residents","12 位村庄居民","村の住民12人"],
["주민을 선택하면 대화하고 관련 영어 단어를 배울 수 있어요.","Choose a resident to talk and learn English words.","选择居民交谈并学习英语单词。","住民を選んで会話し、英単語を学べます。"],
["마을 시간과 주민 움직임","Village time and resident movement","村庄时间和居民行动","村の時間と住民の動き"],
["마을 설정 펼치기","Open village settings","打开村庄设置","村の設定を開く"],
["🏠 장소 둘러보기","🏠 Explore places","🏠 探索地点","🏠 場所を探す"],
["마을의 장소 17곳과 주민의 집 선택하기","Choose from 17 places and residents' homes","选择17个地点和居民住宅","17か所と住民の家から選択"],
["계정과 기록","Account & records","账户与记录","アカウントと記録"],
["기존 학습 기록과 저장 이미지를 안전하게 관리합니다.","Manage existing study records and saved images.","管理现有学习记录与保存的图片。","学習記録と保存画像を管理します。"],
["Day별 생각코딩 노트","Notes by Day","按 Day 分类的笔记","Day 別ノート"],
["기억 이미지 보관함","Memory image gallery","记忆图片库","記憶画像ギャラリー"],
["단어 조합실","Word combinations","单词组合","単語の組み合わせ"],
["개념 도감","Concept collection","概念图鉴","概念図鑑"],
["계정·동기화","Account & sync","账户与同步","アカウント・同期"],
["Wordville · 영어가 쌓이는 마을","Wordville · Learn English in the village","Wordville · 村庄英语学习","Wordville · 村で英語を学ぼう"],
["마을 지도를 불러오는 중입니다…","Loading village map…","正在加载村庄地图…","村の地図を読み込み中…"],
["오늘의 Wordville","Today's Wordville","今日的 Wordville","今日の Wordville"],
["주민들과 만나고, 새로운 단어를 배워요.","Meet residents and learn new words.","与居民交流，学习新单词。","住民と交流して新しい単語を学ぼう。"],
["🏡 마을 전체","🏡 Village map","🏡 村庄地图","🏡 村全体"],
["📍 장소 방문","📍 Visit places","📍 访问地点","📍 場所を訪問"],
["전체 맵","Full map","完整地图","全体マップ"],
["북쪽","North","北部","北"],
["중앙","Center","中央","中央"],
["남쪽","South","南部","南"],
["마을 시간","Village time","村庄时间","村の時間"],
["현재 시간","Current time","当前时间","現在時刻"],
["낮 미리보기","Preview daytime","预览白天","昼をプレビュー"],
["밤 미리보기","Preview nighttime","预览夜晚","夜をプレビュー"],
["주민 생활시간","Resident schedule time","居民日程时间","住民の生活時間"],
["실제 시각","Real time","实际时间","実際の時刻"],
["잠시 멈추기","Pause","暂停","一時停止"],
["다시 움직이기","Resume","继续","再開"],
["Day·페이지 선택해서 이 주민과 공부하기","Choose a Day and page to study with this resident","选择 Day 和页面与该居民学习","Day とページを選んでこの住民と学習"],
["주민과 공부할 단어 선택","Choose words to study with a resident","选择与居民学习的单词","住民と学ぶ単語を選択"],
["Day 선택","Select Day","选择 Day","Day を選択"],
["단어장 페이지 (60개씩)","Vocabulary page (60 each)","单词本页面（每页60个）","単語帳ページ（各60語）"],
["PDF 원본 쪽","Original PDF page","原始 PDF 页码","元の PDF ページ"],
["선택한 범위의 단어","Words in selected range","所选范围的单词","選択範囲の単語"],
["이 범위 단어장 열기","Open this vocabulary page","打开此单词本页面","この単語帳を開く"],
["선택한 단어 카드 열기","Open selected word card","打开所选单词卡","選択した単語カードを開く"],
["선택창 닫기","Close selection","关闭选择窗口","選択画面を閉じる"],
["마을 주민 12명 만나기","Meet 12 residents","认识12位居民","12人の住民に会う"],
["🕒 주민별 24시간 일정 보기·수정","🕒 View/edit 24-hour schedules","🕒 查看/编辑24小时日程","🕒 24時間の予定を確認・編集"],
["주민 선택","Choose resident","选择居民","住民を選択"],
["시간 수정","Edit time","编辑时间","時間を編集"],
["행동","Activity","活动","行動"],
["이 시간 저장","Save this hour","保存此时段","この時間を保存"],
["기본 일정으로","Reset schedule","恢复默认日程","標準の予定に戻す"],
["닫기","Close","关闭","閉じる"],
["마을에서 나눈 대화","Village conversations","村庄对话","村での会話"],
["주민들이 가까이 만나면 대화가 시작됩니다.","Conversations begin when residents meet.","居民相遇时会开始对话。","住民が近づくと会話が始まります。"],
["마을 장소 둘러보기","Explore village places","探索村庄地点","村の場所を探す"],
["아래 버튼으로 장소를 바꿔 보세요. 한 번에 한 장소만 표시됩니다.","Use the buttons below to switch places.","使用下方按钮切换地点。","下のボタンで場所を切り替えます。"],
["운동·휴식","Fitness & relaxation","运动与休闲","運動・休息"],
["먹거리","Food","餐饮","飲食"],
["문화","Culture","文化","文化"],
["자연","Nature","自然","自然"],
["생활","Daily life","生活","生活"],
["여기에서 만날 수 있는 주민","Residents you can meet here","这里可以遇见的居民","ここで会える住民"],
["다른 대화 보기","Another conversation","查看其他对话","別の会話を見る"],
["원하는 단어 선택해 주민과 대화","Choose a word to talk with a resident","选词与居民对话","単語を選んで住民と会話"],
["주민과 단어 대화하기","Practice words with residents","与居民进行单词对话","住民と単語会話"],
["대화할 주민","Resident to talk to","对话居民","会話する住民"],
["Day 범위","Day range","Day 范围","Day 範囲"],
["전체 Day · 모든 단어","All Days · All words","全部 Day · 所有单词","全 Day・すべての単語"],
["영어·한국어 단어 검색","Search English words / Korean meanings","搜索英语单词 / 韩语释义","英単語・韓国語の意味を検索"],
["전체 쪽","All pages","全部页面","すべてのページ"],
["60개 단위 페이지","Pages of 60 words","每页60个单词","60語ごとのページ"],
["학습할 단어","Word to study","学习单词","学習する単語"],
["이 단어로 대화 시작","Start with this word","用此单词开始对话","この単語で会話を開始"],
["선택한 단어 카드 보기","View selected word card","查看所选单词卡","選んだ単語カードを見る"],
["주민과 대화","Talk with a resident","与居民对话","住民と会話"],
["영어로 답변해 보세요","Answer in English","请用英语回答","英語で答えてください"],
["내 답변 보내기","Send my answer","发送回答","回答を送信"],
["답변 예시 보기","View sample answer","查看示例答案","回答例を見る"],
["다음 대화","Next conversation","下一段对话","次の会話"],
["단어 학습","Learn words","学习单词","単語学習"],
["조합실","Combine","组合","組み合わせ"],
["도감","Collection","图鉴","図鑑"],
["나의 단어장","My vocabulary","我的单词本","マイ単語帳"],
["단어장 불러오는 중…","Loading vocabulary…","正在加载单词本…","単語帳を読み込み中…"],
["단어 또는 한국어 뜻 검색","Search words or Korean meanings","搜索单词或韩语释义","単語や韓国語の意味を検索"],
["전체 Day","All Days","全部 Day","すべての Day"],
["내 학습 상태","My learning status","我的学习状态","学習状況"],
["전체 상태","All statuses","全部状态","すべての状態"],
["학습 상태","Learning status","学习状态","学習状態"],
["모든 상태","All statuses","所有状态","すべての状態"],
["N · 처음/매우 낯섦","N · New/very unfamiliar","N · 初见/很陌生","N · 初見/とても不慣れ"],
["R · 회상 안 됨","R · Cannot recall","R · 无法回忆","R · 思い出せない"],
["F · 의미 흐림","F · Meaning unclear","F · 含义模糊","F · 意味が曖昧"],
["X · 단어 혼동","X · Confused with another word","X · 单词混淆","X · 単語を混同"],
["U · 이해 안 됨","U · Not understood","U · 不理解","U · 理解できない"],
["C · 맥락 부족","C · Context unclear","C · 缺乏语境","C · 文脈が不明"],
["✓ · 회상 가능","✓ · Can recall","✓ · 可以回忆","✓ · 思い出せる"],
["Day별 상태 불러오는 중…","Loading Day statuses…","正在加载 Day 状态…","Day の状態を読み込み中…"],
["📝 Day별 노트 모아보기","📝 View notes by Day","📝 按 Day 查看笔记","📝 Day 別ノート"],
["PDF 쪽 필터 해제","Clear PDF page filter","清除 PDF 页码筛选","PDF ページの絞り込みを解除"],
["이전 60개","Previous 60","上60个","前の60語"],
["다음 60개","Next 60","下60个","次の60語"],
["조회할 Day","Select Day to view","选择查看的 Day","表示する Day"],
["Day별 학습 상태 그래프","Learning status by Day","按 Day 统计学习状态","Day 別学習状況"],
["날짜별 상태 기록 추이","Status history by date","按日期查看状态记录","日付別の状態履歴"],
["🖼️ 날짜별 기억 이미지 보관함","🖼️ Memory images by date","🖼️ 按日期整理的记忆图片","🖼️ 日付別の記憶画像"],
["저장 날짜","Saved date","保存日期","保存日"],
["전체 날짜","All dates","全部日期","すべての日付"],
["새로고침","Refresh","刷新","更新"],
["오늘의 복습","Today's review","今日复习","今日の復習"],
["복습 개수","Review count","复习数量","復習数"],
["20개","20 words","20个","20語"],
["40개","40 words","40个","40語"],
["전체","All","全部","すべて"],
["복습 시작","Start review","开始复习","復習開始"],
["한국어 뜻","Korean meaning","韩语释义","韓国語の意味"],
["정답 확인","Check answer","检查答案","答え合わせ"],
["다음 단어","Next word","下一个单词","次の単語"],
["자유 개념 조합실","Free concept combinations","自由概念组合","自由な概念の組み合わせ"],
["단어 2개를 연결하고 직접 개념 이름을 지어 보세요.","Combine two words and name your concept.","组合两个单词并为概念命名。","2つの単語を組み合わせて概念に名前を付けよう。"],
["첫 번째 단어","First word","第一个单词","1つ目の単語"],
["두 번째 단어","Second word","第二个单词","2つ目の単語"],
["나의 개념 이름","My concept name","我的概念名称","概念の名前"],
["무작위 선택","Random selection","随机选择","ランダム選択"],
["도감에 저장 · +15 XP","Save to collection · +15 XP","保存至图鉴 · +15 XP","図鑑に保存 · +15 XP"],
["나의 개념 도감","My concept collection","我的概念图鉴","マイ概念図鑑"],
["기존 앱의 기록 이어받기","Transfer records from old app","迁移旧版记录","旧アプリの記録を引き継ぐ"],
["이메일","Email","邮箱","メールアドレス"],
["비밀번호","Password","密码","パスワード"],
["로그인","Log in","登录","ログイン"],
["회원가입","Sign up","注册","新規登録"],
["로그아웃","Log out","退出登录","ログアウト"],
["서버 연결 확인 중","Checking server connection","正在检查服务器连接","サーバー接続を確認中"],
["로그인 후 백업 상태 확인","Check backup after login","登录后检查备份","ログイン後にバックアップを確認"],
["☁️ 지금 전체 백업","☁️ Back up everything","☁️ 立即完整备份","☁️ 今すぐ全件バックアップ"],
["↩️ 서버에서 전체 복원","↩️ Restore from server","↩️ 从服务器完整恢复","↩️ サーバーから全件復元"],
["백업 준비 중…","Preparing backup…","正在准备备份…","バックアップ準備中…"],
["기억 이미지 여러 장 선택 · 각 5MB 이하","Select memory images · Up to 5 MB each","选择多张记忆图片 · 每张不超过5MB","記憶画像を複数選択・各5MB以下"],
["뜻 보기","Show meaning","显示释义","意味を表示"],
["뜻 숨기기","Hide meaning","隐藏释义","意味を隠す"],
["🔎 이미지 검색","🔎 Image search","🔎 图片搜索","🔎 画像検索"],
["🔎 이 단어 이미지 검색","🔎 Search images for this word","🔎 搜索该单词的图片","🔎 この単語の画像を検索"],
["🖼️ 날짜별 이미지 모아보기","🖼️ View images by date","🖼️ 按日期查看图片","🖼️ 日付別の画像を見る"],
["이미지 검색어 (수정 가능)","Image search term (editable)","图片搜索词（可修改）","画像検索語（変更可）"],
["검색","Search","搜索","検索"],
["나의 기억 이미지","My memory images","我的记忆图片","マイ記憶画像"],
["저장된 이미지 확인 중…","Checking saved images…","正在检查已保存图片…","保存画像を確認中…"],
["선택 이미지 삭제","Delete selected image","删除所选图片","選択した画像を削除"],
["기본 이미지 서버에 저장","Save primary image to server","将主图片保存到服务器","代表画像をサーバーに保存"],
["📌 상태 체크","📌 Mark status","📌 标记状态","📌 状態を記録"],
["📝 생각코딩 노트","📝 Study notes","📝 学习笔记","📝 学習ノート"],
["학습 완료 · 복습 예약","Complete · Schedule review","完成学习 · 安排复习","学習完了・復習予約"],
["학습 상태 체크","Check learning status","检查学习状态","学習状態を記録"],
["상태를 적용할 Day","Day for this status","选择状态所属 Day","状態を適用する Day"],
["지금 상태를 선택하세요","Select your current status","选择当前状态","現在の状態を選択"],
["처음/매우 낯섦","New/very unfamiliar","初见/很陌生","初見/とても不慣れ"],
["회상 안 됨","Cannot recall","无法回忆","思い出せない"],
["의미 흐림","Meaning unclear","含义模糊","意味が曖昧"],
["단어 혼동","Word confusion","单词混淆","単語の混同"],
["이해 안 됨","Not understood","不理解","理解できない"],
["맥락 부족","Missing context","缺乏语境","文脈不足"],
["회상 가능","Can recall","可以回忆","思い出せる"],
["원인 빠른 선택","Quick reason selection","快速选择原因","理由をすぐに選択"],
["직접 입력","Enter manually","手动输入","手動入力"],
["상태를 확인한 날짜·시간","Status date/time","状态日期和时间","状態確認の日時"],
["변경 원인 / 상황 메모","Reason / situation note","原因 / 情况备注","理由・状況メモ"],
["개요 영역","Overview","概述","概要"],
["주제 영역","Topic","主题","テーマ"],
["범주 영역","Category","类别","分類"],
["필기 영역","Notes","笔记","メモ"],
["의견 영역","Thoughts","想法","意見"],
["요약 영역","Summary","总结","要約"],
["점검 영역","Checklist","检查项","確認項目"],
["반복 학습","Repeated study","重复学习","反復学習"],
["🕒 날짜·시간 삽입","🕒 Insert date/time","🕒 插入日期和时间","🕒 日時を挿入"],
["상태 체크하기","Save status","保存状态","状態を記録"],
["이 Day 노트 저장","Save this Day's notes","保存此 Day 笔记","この Day のノートを保存"],
["수영장","Swimming pool","游泳池","プール"],
["목장","Ranch","牧场","牧場"],
["헬스장","Gym","健身房","ジム"],
["햄버거 가게","Burger shop","汉堡店","ハンバーガー店"],
["아이스크림 가게","Ice cream shop","冰淇淋店","アイスクリーム店"],
["펍","Pub","酒吧","パブ"],
["미술관","Art museum","美术馆","美術館"],
["식물원","Botanical garden","植物园","植物園"],
["카페","Cafe","咖啡馆","カフェ"],
["서점","Bookstore","书店","書店"],
["진료소","Clinic","诊所","診療所"],
["도서관","Library","图书馆","図書館"],
["음악 작업실","Music studio","音乐工作室","音楽スタジオ"],
["시장","Market","市场","市場"],
["마을 광장","Town square","村庄广场","村の広場"],
["공방","Workshop","工坊","工房"],
["공원","Park","公园","公園"],
["집","Home","家","家"],
["주민의 집","Resident's home","居民之家","住民の家"],
["충돌 영역","Collision areas","碰撞区域","当たり判定領域"],
["현재 위치","Current location","当前位置","現在位置"],
["🚪 마을로 나가기","🚪 Return to village","🚪 返回村庄","🚪 村に戻る"],
["수정","Edit","编辑","編集"],
["저장","Save","保存","保存"],
["취소","Cancel","取消","キャンセル"],
["다음 →","Next →","下一页 →","次へ →"],
["← 이전","← Previous","← 上一页","← 前へ"],
["이 이미지 저장","Save this image","保存此图片","この画像を保存"],
["이디엄","Idioms","习语","イディオム"],
["준비된 영어 대화 10개를 사용합니다. 사용자가 입력한 답변은 AI 채점 또는 서버 전송 없이 예시와 비교합니다.","Uses 10 prepared dialogues; answers are compared with examples, not AI-graded or sent to a server.","使用10段预设对话；回答只与示例比较，不会经过AI评分或上传。","用意された10件の会話例を使用し、回答はAI採点や送信をせず例と比較します。"],
["주민 설명은 준비된 예문과 규칙으로 구성됩니다.","Resident explanations use prepared examples and rules.","居民说明使用预设例句和规则。","住民の説明には用意された例文と規則を使います。"],
["단어장을 불러오지 못했습니다. 인터넷 연결이 필요하지 않은 앱 내 단어장 파일을 확인해 주세요.","Could not load the offline vocabulary file.","无法加载应用内的离线词库文件。","オフライン単語帳を読み込めませんでした。"],
["영어 답변을 먼저 입력해 주세요.","Enter an English answer first.","请先输入英语回答。","先に英語で回答を入力してください。"],
["답변 예시를 표시했습니다.","Sample answer shown.","已显示示例答案。","回答例を表示しました。"],
["예시 답변을 표시했습니다.","Sample answer shown.","已显示示例答案。","回答例を表示しました。"],
["이미지 검색 결과 페이지 이동","Image results pages","图片搜索结果分页","画像検索結果のページ移動"],
["검색 결과가 없습니다.","No results found.","没有搜索结果。","検索結果がありません。"],
["이번 복습을 마쳤어요.","Review complete.","本次复习已完成。","今回の復習が終わりました。"],
["학습 상태를 선택하세요.","Select a learning status.","请选择学习状态。","学習状態を選んでください。"],
["처음 또는 계속 낯섦","New or still unfamiliar","初见或仍很陌生","初見またはまだ不慣れ"],
["봤지만·반복해도·잊어서 뜻이 안 남","Seen before but cannot remember","见过或重复学习但无法记住","見たことがあるが思い出せない"],
["어렴풋이 알지만 정확하지 않음","Vague or imprecise meaning","大致知道但不准确","なんとなく分かるが不正確"],
["비슷한 단어와 의미가 섞임","Mixed up with similar words","与相似单词混淆","似た単語と混同する"],
["뜻의 개념 자체가 이해되지 않음","Meaning itself not understood","不理解意思本身","意味そのものが理解できない"],
["번역은 알지만 쓰임이 와닿지 않음","Know the translation but not the usage","知道翻译但不了解用法","訳は分かるが使い方が分からない"],
["지금은 뜻을 스스로 떠올릴 수 있음","Can recall the meaning now","现在可以自行回忆释义","今は意味を思い出せる"]
];
const dictionary=new Map();
for(const row of lines){
 if(dictionary.has(row[0]))throw Error('Duplicate UI translation: '+row[0]);
 dictionary.set(row[0],{en:row[1],'zh-CN':row[2],ja:row[3]});
}
const patterns=[
 [/^(\d+) XP · (\d+) 코인$/,m=>({en:m[1]+' XP · '+m[2]+' coins','zh-CN':m[1]+' XP · '+m[2]+' 金币',ja:m[1]+' XP · '+m[2]+' コイン'})],
 [/^(\d+)번의 대화$/,m=>({en:m[1]+' conversations','zh-CN':m[1]+' 次对话',ja:m[1]+' 回の会話'})],
 [/^(\d+) \/ (\d+)곳$/,m=>({en:m[1]+' / '+m[2]+' places','zh-CN':m[1]+' / '+m[2]+' 个地点',ja:m[1]+' / '+m[2]+' か所'})],
 [/^영어 대화 예시 (\d+)개 펼치기$/,m=>({en:'Show '+m[1]+' English dialogue examples','zh-CN':'展开 '+m[1]+' 个英语对话示例',ja:'英会話例 '+m[1]+' 件を開く'})],
 [/^검색 결과 (\d+)개 · PDF 수록 순서 · 한 페이지 60개$/,m=>({en:m[1]+' results · PDF order · 60 per page','zh-CN':m[1]+' 个结果 · PDF顺序 · 每页60个',ja:'検索結果 '+m[1]+' 件・PDF順・1ページ60語'})],
 [/^(\d+) \/ (\d+) 쪽$/,m=>({en:'Page '+m[1]+' / '+m[2],'zh-CN':'第 '+m[1]+' / '+m[2]+' 页',ja:m[1]+' / '+m[2]+' ページ'})],
 [/^PDF 원본 (\d+)쪽 단어만 표시 중$/,m=>({en:'Showing words on original PDF page '+m[1],'zh-CN':'仅显示原 PDF 第 '+m[1]+' 页的单词',ja:'元の PDF '+m[1]+' ページの単語を表示中'})],
 [/^선택 가능한 단어 (\d+)개 · 현재 페이지 (\d+)개$/,m=>({en:m[1]+' available words · '+m[2]+' on this page','zh-CN':'可选单词 '+m[1]+' 个 · 当前页 '+m[2]+' 个',ja:'選択可能 '+m[1]+' 語・このページ '+m[2]+' 語'})],
 [/^(\d+)개 이미지 · (.+) 페이지 · 각 이미지의 이용 허가를 확인하세요\.$/,m=>({en:m[1]+' images · '+m[2]+' pages · Check image licenses.','zh-CN':m[1]+' 张图片 · '+m[2]+' 页 · 请确认许可。',ja:m[1]+' 枚・'+m[2]+' ページ・ライセンスを確認してください。'})]
];
let current='ko';
try{const stored=localStorage.getItem(KEY);if(LANGS.includes(stored))current=stored;}catch{}
function translateText(text,lang=current){
 if(lang==='ko'||!LANGS.includes(lang))return text;
 const input=String(text);
 const core=input.trim();
 if(!core)return input;
 const entry=dictionary.get(core);
 let value=entry?.[lang];
 if(!value)for(const [regex,fn] of patterns){
  const match=core.match(regex);
  if(match){value=fn(match)[lang];break;}
 }
 if(!value)return input; // English vocabulary, original Korean meanings and user data must not be machine-rewritten.
 return input.slice(0,input.indexOf(core))+value+input.slice(input.indexOf(core)+core.length);
}
const api={translate:translateText,get language(){return current;},languages:[...LANGS],setLanguage};
globalThis.WordvilleI18n=api;
if(typeof document==='undefined')return;
const skip='script,style,textarea,option[data-i18n-ignore],[contenteditable],[data-i18n-ignore],#detail-word,#detail-meaning,#detail-translation,#detail-example,#question,#answer-result,#connection,#concepts,.word strong,.word span,.example-en,.example-context,#resident-english,#resident-korean';
const textCache=new WeakMap(),attrCache=new WeakMap();
const attributes=['placeholder','title','aria-label','alt'];
function ignored(node){return !!node?.parentElement?.closest(skip);}
function translateNode(node){
 if(ignored(node))return;
 const value=node.nodeValue||'';
 const cached=textCache.get(node);
 const original=cached&&cached.displayed===value?cached.original:value;
 const displayed=translateText(original);
 textCache.set(node,{original,displayed});
 if(value!==displayed)node.nodeValue=displayed;
}
function translateAttributes(el){
 if(el.matches(skip)||el.closest('[data-i18n-ignore]'))return;
 let cache=attrCache.get(el);
 if(!cache){cache={};attrCache.set(el,cache);}
 for(const attr of attributes){
  if(!el.hasAttribute(attr))continue;
  const value=el.getAttribute(attr);
  const old=cache[attr];
  const original=old&&old.displayed===value?old.original:value;
  const displayed=translateText(original);
  cache[attr]={original,displayed};
  if(displayed!==value)el.setAttribute(attr,displayed);
 }
}
function walk(node){
 if(node.nodeType===3){translateNode(node);return;}
 if(node.nodeType!==1)return;
 const el=node;
 if(el.matches(skip)||el.closest('[data-i18n-ignore]'))return;
 translateAttributes(el);
 for(const child of el.childNodes)walk(child);
}
function refresh(){
 document.documentElement.lang=current;
 if(document.body)walk(document.body);
 document.title=translateText('Wordville · 영어가 쌓이는 마을');
 const label=document.getElementById('wv-language-trigger-label');
 if(label)label.textContent='🌐 '+SHORT[current];
 document.querySelectorAll('[data-wv-locale]').forEach(button=>{
  const active=button.dataset.wvLocale===current;
  button.setAttribute('aria-checked',String(active));
  const mark=button.querySelector('.wv-language-check');
  if(mark)mark.textContent=active?'✓':'';
 });
}
function setLanguage(lang){
 if(!LANGS.includes(lang))return false;
 current=lang;
 try{localStorage.setItem(KEY,current);}catch{}
 refresh();
 document.dispatchEvent(new CustomEvent('wordville-language-changed',{detail:{language:current}}));
 return true;
}
function mount(){
 if(document.getElementById('wv-language-trigger'))return;
 const header=document.querySelector('body > header');
 if(!header)return;
 const trigger=document.createElement('button');
 trigger.type='button';trigger.id='wv-language-trigger';trigger.className='wv-language-trigger';
 trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','wv-language-dialog');
 trigger.setAttribute('aria-label','언어 선택');
 const label=document.createElement('span');label.id='wv-language-trigger-label';trigger.append(label);
 const dialog=document.createElement('dialog');dialog.id='wv-language-dialog';dialog.className='wv-language-dialog';
 dialog.setAttribute('aria-labelledby','wv-language-heading');
 const heading=document.createElement('h2');heading.id='wv-language-heading';heading.textContent='언어 선택';
 const hint=document.createElement('p');hint.textContent='앱 메뉴와 안내 문구의 표시 언어를 변경합니다. 영어 단어와 원본 한국어 뜻은 유지됩니다.';
 const options=document.createElement('div');options.className='wv-language-options';options.setAttribute('role','radiogroup');
 for(const lang of LANGS){
  const b=document.createElement('button');b.type='button';b.dataset.wvLocale=lang;b.setAttribute('role','radio');
  const name=document.createElement('span');name.textContent=NAMES[lang];name.setAttribute('data-i18n-ignore','');
  const check=document.createElement('span');check.className='wv-language-check';check.setAttribute('aria-hidden','true');
  b.append(name,check);b.addEventListener('click',()=>{setLanguage(lang);dialog.close();trigger.focus();});
  options.append(b);
 }
 const close=document.createElement('button');close.type='button';close.className='wv-language-close';close.textContent='닫기';
 close.addEventListener('click',()=>dialog.close());
 dialog.append(heading,hint,options,close);
 const balance=header.querySelector('#balance');
 header.insertBefore(trigger,balance||null);
 document.body.append(dialog);
 trigger.addEventListener('click',()=>{
  if(!dialog.open){refresh();dialog.showModal();}
 });
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData')translateNode(record.target);
   else if(record.type==='attributes')translateAttributes(record.target);
   else for(const n of record.addedNodes)walk(n);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();
