/* =========================================================
   スプレッドシート連携
   Googleスプレッドシート（ウェブに公開したCSV）を読み込み、
   ・試合日程・結果（ホーム／日程・結果ページ）
   ・トップの NEXT MATCH スライド
   ・順位表
   ・緊急告知の帯（全ページ）
   を自動で表示する。読み込めない場合はHTMLの内容をそのまま表示する。
   ========================================================= */
(function () {
  'use strict';

  var cfg = window.NORTE_SHEETS || {};
  var TODAY = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD

  /* ---------- 共通 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function key(s) { return String(s || '').replace(/[\s　]/g, '').toUpperCase(); }

  function parseCSV(text) {
    var rows = [], row = [], field = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { q = false; } }
        else { field += c; }
      } else if (c === '"') { q = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') { field += c; }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }
  function toObjects(rows) {
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).filter(function (r) {
      return r.some(function (v) { return v.trim() !== ''; });
    }).map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
      return o;
    });
  }

  function load(url) {
    if (!url || !window.fetch) return Promise.resolve(null);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    return fetch(url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now(), { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (t) { return toObjects(parseCSV(t)); })
      .catch(function () { return null; });
  }

  function normDate(s) {
    var m = String(s || '').match(/(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})/);
    return m ? m[1] + '-' + pad(m[2]) + '-' + pad(m[3]) : '';
  }
  function normTime(s) {
    var m = String(s || '').match(/(\d{1,2}):(\d{2})/);
    return m ? pad(m[1]) + ':' + m[2] : '';
  }

  /* ---------- 試合 ---------- */
  function isNum(v) { return v !== '' && !isNaN(parseInt(v, 10)); }
  function normMatch(o) {
    var gf = o['得点'] || '', ga = o['失点'] || '';
    var st = (o['状態'] || '').trim();
    if (!st) st = (isNum(gf) && isNum(ga)) ? '終了' : '予定';
    return {
      comp: o['大会'] || '', key: key(o['大会']),
      date: normDate(o['日付']), time: normTime(o['時間']),
      opp: o['対戦相手'] || '', venue: o['会場'] || '',
      status: st, gf: gf, ga: ga,
      round: o['ラウンド'] || '', logo: o['相手ロゴ'] || ''
    };
  }
  function hasScore(m) { return isNum(m.gf) && isNum(m.ga); }
  function mark(m) {
    var a = parseInt(m.gf, 10), b = parseInt(m.ga, 10);
    return a > b ? '○' : a < b ? '●' : '△';
  }
  function cmp(a, b) {
    var x = a.date + ' ' + (a.time || '99:99'), y = b.date + ' ' + (b.time || '99:99');
    return x < y ? -1 : x > y ? 1 : 0;
  }
  function latestResult(list) {
    var r = list.filter(function (m) { return m.status === '終了' && hasScore(m); }).sort(cmp);
    return r.length ? r[r.length - 1] : null;
  }
  function nextMatch(list) {
    return list.filter(function (m) { return m.status !== '終了' && m.date && m.date >= TODAY; }).sort(cmp)[0] || null;
  }
  function statusChip(m) {
    if (m.status === '中止') return '<span class="m-status m-status--cancel">中止</span>';
    if (m.status === '延期') return '<span class="m-status m-status--postpone">延期</span>';
    return '';
  }

  // ホーム：大会タブごとの「最新試合結果」「次回試合予定」
  function renderHome(matches) {
    var tabs = document.querySelectorAll('#match [role="tab"]');
    Array.prototype.forEach.call(tabs, function (tab) {
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (!panel) return;
      var list = matches.filter(function (m) { return m.key === key(tab.textContent); });
      if (!list.length) { panel.innerHTML = '<div class="m-prep">準備中です。日程が決まり次第、掲載します。</div>'; return; }
      var last = latestResult(list), nxt = nextMatch(list);
      panel.innerHTML =
        '<article class="mcard"><h3 class="mcard-head">最新試合結果<span class="en">RESULT</span></h3><div class="mcard-body">' +
          (last
            ? (last.round ? '<p class="m-comp">' + esc(last.round) + '</p>' : '') +
              '<p class="m-date">' + esc(last.date) + '</p>' +
              '<p class="m-opp">vs ' + esc(last.opp) + '</p>' +
              '<p class="m-result"><span class="m-mark">' + mark(last) + '</span>' + esc(last.gf) + '-' + esc(last.ga) + '</p>' +
              (last.venue ? '<p class="m-venue">' + esc(last.venue) + '</p>' : '')
            : '<p class="m-hint">まだ試合結果はありません。</p>') +
        '</div></article>' +
        '<article class="mcard mcard--next"><h3 class="mcard-head">次回試合予定<span class="en">NEXT</span></h3><div class="mcard-body">' +
          (nxt
            ? (nxt.round ? '<p class="m-comp">' + esc(nxt.round) + '</p>' : '') +
              '<p class="m-date">' + esc(nxt.date) + (nxt.time ? ' ' + esc(nxt.time) : '') + '</p>' +
              '<p class="m-opp">vs ' + esc(nxt.opp) + '</p>' +
              (nxt.venue ? '<p class="m-venue">' + esc(nxt.venue) + '</p>' : '') +
              statusChip(nxt)
            : '<p class="m-hint">日程が決まり次第、掲載します。</p>') +
        '</div></article>';
    });
  }

  // 日程・結果ページ：大会タブごとの一覧表
  function renderSchedule(matches) {
    if (!document.getElementById('sched-title')) return;
    var tabs = document.querySelectorAll('[role="tab"]');
    Array.prototype.forEach.call(tabs, function (tab) {
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (!panel) return;
      var list = matches.filter(function (m) { return m.key === key(tab.textContent); }).sort(cmp);
      if (!list.length) { panel.innerHTML = '<div class="m-prep">準備中です。日程が決まり次第、掲載します。</div>'; return; }
      panel.innerHTML =
        '<div class="sched-wrap"><table class="sched-table"><thead><tr>' +
        '<th scope="col">日付</th><th scope="col">時間</th><th scope="col">会場</th><th scope="col">対戦相手</th><th scope="col">結果</th>' +
        '</tr></thead><tbody>' +
        list.map(function (m) {
          var res = (m.status === '終了' && hasScore(m))
            ? '<span class="m-mark">' + mark(m) + '</span>' + esc(m.gf) + '-' + esc(m.ga)
            : (statusChip(m) || '-');
          return '<tr><td class="d">' + esc(m.date) + '</td><td class="t">' + esc(m.time || '-') + '</td>' +
            '<td>' + esc(m.venue || '-') + '</td>' +
            '<td class="opp">' + esc(m.opp) + (m.round ? '<small class="rd">' + esc(m.round) + '</small>' : '') + '</td>' +
            '<td class="res">' + res + '</td></tr>';
        }).join('') +
        '</tbody></table></div>';
    });
  }

  // トップの NEXT MATCH スライド（スライダーの複製にも反映）
  function renderNextSlide(matches) {
    var slides = document.querySelectorAll('.ph[data-bg="NEXT MATCH"]');
    if (!slides.length) return;
    var nxt = nextMatch(matches);
    if (!nxt) return;
    Array.prototype.forEach.call(slides, function (ph) {
      var label = ph.querySelector('.ph-label');
      var title = ph.querySelector('.ph-title');
      var sub = ph.querySelector('.ph-sub');
      if (label) label.textContent = nxt.status === '中止' ? 'NEXT MATCH ／ 中止' : nxt.status === '延期' ? 'NEXT MATCH ／ 延期' : 'NEXT MATCH';
      if (title) title.textContent = 'ノールチシティ vs ' + nxt.opp;
      if (sub) sub.textContent = nxt.comp + ' ／ ' + nxt.date + (nxt.time ? ' ' + nxt.time : '') + (nxt.venue ? ' ／ ' + nxt.venue : '');
      var away = ph.querySelector('.ph-crest--away');
      if (away) {
        var img = away.querySelector('img');
        var q = away.querySelector('.q');
        if (nxt.logo) {
          if (!img) { img = document.createElement('img'); img.className = 'crest-img'; away.insertBefore(img, q); }
          img.src = 'images/' + nxt.logo;
          img.alt = nxt.opp;
          away.classList.remove('noimg');
        } else {
          if (img) img.parentNode.removeChild(img);
          away.classList.add('noimg');
          if (q) q.textContent = nxt.opp.replace(/^(FC|SC)\s*/i, '').charAt(0) || '?';
        }
      }
    });
  }

  /* ---------- 順位表 ---------- */
  function renderRanking(rows) {
    var tb = document.querySelector('.rank-body .rank-table tbody');
    if (!tb || !rows.length) return;
    tb.innerHTML = rows.map(function (o) {
      var team = o['チーム名'] || '';
      var rank = o['順位'] || '';
      if (rank && !/位$/.test(rank)) rank += '位';
      return '<tr' + (/ノールチ|norte/i.test(team) ? ' class="is-norte"' : '') + '>' +
        '<td>' + esc(rank) + '</td><td>' + esc(team) + '</td><td>' + esc(o['勝ち点']) + '</td><td>' + esc(o['試合数']) + '</td></tr>';
    }).join('');
  }

  /* ---------- 緊急告知 ---------- */
  function parseEnd(s) {
    var m = String(s || '').match(/(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})日?(?:\s+(\d{1,2}):(\d{2}))?/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], m[4] !== undefined ? +m[4] : 23, m[5] !== undefined ? +m[5] : 59);
  }
  // 「表示終了」: 今日いっぱい／明日いっぱい は、✓を入れた日（ON日時）の 23:59 ／ 翌日 23:59 まで。
  // 空欄は✓を外すまで表示。以前の書き方（2026/09/20 21:00 など）もそのまま使える。
  function alertEnd(o) {
    var v = (o['表示終了'] || '').trim();
    var plus = /^今日/.test(v) ? 0 : /^明日/.test(v) ? 1 : -1;
    if (plus < 0) return parseEnd(v);
    var on = parseEnd(o['ON日時']);
    if (!on) return null; // ON日時が無ければ手動扱い（勝手に消えない）
    return new Date(on.getFullYear(), on.getMonth(), on.getDate() + plus, 23, 59, 59);
  }
  function renderAlerts(rows) {
    var now = new Date();
    var on = rows.filter(function (o) {
      if (!/^(TRUE|ON|1|○|表示|はい)$/i.test((o['表示'] || '').trim())) return false;
      var end = alertEnd(o);
      if (end && end < now) return false;
      return (o['文言'] || '') !== '';
    });
    var header = document.querySelector('.site-header');
    // 表示するのはホーム・日程結果・お知らせの3ページだけ
    var isHome = !!document.getElementById('match');
    var isSchedule = !!document.getElementById('sched-title');
    var newsTitle = document.getElementById('news-title');
    var isNewsPage = !!newsTitle && !isHome;
    if (!on.length || !header || !(isHome || isSchedule || isNewsPage)) return;
    var html = on.map(function (o) {
      var kind = o['種類'] || 'お知らせ';
      // 中止＝赤、変更・延期＝オレンジ、それ以外＝紺
      var cls = /中止/.test(kind) ? 'site-alert--warn'
        : /変更|延期/.test(kind) ? 'site-alert--change'
        : 'site-alert--info';
      var link = o['リンク'] || '';
      var safe = /^(https?:\/\/|[a-z0-9\-]+\.html)/i.test(link);
      return '<div class="site-alert ' + cls + '" role="alert"><div class="container">' +
        '<span class="sa-tag">' + esc(kind) + '</span><p class="sa-text">' + esc(o['文言']) + '</p>' +
        (link && safe ? '<a class="sa-link" href="' + esc(link) + '">詳しく見る</a>' : '') +
        '</div></div>';
    }).join('');

    // ① メニューのすぐ下
    var top = document.createElement('div');
    top.className = 'site-alerts';
    top.innerHTML = html;
    header.parentNode.insertBefore(top, header.nextSibling);

    // ② ホームは「お知らせ」欄の一番上にも
    if (isHome && newsTitle) {
      var block = newsTitle.closest('.block');
      if (block) {
        var inline = document.createElement('div');
        inline.className = 'site-alerts site-alerts--inline';
        inline.innerHTML = html;
        block.insertBefore(inline, block.firstChild);
      }
    }
  }

  /* ---------- お知らせ（スプレッドシート［お知らせ］） ---------- */
  // 列: タイムスタンプ / 種類 / タイトル / 本文 / リンク / 掲載日 / 公開
  // 「公開」にチェックが入った行だけを、サイト側の news-data.js の分と合わせて表示する
  var NEWS_TYPE = { '試合結果': 'result', 'ニュース': 'news', 'お知らせ': 'news', '練習会': 'event', 'セレクション': 'event' };
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return (h >>> 0).toString(36);
  }
  function autolink(escaped) {
    return escaped.replace(/(https?:\/\/[^\s<]+)/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>';
    });
  }
  function bodyHtml(text) {
    return String(text).replace(/\r/g, '').trim().split(/\n\s*\n/).map(function (para) {
      return '<p>' + autolink(esc(para.trim())).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  function sheetNews(rows) {
    return rows.filter(function (o) {
      return /^(TRUE|ON|1|○|表示|はい)$/i.test((o['公開'] || '').trim()) && (o['タイトル'] || '') !== '' && (o['本文'] || '') !== '';
    }).map(function (o) {
      var date = normDate(o['掲載日']) || normDate(o['タイムスタンプ']) || TODAY;
      var kind = (o['種類'] || 'お知らせ').trim();
      var link = (o['リンク'] || '').trim();
      var body = bodyHtml(o['本文']);
      if (/^https?:\/\//i.test(link)) {
        body += '<p><a href="' + esc(link) + '" target="_blank" rel="noopener">詳しくはこちら →</a></p>';
      }
      return {
        id: 's-' + hash((o['タイムスタンプ'] || date) + '|' + o['タイトル']),
        date: date, type: NEWS_TYPE[kind] || 'news', cat: kind,
        title: o['タイトル'].trim(), body: body
      };
    });
  }

  /* ---------- 実行 ---------- */
  Promise.all([load(cfg.matches), load(cfg.ranking), load(cfg.alerts), load(cfg.news)]).then(function (res) {
    if (res[0]) {
      var matches = res[0].map(normMatch).filter(function (m) { return m.comp && m.opp; });
      renderHome(matches);
      renderSchedule(matches);
      renderNextSlide(matches);
    }
    if (res[1]) renderRanking(res[1]);
    if (res[2]) renderAlerts(res[2]);
    if (res[3] && window.NORTE_NEWS) window.NORTE_NEWS.addSheetPosts(sheetNews(res[3]));
  });
})();
