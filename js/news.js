/* =========================================================
   お知らせ：ホームの最新件数・一覧（news.html）・詳細（news-post.html）の表示
   データは js/news-data.js
   ========================================================= */
(function () {
  'use strict';

  var posts = (window.NEWS_POSTS || []).slice().sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ymd(d) { var p = d.split('-'); return +p[0] + '年' + +p[1] + '月' + +p[2] + '日'; }
  function dotted(d) { return d.replace(/-/g, '.'); }
  function postUrl(p) { return 'news-post.html?id=' + encodeURIComponent(p.id); }
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  /* ---------- ホーム：最新n件（各お知らせの詳細へ） ---------- */
  var latest = document.querySelector('[data-news-latest]');
  if (latest && posts.length) {
    var n = parseInt(latest.getAttribute('data-news-latest'), 10) || 3;
    latest.innerHTML = posts.slice(0, n).map(function (p) {
      var cls = p.type === 'result' ? 'cat--result' : 'cat--news';
      return '<li><a href="' + postUrl(p) + '">' +
        '<time datetime="' + esc(p.date) + '">' + ymd(p.date) + '</time>' +
        '<span class="cat ' + cls + '">' + esc(p.cat) + '</span>' +
        '<span class="news-title">' + esc(p.title) + '</span>' +
        CHEV.replace('<svg', '<svg class="chev"') + '</a></li>';
    }).join('');
  }

  /* ---------- 一覧 ---------- */
  var list = document.querySelector('[data-news-list]');
  if (list) {
    list.innerHTML = posts.map(function (p) {
      return '<a class="news-item" href="' + postUrl(p) + '">' +
        '<time datetime="' + esc(p.date) + '">' + dotted(p.date) + '</time>' +
        '<span class="cat cat--' + esc(p.type) + '">' + esc(p.cat) + '</span>' +
        '<span class="n-title">' + esc(p.title) + '</span>' +
        CHEV.replace('<svg', '<svg class="n-chev"') + '</a>';
    }).join('');
  }

  /* ---------- 詳細 ---------- */
  var article = document.querySelector('[data-news-article]');
  if (article) {
    var id = new URLSearchParams(location.search).get('id');
    var idx = -1;
    for (var i = 0; i < posts.length; i++) { if (posts[i].id === id) { idx = i; break; } }

    if (idx < 0) {
      article.innerHTML = '<p class="np-missing">お知らせが見つかりませんでした。<a href="news.html">お知らせ一覧へ戻る</a></p>';
      return;
    }

    var p = posts[idx];
    document.title = p.title + '｜お知らせ｜ノールチシティ ジュニアユースサッカークラブ';

    article.innerHTML =
      '<header class="np-head">' +
        '<div class="np-meta"><time datetime="' + esc(p.date) + '">' + dotted(p.date) + '</time>' +
        '<span class="cat cat--' + esc(p.type) + '">' + esc(p.cat) + '</span></div>' +
        '<h2 class="np-title">' + esc(p.title) + '</h2>' +
      '</header>' +
      // 本文はサイト側で書いたHTMLをそのまま使う
      '<div class="np-body">' + p.body + '</div>';

    var nav = document.querySelector('[data-news-nav]');
    if (nav) {
      var newer = posts[idx - 1], older = posts[idx + 1];
      nav.innerHTML =
        (newer ? '<a class="prev" href="' + postUrl(newer) + '">&larr; 新しいお知らせ</a>' : '<span></span>') +
        '<a class="to-list" href="news.html">お知らせ一覧へ</a>' +
        (older ? '<a class="next" href="' + postUrl(older) + '">前のお知らせ &rarr;</a>' : '<span></span>');
    }
  }
})();
