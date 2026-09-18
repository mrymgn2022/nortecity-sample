/* =========================================================
   お知らせのデータ
   1件 = 1ページ（news-post.html?id=〇〇）。
   新しいお知らせは、この配列に1件足すだけでホームの最新3件・一覧・詳細ページに反映される。
     id    : URLに使う英数字（他と重ならないように）
     date  : 公開日 YYYY-MM-DD（新しい順に自動で並ぶ）
     type  : event（セレクション・練習会）／ result（試合結果）／ news（ニュース）
     cat   : ラベルに出す文字
     title : タイトル
     body  : 本文（HTML可。表は <div class="table-scroll"><table class="rank-table">…）
   ========================================================= */
window.NEWS_POSTS = [
  {
    id: 'selection-2027',
    date: '2026-07-28',
    type: 'event',
    cat: 'セレクション',
    title: 'セレクションのお知らせ（2027年度・募集は終了しました）',
    body:
      '<p>2027年度（現・小学6年生／新中学1年生対象）のセレクションを下記の日程で実施しました。いずれも募集は終了しています。</p>' +
      '<p>参加費は1,000円（1人1回まで）。持ち物はサッカー用具一式（飲み物・着替えを含む）です。</p>' +
      '<div class="table-scroll"><table class="rank-table">' +
        '<thead><tr><th scope="col">区分</th><th scope="col">日程</th><th scope="col">時間</th><th scope="col">会場</th><th scope="col">定員</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>セレクション</td><td>7/13(月)</td><td>18:00-20:30</td><td>北運動場</td><td>80名<span class="done">募集終了</span></td></tr>' +
          '<tr><td>最終セレクション</td><td>9/17(木)</td><td>18:30-20:15</td><td>豊島北スポーツ多目的広場</td><td>60名<span class="done">募集終了</span></td></tr>' +
        '</tbody>' +
      '</table></div>' +
      '<p>練習会の日程は<a href="news-post.html?id=practice-2027">練習会のお知らせ</a>をご覧ください。</p>'
  },
  {
    id: 'practice-2027',
    date: '2026-06-01',
    type: 'event',
    cat: '練習会',
    title: '練習会のお知らせ（2027年度・全日程終了）',
    body:
      '<p>2027年度（現・小学6年生／新中学1年生対象）の練習会は、下記の日程で実施し、全日程を終了しました。ご参加いただいた皆さま、ありがとうございました。</p>' +
      '<p>練習会は参加無料（1人1日のみ）。持ち物はサッカー用具一式（飲み物・着替えを含む）です。</p>' +
      '<div class="table-scroll"><table class="rank-table">' +
        '<thead><tr><th scope="col">日程</th><th scope="col">時間</th><th scope="col">会場</th><th scope="col">定員</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>5/18(月)</td><td>18:30-20:30</td><td>赤羽スポーツの森</td><td>80名</td></tr>' +
          '<tr><td>5/21(木)</td><td>18:30-20:30</td><td>豊島北スポーツ多目的</td><td>40名</td></tr>' +
          '<tr><td>5/23(土)</td><td>18:15-20:30</td><td>北運動場</td><td>40名</td></tr>' +
          '<tr><td>5/26(火)</td><td>18:30-20:30</td><td>北運動場</td><td>80名</td></tr>' +
          '<tr><td>6/1(月)</td><td>18:30-20:30</td><td>桐ヶ丘中学校</td><td>60名</td></tr>' +
        '</tbody>' +
      '</table></div>' +
      '<p>セレクションの日程は<a href="news-post.html?id=selection-2027">セレクションのお知らせ</a>をご覧ください。</p>'
  },
  {
    id: 'kanto-2026-r1',
    date: '2026-05-30',
    type: 'result',
    cat: '試合結果',
    title: 'U15クラブユース選手権 関東大会 1回戦（vs S.T.FC ●1-3）',
    body:
      '<p>U15クラブユース選手権 関東大会の1回戦（2026年5月30日 10:00・清瀬内山運動公園A面）でS.T.FCと対戦し、1-3で敗れました。応援ありがとうございました。</p>' +
      '<div class="table-scroll"><table class="rank-table">' +
        '<thead><tr><th scope="col">日付</th><th scope="col">時間</th><th scope="col">会場</th><th scope="col">対戦相手</th><th scope="col">結果</th></tr></thead>' +
        '<tbody><tr><td>5/30(土)</td><td>10:00</td><td>清瀬内山運動公園A面</td><td>S.T.FC</td><td>●1-3</td></tr></tbody>' +
      '</table></div>'
  },
  {
    id: 'kanto-2026',
    date: '2026-05-04',
    type: 'result',
    cat: '試合結果',
    title: 'U15クラブユース選手権 関東大会出場決定（代表決定戦 vs FC GONA ○3-0）',
    body:
      '<p>U15クラブユース選手権 代表決定戦（2026年5月4日・駒沢補助競技場）でFC GONAと対戦し、3-0で勝利。関東大会への出場が決定しました。応援ありがとうございました。</p>'
  },
  {
    id: 'u14-2nd-league-6',
    date: '2022-10-23',
    type: 'result',
    cat: '試合結果',
    title: 'U14選手権 2次リーグ6戦目 — 6連勝で3次リーグ進出決定',
    body:
      '<p>U14選手権2次リーグの6戦目、ヴェルメリオと対戦し6-0で勝利しました。これで2次リーグ6連勝となり、3次リーグへの進出が決定しました。応援ありがとうございました。</p>'
  },
  {
    id: 'u14-toshun-cup',
    date: '2022-08-17',
    type: 'result',
    cat: '試合結果',
    title: 'U14 東春カップ 優勝',
    body:
      '<p>U14東春カップで優勝しました。決勝は高崎FCと対戦し、1-0で勝利。応援いただいた皆さま、ありがとうございました。</p>'
  },
  {
    id: 'u14-2nd-league-1',
    date: '2022-08-07',
    type: 'result',
    cat: '試合結果',
    title: 'U14選手権 2次リーグ 初戦',
    body:
      '<p>U14選手権2次リーグの初戦、JOGARと対戦し22-0で勝利しました。良いスタートを切ることができました。</p>'
  },
  {
    id: 'u14-clubyouth-1',
    date: '2022-07-03',
    type: 'result',
    cat: '試合結果',
    title: 'U14クラブユース 1次リーグ 初戦',
    body:
      '<p>U14クラブユース1次リーグの初戦、VEDIALOと対戦し7-0で勝利しました。次戦も勝利を目指して戦います。</p>'
  },
  {
    id: 'bus-2022',
    date: '2022-06-17',
    type: 'news',
    cat: 'ニュース',
    title: '練習会の開催・チームバス2号車導入・城北ボレアスFCとの合同練習',
    body:
      '<p>6月13日に練習会を開催しました。ご参加いただいた皆さま、ありがとうございました。</p>' +
      '<p>また、6月14日にはチームバス2号車を導入しました。試合・遠征はバスで移動します。業務提携チームの城北ボレアスFCとの合同練習も実施しています。</p>'
  }
];
