/* =========================================================
   ノールチシティ 公式サイト スクリプト
   ・メインビジュアルの左右スライド（ループ／スワイプ／自動再生）
   ・試合日程・結果のタブ切り替え
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- スライダー ---------------- */
  document.querySelectorAll('[data-slider]').forEach(initSlider);

  function initSlider(root) {
    var viewport = root.querySelector('.hs-viewport');
    var track = root.querySelector('.hs-track');
    var dotsWrap = root.querySelector('.hs-dots');
    var toggle = root.querySelector('.hs-toggle');
    var originals = Array.prototype.slice.call(track.children);
    var n = originals.length;
    var CLONES = Math.min(2, n);
    var INTERVAL = 5500;

    originals.forEach(function (s, i) {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'スライド');
      s.setAttribute('aria-label', (i + 1) + ' / ' + n);
    });

    // 無限ループ用に前後へ複製を配置
    function makeClone(el) {
      var c = el.cloneNode(true);
      c.classList.add('is-clone');
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('tabindex', '-1');
      c.querySelectorAll('a,button').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      return c;
    }
    originals.slice(n - CLONES).map(makeClone).reverse().forEach(function (c) { track.insertBefore(c, track.firstChild); });
    originals.slice(0, CLONES).map(makeClone).forEach(function (c) { track.appendChild(c); });

    var slides = Array.prototype.slice.call(track.children);
    var pos = CLONES;

    var dots = originals.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'スライド' + (i + 1) + 'を表示');
      b.addEventListener('click', function () { go(i + CLONES); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function offsetFor(p, extra) {
      var s = slides[p];
      return viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2) + (extra || 0);
    }

    function render(animate) {
      if (!animate) track.classList.add('no-anim');
      track.style.transform = 'translate3d(' + offsetFor(pos) + 'px,0,0)';
      var real = ((pos - CLONES) % n + n) % n;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === pos); });
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === real ? 'true' : 'false'); });
      if (!animate) {
        void track.offsetWidth; // 再描画を確定させてからアニメーションを戻す
        track.classList.remove('no-anim');
      }
    }

    // 複製スライドに来たら本物の位置へ瞬間移動
    function normalize() {
      if (pos >= n + CLONES) { pos -= n; render(false); }
      else if (pos < CLONES) { pos += n; render(false); }
    }

    function go(p) {
      pos = Math.max(0, Math.min(slides.length - 1, p));
      render(true);
      if (reduceMotion) normalize();
    }
    function next() { if (pos >= n + CLONES) normalize(); go(pos + 1); }
    function prev() { if (pos < CLONES) normalize(); go(pos - 1); }

    track.addEventListener('transitionend', function (e) {
      if (e.target === track && e.propertyName === 'transform') normalize();
    });

    // 矢印・キーボード
    root.querySelector('.hs-prev').addEventListener('click', function () { prev(); restart(); });
    root.querySelector('.hs-next').addEventListener('click', function () { next(); restart(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { prev(); restart(); }
      else if (e.key === 'ArrowRight') { next(); restart(); }
    });

    // Tabキーで画面外のスライドにフォーカスが移ったら、そのスライドを中央へ
    track.addEventListener('focusin', function (e) {
      var s = e.target.closest('.hs-slide');
      var i = slides.indexOf(s);
      if (i > -1 && i !== pos) { go(i); }
      viewport.scrollLeft = 0;
    });

    // スワイプ／ドラッグ
    var startX = 0, startY = 0, dx = 0, pointerDown = false, dragging = false, justDragged = false, pid = null;

    function beginDrag(x, y) {
      pointerDown = true; dragging = false; justDragged = false;
      startX = x; startY = y; dx = 0;
    }

    // 戻り値 true = 横スワイプ中（スマホでは縦スクロールを止める）
    function moveDrag(x, y) {
      if (!pointerDown) return false;
      dx = x - startX;
      var dy = y - startY;
      if (!dragging) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return false;
        if (Math.abs(dy) > Math.abs(dx)) { pointerDown = false; return false; } // 縦スクロールを優先
        dragging = true;
        stop();
        if (pos >= n + CLONES || pos < CLONES) normalize();
        track.classList.add('is-dragging');
      }
      track.style.transform = 'translate3d(' + offsetFor(pos, dx) + 'px,0,0)';
      return true;
    }

    // スマホ：タッチイベント
    viewport.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      beginDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    viewport.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 1) return;
      if (moveDrag(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault();
    }, { passive: false });
    viewport.addEventListener('touchend', function () { endDrag(); });
    viewport.addEventListener('touchcancel', function () { endDrag(); });

    // PC：マウスでドラッグ
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      pid = e.pointerId;
      beginDrag(e.clientX, e.clientY);
    });
    viewport.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || e.pointerId !== pid) return;
      var wasDragging = dragging;
      if (moveDrag(e.clientX, e.clientY) && !wasDragging) {
        try { viewport.setPointerCapture(pid); } catch (err) {}
      }
    });

    function endDrag() {
      if (!pointerDown) return;
      pointerDown = false;
      if (!dragging) return;
      dragging = false;
      justDragged = true;
      track.classList.remove('is-dragging');
      var threshold = Math.min(80, viewport.clientWidth * 0.08);
      if (dx < -threshold) next();
      else if (dx > threshold) prev();
      else render(true);
      restart();
    }
    viewport.addEventListener('pointerup', function (e) { if (e.pointerType !== 'touch') endDrag(); });
    viewport.addEventListener('pointercancel', function (e) { if (e.pointerType !== 'touch') endDrag(); });
    viewport.addEventListener('lostpointercapture', function (e) { if (e.pointerType !== 'touch') endDrag(); });
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // ドラッグ直後のクリックは無効化。左右のスライドをクリックしたらそのスライドへ移動
    viewport.addEventListener('click', function (e) {
      if (justDragged) { e.preventDefault(); e.stopPropagation(); justDragged = false; return; }
      var s = e.target.closest('.hs-slide');
      var i = slides.indexOf(s);
      if (i > -1 && i !== pos) { e.preventDefault(); go(i); restart(); }
    }, true);

    // 自動再生
    var timer = null, hover = false, userPaused = reduceMotion;
    function start() {
      stop();
      if (userPaused || hover || document.hidden) return;
      timer = window.setInterval(next, INTERVAL);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function restart() { start(); }

    function setPaused(p) {
      userPaused = p;
      toggle.setAttribute('aria-pressed', p ? 'true' : 'false');
      toggle.setAttribute('aria-label', p ? '自動再生を開始' : '自動再生を停止');
      start();
    }
    toggle.addEventListener('click', function () { setPaused(!userPaused); });

    // マウス操作の端末だけ、ホバー中は自動再生を止める（スマホでタップ後に止まったままにならないように）
    if (window.matchMedia('(hover: hover)').matches) {
      root.addEventListener('mouseenter', function () { hover = true; stop(); });
      root.addEventListener('mouseleave', function () { hover = false; start(); });
    }
    document.addEventListener('visibilitychange', start);

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { render(false); }, 60);
    });
    window.addEventListener('load', function () { render(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(false); });

    render(false);
    setPaused(userPaused);
  }

  /* ---------------- タブ ---------------- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j]); tabs[j].focus(); }
      });
    });
  });

  /* ---------------- 外部サイトから戻ったとき、タップしたボタンの色が残らないように ---------------- */
  window.addEventListener('pageshow', function () {
    var el = document.activeElement;
    if (el && el !== document.body && typeof el.blur === 'function') el.blur();
  });

  /* ---------------- スマホ用メニュー（ハンバーガー） ---------------- */
  (function initDrawer() {
    var btn = document.querySelector('.menu-btn');
    var gnav = document.querySelector('.gnav');
    if (!btn || !gnav) return;

    var items = Array.prototype.slice.call(gnav.querySelectorAll('a')).map(function (a) {
      var small = a.querySelector('small');
      return {
        href: a.getAttribute('href'),
        ja: a.firstChild.textContent.trim(),
        en: small ? small.textContent : '',
        current: a.getAttribute('aria-current') === 'page'
      };
    });
    items.push({ href: 'contact.html', ja: 'お問い合わせ', en: 'CONTACT', current: /contact\.html$/.test(location.pathname) });

    var chev = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var sns = document.querySelector('.float-sns');

    var drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'メニュー');
    drawer.setAttribute('inert', '');
    drawer.innerHTML =
      '<div class="drawer-backdrop" data-close></div>' +
      '<div class="drawer-panel">' +
        '<div class="drawer-top"><span class="drawer-en">MENU</span>' +
          '<button class="drawer-close" type="button" aria-label="メニューを閉じる" data-close><span></span><span></span></button></div>' +
        '<ul class="drawer-list">' + items.map(function (it, i) {
          return '<li style="--i:' + i + '"><a href="' + it.href + '"' +
            (it.current ? ' aria-current="page"' : '') +
            (it.href === 'contact.html' ? ' class="is-contact"' : '') + '>' +
            '<span class="dj">' + it.ja + '</span><span class="de">' + it.en + '</span>' + chev + '</a></li>';
        }).join('') + '</ul>' +
        (sns ? '<div class="drawer-sns">' + sns.innerHTML + '</div>' : '') +
      '</div>';
    document.body.appendChild(drawer);

    function open() {
      drawer.removeAttribute('inert');
      drawer.classList.add('is-open');
      document.documentElement.classList.add('drawer-open');
      btn.setAttribute('aria-expanded', 'true');
      window.setTimeout(function () { drawer.querySelector('.drawer-close').focus(); }, 60);
    }
    function close() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      document.documentElement.classList.remove('drawer-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }

    btn.addEventListener('click', open);
    drawer.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });
    var wide = window.matchMedia('(min-width: 769px)');
    var onWide = function (m) { if (m.matches && drawer.classList.contains('is-open')) close(); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else wide.addListener(onWide);
  })();
})();
