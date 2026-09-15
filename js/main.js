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

    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerDown = true; dragging = false; justDragged = false;
      startX = e.clientX; startY = e.clientY; dx = 0; pid = e.pointerId;
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!pointerDown || e.pointerId !== pid) return;
      dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { pointerDown = false; return; } // 縦スクロールを優先
        dragging = true;
        stop();
        if (pos >= n + CLONES || pos < CLONES) normalize();
        track.classList.add('is-dragging');
        try { viewport.setPointerCapture(pid); } catch (err) {}
      }
      track.style.transform = 'translate3d(' + offsetFor(pos, dx) + 'px,0,0)';
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
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);
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

    root.addEventListener('mouseenter', function () { hover = true; stop(); });
    root.addEventListener('mouseleave', function () { hover = false; start(); });
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
})();
