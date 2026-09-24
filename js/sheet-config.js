/* =========================================================
   スプレッドシート連携の設定
   Googleスプレッドシート「ノールチシティ HP更新シート（デモ）」の
   各シートを「ウェブに公開（CSV）」したURL。
   空欄のシートは読み込まず、HTMLに書いてある内容をそのまま表示する。
   ========================================================= */
(function () {
  var PUB = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsx_3orBWpWfBiIClO3MxudPiPQV3OmEopjiVO9mPXmfT_kthqvRxVYv4orUl2h3qipw6vtig_SExu/pub';
  function csv(gid) { return PUB + '?gid=' + gid + '&single=true&output=csv'; }
  window.NORTE_SHEETS = {
    matches: csv('0'),           // ［試合］シート
    ranking: csv('1488252283'),  // ［順位表］シート
    alerts: csv('1790202840'),   // ［緊急告知］シート
    news: csv('906596351')       // ［お知らせ］シート（Googleフォームの回答＋公開チェック）
  };
})();
