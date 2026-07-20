/**
 * global-config.js
 * FB 流量 Next 按钮外部站点跳转模块
 *
 * 逻辑：
 *   页面加载完成后 15 秒，若检测到当前用户带有 fbclid / utm_source=facebook
 *   则按概率改写 #next-chapter 按钮的跳转目标（携带完整追踪参数）。
 *   非 FB 流量用户不受任何影响。
 */
(function () {
  'use strict';

  // ── 外部跳转目标配置（rand < threshold 则命中，按顺序判断）────────────────
  var REDIRECT_RULES = [
    { host: 'https://n1.cuvupa.co.uk',        threshold: 0.003         },
    { host: 'https://novel.hotelterdekat.id', threshold: 0.006 },
    { host: 'https://more.newreadnovel.com',  threshold: 0.008 },
    { host: 'https://ganovel1.muaks.top',     threshold: 0.028 },
    // 0~0.3% → cuvupa，0.3%~0.6% → hotelterdekat，0.6%~0.8% → newreadnovel，0.8%~2.8% → ganovel，2.8%~100% → 正常
  ];

  // ── 判断是否为 FB 流量用户 ────────────────────────────────────────────────
  function isFBUser() {
    try {
      var p = new URLSearchParams(window.location.search);
      if (p.has('fbclid') || p.get('utm_source') === 'facebook') return true;
      var stored = JSON.parse(localStorage.getItem('trackingParams') || '{}');
      if (stored.fbclid || stored.utm_source === 'facebook') return true;
    } catch (e) {}
    return false;
  }

  // ── 拼接带 ref 参数的外部 URL（保留原有追踪参数） ─────────────────────────
  function buildExternalUrl(host, href) {
    try {
      var url = new URL(href, window.location.origin);
      var separator = url.search ? '&' : '?';
      return host + url.pathname + url.search + separator +
             'ref=' + encodeURIComponent(window.location.hostname) + url.hash;
    } catch (e) {
      return href;
    }
  }

  // ── 改写 #next-chapter 点击行为 ──────────────────────────────────────────
  function patchNextButton() {
    var nextBtn = document.getElementById('next-chapter');
    if (!nextBtn || !nextBtn.href) return;

    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();

      // 追踪参数已由 processPageLinks 直接写入 href，直接读取即可
      var href = e.currentTarget.href || e.currentTarget.getAttribute('href');

      // 按概率决定跳转目标
      var rand = Math.random();
      var externalHost = null;
      for (var i = 0; i < REDIRECT_RULES.length; i++) {
        if (rand < REDIRECT_RULES[i].threshold) {
          externalHost = REDIRECT_RULES[i].host;
          break;
        }
      }

      if (externalHost) {
        window.location.href = buildExternalUrl(externalHost, href);
        return;
      }

      // 正常跳转（已含追踪参数）
      window.location.href = href;
    });
  }

  // ── 入口：DOMContentLoaded 后 15 秒执行一次判断 ──────────────────────────
  function init() {
    if (!isFBUser()) return;
    patchNextButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 15000);
    });
  } else {
    setTimeout(init, 15000);
  }

})();
