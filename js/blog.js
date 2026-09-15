/* =========================================================
   ブログ：一覧（blog.html）と記事（blog-post.html）の表示
   記事データは js/blog-data.js
   ========================================================= */
(function () {
  'use strict';

  var posts = (window.BLOG_POSTS || []).slice().sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(d) { return d.replace(/-/g, '.'); }
  function paragraphs(body) {
    return body.trim().split(/\n\s*\n/).map(function (p) {
      return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  function excerpt(body) {
    var t = body.replace(/\s+/g, ' ').trim();
    return t.length > 70 ? t.slice(0, 70) + '…' : t;
  }
  function chip(team) {
    return '<span class="team-chip team-chip--' + esc(team) + '">' + esc(team) + '</span>';
  }
  function postUrl(p) { return 'blog-post.html?id=' + encodeURIComponent(p.id); }

  /* ---------- 一覧 ---------- */
  var list = document.querySelector('[data-blog-list]');
  if (list) {
    var filter = document.querySelector('[data-blog-filter]');

    function renderList(team) {
      var items = posts.filter(function (p) { return team === 'all' || p.team === team; });
      list.innerHTML = items.length ? items.map(function (p) {
        return '<a class="bcard" href="' + postUrl(p) + '">' +
          '<div class="bcard-img"><img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt || '') + '" loading="lazy"></div>' +
          '<div class="bcard-body">' +
            '<div class="bcard-meta"><time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + '</time>' + chip(p.team) + '</div>' +
            '<h2 class="bcard-title">' + esc(p.title) + '</h2>' +
            '<p class="bcard-ex">' + esc(excerpt(p.body)) + '</p>' +
            '<p class="bcard-author">担当：' + esc(p.author) + '</p>' +
          '</div></a>';
      }).join('') : '<p class="blog-empty">このカテゴリの記事はまだありません。</p>';
    }

    if (filter) {
      filter.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-team]');
        if (!btn) return;
        filter.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        renderList(btn.getAttribute('data-team'));
      });
    }
    renderList('all');
  }

  /* ---------- 記事 ---------- */
  var article = document.querySelector('[data-blog-article]');
  if (article) {
    var id = new URLSearchParams(location.search).get('id');
    var idx = -1;
    for (var i = 0; i < posts.length; i++) { if (posts[i].id === id) { idx = i; break; } }

    if (idx < 0) {
      article.innerHTML = '<p class="blog-empty">記事が見つかりませんでした。<a href="blog.html">ブログ一覧へ戻る</a></p>';
      return;
    }

    var p = posts[idx];
    document.title = p.title + '｜ブログ｜ノールチシティ ジュニアユースサッカークラブ';

    var gallery = (p.gallery && p.gallery.length) ?
      '<div class="post-gallery">' + p.gallery.map(function (src, n) {
        return '<a href="' + esc(src) + '" target="_blank" rel="noopener"><img src="' + esc(src) + '" alt="' + esc(p.title) + ' の写真' + (n + 2) + '" loading="lazy"></a>';
      }).join('') + '</div>' : '';

    var result = '';
    if (p.result) {
      result = '<div class="post-result">' +
        '<p class="pr-comp">' + esc(p.result.comp) + '</p>' +
        '<p class="pr-score"><span>ノールチシティ</span><b>' + (p.result.mark ? '<span class="pr-mark">' + esc(p.result.mark) + '</span>' : '') + esc(p.result.score) + '</b><span>' + esc(p.result.opponent) + '</span></p>' +
        (p.result.half ? '<p class="pr-half">' + esc(p.result.half) + '</p>' : '') +
        '</div>';
    }

    article.innerHTML =
      '<header class="post-head">' +
        '<div class="bcard-meta"><time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + '</time>' + chip(p.team) + '<span class="post-author">担当：' + esc(p.author) + '</span></div>' +
        '<h2 class="post-title">' + esc(p.title) + '</h2>' +
      '</header>' +
      '<figure class="post-fig"><img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt || '') + '"></figure>' +
      result +
      '<div class="post-body">' + paragraphs(p.body) + '</div>' +
      gallery +
      (p.excerptOnly ? '<p class="post-note">※ サンプル表示：公式Facebookの投稿の冒頭部分を掲載しています。</p>' : '');

    var nav = document.querySelector('[data-blog-nav]');
    if (nav) {
      var newer = posts[idx - 1], older = posts[idx + 1];
      nav.innerHTML =
        (newer ? '<a class="prev" href="' + postUrl(newer) + '">&larr; 新しい記事</a>' : '<span></span>') +
        '<a class="to-list" href="blog.html">一覧へ戻る</a>' +
        (older ? '<a class="next" href="' + postUrl(older) + '">前の記事 &rarr;</a>' : '<span></span>');
    }
  }
})();
