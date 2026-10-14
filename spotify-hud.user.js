// ==UserScript==
// @name         Spotify 16x Auto-Skipper & Native Mobile OS
// @namespace    http://tampermonkey.net/
// @version      10.4
// @match        https://open.spotify.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  var NL = String.fromCharCode(10);

  // Clean up any older instances
  var oldShell = document.getElementById('sp-mobile-shell');
  if (oldShell) oldShell.remove();
  var oldPeek = document.getElementById('sp-peek-btn');
  if (oldPeek) oldPeek.remove();
  var oldStyle = document.getElementById('sp-mobile-styles');
  if (oldStyle) oldStyle.remove();

  // --- 1. VIEWPORT & CONDITIONAL GESTURE LOCK ---
  function isMobileShellHidden() {
    var shell = document.getElementById('sp-mobile-shell');
    return !shell || shell.classList.contains('is-hidden');
  }

  function setViewportMode(isMobile) {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      if (document.head) document.head.appendChild(meta);
    }
    if (meta) {
      if (isMobile) {
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
      } else {
        meta.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
      }
    }
  }
  setViewportMode(true);

  document.addEventListener('gesturestart', function (e) {
    if (!isMobileShellHidden()) e.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturechange', function (e) {
    if (!isMobileShellHidden()) e.preventDefault();
  }, { passive: false });

  document.addEventListener('dblclick', function (e) {
    if (!isMobileShellHidden()) e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', function (e) {
    if (!isMobileShellHidden() && e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // --- 2. INJECT CSS ---
  var cssLines = [
    '* { box-sizing: border-box !important; -webkit-tap-highlight-color: transparent !important; }',
    '#sp-peek-btn { position: fixed !important; top: 1.8vh !important; right: 4vw !important; z-index: 2147483647 !important; background: rgba(18, 18, 18, 0.92) !important; backdrop-filter: blur(12px) !important; color: #ffffff !important; border: 0.3vw solid rgba(255, 255, 255, 0.2) !important; border-radius: 50vw !important; padding: 1vh 3.4vw !important; font-size: 3.1vw !important; font-weight: 700 !important; font-family: sans-serif !important; display: flex !important; align-items: center !important; gap: 1.5vw !important; box-shadow: 0 0.8vh 2.4vh rgba(0,0,0,0.7) !important; cursor: pointer !important; user-select: none !important; }',
    '#sp-peek-btn svg { width: 4.2vw !important; height: 4.2vw !important; fill: #1db954 !important; }',
    '#sp-peek-btn:active { transform: scale(0.94) !important; }',
    '#sp-mobile-shell { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; background: linear-gradient(180deg, #222222 0%, #121212 42%, #000000 100%) !important; color: #ffffff !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; z-index: 2147483646 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; user-select: none !important; overflow: hidden !important; }',
    '#sp-mobile-shell.is-hidden { display: none !important; }',
    '.sp-top-bar { padding: 2vh 5vw 1vh 5vw !important; display: flex !important; align-items: center !important; justify-content: space-between !important; flex-shrink: 0 !important; height: 7vh !important; }',
    '.sp-speed-pill { font-size: 2.9vw !important; font-weight: 800 !important; padding: 0.7vh 2.8vw !important; border-radius: 50vw !important; text-transform: uppercase !important; display: flex !important; align-items: center !important; gap: 1.4vw !important; }',
    '.sp-speed-pill .sp-dot { width: 1.8vw !important; height: 1.8vw !important; border-radius: 50% !important; }',
    '.sp-speed-pill.mode-16x { background: rgba(233, 20, 41, 0.2) !important; color: #ff4d5e !important; border: 0.25vw solid #e91429 !important; }',
    '.sp-speed-pill.mode-16x .sp-dot { background: #ff4d5e !important; }',
    '.sp-speed-pill.mode-1x { background: rgba(29, 185, 84, 0.16) !important; color: #1db954 !important; border: 0.25vw solid rgba(29, 185, 84, 0.4) !important; }',
    '.sp-speed-pill.mode-1x .sp-dot { background: #1db954 !important; }',
    '.sp-view-panel { display: none !important; flex: 1 !important; flex-direction: column !important; width: 100vw !important; overflow-y: auto !important; padding: 1vh 6vw !important; min-height: 0 !important; }',
    '.sp-view-panel.active-view { display: flex !important; }',
    '#sp-view-player { justify-content: space-evenly !important; align-items: center !important; overflow: hidden !important; padding: 0.5vh 6vw 1.5vh 6vw !important; }',
    '.sp-art-container { width: 82vw !important; height: 82vw !important; max-width: 43vh !important; max-height: 43vh !important; border-radius: 3vw !important; overflow: hidden !important; box-shadow: 0 2vh 5vh rgba(0,0,0,0.85) !important; background: #181818 !important; flex-shrink: 0 !important; }',
    '.sp-art-img { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }',
    '.sp-meta-row { width: 88vw !important; display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 3vw !important; margin-top: 0.5vh !important; }',
    '.sp-meta-text { flex: 1 !important; overflow: hidden !important; }',
    '.sp-track-title { font-size: 5.6vw !important; font-weight: 800 !important; color: #ffffff !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; }',
    '.sp-track-artist { font-size: 4vw !important; font-weight: 500 !important; color: #b3b3b3 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; margin-top: 0.4vh !important; }',
    '.sp-like-btn { background: none !important; border: none !important; color: #b3b3b3 !important; padding: 2vw !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; }',
    '.sp-like-btn:active { transform: scale(0.82) !important; }',
    '.sp-like-btn svg { width: 7.5vw !important; height: 7.5vw !important; fill: currentColor !important; }',
    '.sp-like-btn.is-liked { color: #1db954 !important; }',
    '.sp-scrubber-wrap { width: 88vw !important; display: flex !important; flex-direction: column !important; }',
    '.sp-scrub-touch-area { width: 100% !important; padding: 2.2vh 0 !important; cursor: pointer !important; touch-action: none !important; }',
    '.sp-scrub-track { width: 100% !important; height: 0.9vh !important; background: rgba(255, 255, 255, 0.22) !important; border-radius: 1vh !important; position: relative !important; }',
    '.sp-scrub-fill { width: 0%; height: 100% !important; background: #ffffff !important; border-radius: 1vh !important; position: relative !important; }',
    '.sp-scrub-touch-area:active .sp-scrub-fill { background: #1db954 !important; }',
    '.sp-scrub-thumb { position: absolute !important; right: -2.2vw !important; top: 50% !important; transform: translateY(-50%) !important; width: 4.4vw !important; height: 4.4vw !important; background: #ffffff !important; border-radius: 50% !important; box-shadow: 0 0.3vh 1vh rgba(0,0,0,0.8) !important; }',
    '.sp-time-labels { display: flex !important; justify-content: space-between !important; font-size: 3.1vw !important; font-weight: 600 !important; color: #a7a7a7 !important; margin-top: -0.6vh !important; }',
    '.sp-controls-row { width: 88vw !important; display: flex !important; align-items: center !important; justify-content: space-between !important; }',
    '.sp-ctrl-btn { background: transparent !important; border: none !important; color: #b3b3b3 !important; width: 13vw !important; height: 13vw !important; display: flex !important; align-items: center !important; justify-content: center !important; position: relative !important; cursor: pointer !important; }',
    '.sp-ctrl-btn.primary-skip { color: #ffffff !important; }',
    '.sp-ctrl-btn:active { transform: scale(0.85) !important; }',
    '.sp-ctrl-btn svg { width: 7.5vw !important; height: 7.5vw !important; fill: currentColor !important; }',
    '.sp-ctrl-btn.primary-skip svg { width: 8.8vw !important; height: 8.8vw !important; }',
    '.sp-ctrl-btn.state-active { color: #1db954 !important; }',
    '.sp-ctrl-btn.state-active::after { content: "" !important; position: absolute !important; bottom: 0.6vw !important; width: 1.4vw !important; height: 1.4vw !important; background: #1db954 !important; border-radius: 50% !important; }',
    '.sp-mode-badge { position: absolute !important; top: 0.8vw !important; right: 0.6vw !important; background: #1db954 !important; color: #000000 !important; font-size: 2.5vw !important; font-weight: 900 !important; min-width: 3.8vw !important; height: 3.8vw !important; padding: 0 0.4vw !important; border-radius: 50vw !important; display: none !important; align-items: center !important; justify-content: center !important; line-height: 1 !important; }',
    '.sp-ctrl-btn.show-badge .sp-mode-badge { display: flex !important; }',
    '.sp-play-main { background: #ffffff !important; color: #000000 !important; width: 18.5vw !important; height: 18.5vw !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; border: none !important; box-shadow: 0 0.8vh 2.5vh rgba(0,0,0,0.5) !important; cursor: pointer !important; }',
    '.sp-play-main:active { transform: scale(0.92) !important; }',
    '.sp-play-main svg { width: 8.5vw !important; height: 8.5vw !important; fill: #000000 !important; }',
    '.sp-section-header { font-size: 5.6vw !important; font-weight: 800 !important; margin: 1vh 0 1.5vh 0 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; flex-shrink: 0 !important; }',
    '.sp-action-pill { background: #282828 !important; color: #ffffff !important; border: none !important; padding: 0.8vh 3.2vw !important; border-radius: 50vw !important; font-size: 3vw !important; font-weight: 700 !important; cursor: pointer !important; }',
    '.sp-search-bar { width: 100% !important; background: #ffffff !important; border-radius: 2vw !important; padding: 1.4vh 3.5vw !important; display: flex !important; align-items: center !important; gap: 2.5vw !important; margin-bottom: 2vh !important; flex-shrink: 0 !important; }',
    '.sp-search-bar svg { width: 5.5vw !important; height: 5.5vw !important; fill: #121212 !important; flex-shrink: 0 !important; }',
    '.sp-search-input { border: none !important; outline: none !important; background: transparent !important; color: #000000 !important; font-size: 4vw !important; font-weight: 600 !important; width: 100% !important; }',
    '.sp-item-list { display: flex !important; flex-direction: column !important; gap: 1.2vh !important; padding-bottom: 4vh !important; overflow-y: auto !important; }',
    '.sp-list-card { background: rgba(255, 255, 255, 0.05) !important; border-radius: 2vw !important; padding: 1.2vh 3vw !important; display: flex !important; align-items: center !important; gap: 3.5vw !important; cursor: pointer !important; }',
    '.sp-list-card:active { background: rgba(255, 255, 255, 0.14) !important; }',
    '.sp-list-img { width: 13vw !important; height: 13vw !important; border-radius: 1.2vw !important; object-fit: cover !important; background: #282828 !important; flex-shrink: 0 !important; }',
    '.sp-list-info { flex: 1 !important; overflow: hidden !important; }',
    '.sp-list-title { font-size: 4vw !important; font-weight: 700 !important; color: #ffffff !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; }',
    '.sp-list-sub { font-size: 3.2vw !important; color: #a7a7a7 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; margin-top: 0.3vh !important; }',
    '.sp-card-play-btn { width: 10vw !important; height: 10vw !important; border-radius: 50% !important; background: #1db954 !important; color: #000000 !important; border: none !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; }',
    '.sp-card-play-btn svg { width: 4.8vw !important; height: 4.8vw !important; fill: #000000 !important; }',
    '.sp-bottom-nav { height: 9vh !important; background: #000000 !important; border-top: 0.15vh solid rgba(255, 255, 255, 0.1) !important; display: flex !important; justify-content: space-around !important; align-items: center !important; flex-shrink: 0 !important; }',
    '.sp-nav-btn { flex: 1 !important; height: 100% !important; background: none !important; border: none !important; color: #b3b3b3 !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; gap: 0.5vh !important; font-size: 2.6vw !important; font-weight: 600 !important; cursor: pointer !important; padding: 0 0.5vw !important; }',
    '.sp-nav-btn svg { width: 5.4vw !important; height: 5.4vw !important; fill: currentColor !important; }',
    '.sp-nav-btn.active-tab { color: #ffffff !important; }'
  ];

  var styleEl = document.createElement('style');
  styleEl.id = 'sp-mobile-styles';
  styleEl.textContent = cssLines.join(NL);
  if (document.head) document.head.appendChild(styleEl);

  // --- 3. ROBUST CLICK & MEDIA HOOKS ---
  function robustClick(el) {
    if (!el) return;
    var evOpts = { bubbles: true, cancelable: true, view: window };
    try { el.dispatchEvent(new PointerEvent('pointerdown', evOpts)); } catch (e) {}
    try { el.dispatchEvent(new MouseEvent('mousedown', evOpts)); } catch (e) {}
    try { el.dispatchEvent(new PointerEvent('pointerup', evOpts)); } catch (e) {}
    try { el.dispatchEvent(new MouseEvent('mouseup', evOpts)); } catch (e) {}
    try { el.dispatchEvent(new MouseEvent('click', evOpts)); } catch (e) {}
    try {
      var keys = Object.keys(el);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('__reactProps$') === 0) {
          var props = el[keys[i]];
          if (props && typeof props.onClick === 'function') {
            props.onClick({ preventDefault: function () {}, stopPropagation: function () {}, target: el, currentTarget: el });
          }
        }
      }
    } catch (e) {}
    try {
      if (typeof el.click === 'function') el.click();
    } catch (e) {}
  }

  var trackedMedia = [];
  function addMediaToList(el) {
    if (el && trackedMedia.indexOf(el) === -1) {
      trackedMedia.push(el);
    }
  }

  try {
    var origCreate = document.createElement;
    document.createElement = function (tag) {
      var el = origCreate.apply(document, arguments);
      if (tag && (String(tag).toLowerCase() === 'audio' || String(tag).toLowerCase() === 'video')) {
        try {
          el.playbackRate = 16.0;
          el.defaultPlaybackRate = 16.0;
        } catch (err) {}
        addMediaToList(el);
      }
      return el;
    };
  } catch (err) {}

  var spotifySeekHandler = null;
  try {
    if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
      var origSetHandler = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
      navigator.mediaSession.setActionHandler = function (action, handler) {
        if (action === 'seekto' && typeof handler === 'function') {
          spotifySeekHandler = handler;
        }
        return origSetHandler(action, handler);
      };
    }
  } catch (err) {}

  function getAllMedia() {
    var domMedia = document.querySelectorAll('audio, video');
    for (var i = 0; i < domMedia.length; i++) {
      addMediaToList(domMedia[i]);
    }
    return trackedMedia;
  }

  function isRealSongPlaying() {
    var adNodes = document.querySelector(
      '[data-testid="ad-info"], [aria-label*="Advertisement"], [data-testid="context-item-info-ad-subtitle"]'
    );
    if (adNodes) return false;

    if (navigator.mediaSession && navigator.mediaSession.metadata) {
      var t = String(navigator.mediaSession.metadata.title || '').toLowerCase();
      var a = String(navigator.mediaSession.metadata.artist || '').toLowerCase();
      if (!t || t.indexOf('advertisement') !== -1 || t === 'spotify' || a === 'spotify') return false;
    }

    var trackLink = document.querySelector(
      '[data-testid="context-item-link"], [data-testid="nowplaying-track-link"]'
    );
    if (!trackLink) return false;
    var href = String(trackLink.getAttribute('href') || '');
    if (
      href.indexOf('/track/') === -1 &&
      href.indexOf('/album/') === -1 &&
      href.indexOf('/playlist/') === -1 &&
      href.indexOf('/episode/') === -1
    ) {
      return false;
    }
    return true;
  }

  function upgradeToHDArt(url) {
    if (!url) return '';
    return String(url)
      .split('ab67616d00004851').join('ab67616d0000b273')
      .split('ab67616d00001e02').join('ab67616d0000b273')
      .split('ab67616d000011eb').join('ab67616d0000b273');
  }

  // --- 4. TIMELINE & SCRUBBING ENGINE ---
  var isUserScrubbing = false;

  function parseTimeStr(str) {
    if (!str) return 0;
    var clean = String(str).split('-').join('').trim();
    var parts = clean.split(':');
    if (parts.length === 3) {
      return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
    }
    if (parts.length === 2) {
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    return 0;
  }

  function formatSeconds(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function getTotalDurationSeconds() {
    var rangeInput = document.querySelector('[data-testid="playback-progressbar"] input[type="range"]');
    if (rangeInput && rangeInput.max) {
      var maxMs = parseFloat(rangeInput.max) || 0;
      if (maxMs > 0) return maxMs / 1000;
    }
    var durEl = document.querySelector('[data-testid="playback-duration"]');
    if (durEl) {
      var val = parseTimeStr(durEl.innerText || durEl.textContent);
      if (val > 0) return val;
    }
    var mediaList = getAllMedia();
    for (var m = 0; m < mediaList.length; m++) {
      if (mediaList[m].duration && mediaList[m].duration > 1) {
        return mediaList[m].duration;
      }
    }
    return 0;
  }

  function executeSeek(ratio) {
    var clamped = Math.max(0, Math.min(1, ratio));
    var totalSec = getTotalDurationSeconds();
    var targetSec = totalSec * clamped;
    var targetMs = Math.floor(targetSec * 1000);

    if (spotifySeekHandler && totalSec > 0) {
      try {
        spotifySeekHandler({ seekTime: targetSec });
      } catch (e) {}
    }

    var rangeInput = document.querySelector('[data-testid="playback-progressbar"] input[type="range"]');
    if (rangeInput) {
      var max = parseFloat(rangeInput.max) || (totalSec * 1000) || 100;
      var targetVal = max * clamped;
      try {
        var valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (valueSetter) valueSetter.call(rangeInput, targetVal);
        rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
        rangeInput.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {}
    }

    var railNode = document.querySelector('[data-testid="progress-bar"]') || document.querySelector('[data-testid="playback-progressbar"]');
    if (railNode) {
      var rect = railNode.getBoundingClientRect();
      if (rect.width > 0) {
        var clientX = rect.left + rect.width * clamped;
        var clientY = rect.top + rect.height / 2;
        var evOpts = {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
          clientX: clientX,
          clientY: clientY,
          screenX: clientX,
          screenY: clientY,
          button: 0,
          buttons: 1,
          pointerId: 1,
          isPrimary: true
        };
        try {
          railNode.dispatchEvent(new PointerEvent('pointerdown', evOpts));
          railNode.dispatchEvent(new MouseEvent('mousedown', evOpts));
          window.dispatchEvent(new PointerEvent('pointerup', evOpts));
          window.dispatchEvent(new MouseEvent('mouseup', evOpts));
        } catch (err) {}
      }
    }

    var mediaList = getAllMedia();
    for (var m = 0; m < mediaList.length; m++) {
      var media = mediaList[m];
      if (media.duration && media.duration > 10) {
        try { media.currentTime = media.duration * clamped; } catch (e) {}
      } else if (totalSec > 0) {
        try { media.currentTime = targetSec; } catch (e) {}
      }
    }
  }

  // --- 5. NATIVE BUTTON LOCATORS & STATE SYNC ---
  function getNativeShuffleButton() {
    return document.querySelector(
      'button[aria-label*="Shuffle"], button[aria-label*="shuffle"], [data-testid="control-button-shuffle"]'
    );
  }

  function getShuffleState() {
    var nativeShuf = getNativeShuffleButton();
    if (!nativeShuf) return { active: false, smart: false };

    var label = String(nativeShuf.getAttribute('aria-label') || '').toLowerCase();
    var checked = String(nativeShuf.getAttribute('aria-checked') || '').toLowerCase();
    var classes = String(nativeShuf.className || '');
    var isSubdued = classes.indexOf('text-subdued') !== -1;

    if (label.indexOf('enable smart shuffle') !== -1) {
      return { active: true, smart: false };
    }
    if (label.indexOf('disable smart shuffle') !== -1) {
      return { active: true, smart: true };
    }
    if (label.indexOf('enable shuffle') !== -1) {
      return { active: false, smart: false };
    }
    if (label.indexOf('disable shuffle') !== -1) {
      return { active: true, smart: false };
    }

    if (checked === 'mixed') return { active: true, smart: true };
    if (checked === 'true') return { active: true, smart: false };

    if (!isSubdued && (classes.indexOf('bright-accent') !== -1 || classes.indexOf('is-active') !== -1)) {
      return { active: true, smart: false };
    }
    return { active: false, smart: false };
  }

  function getNativeLikeButton() {
    var bar = document.querySelector('footer, [data-testid="now-playing-bar"]');
    if (bar) {
      var btn = bar.querySelector(
        'button[aria-label="Add to Liked Songs"], ' +
        'button[aria-label="Add to playlist"], ' +
        'button[aria-label*="Liked Songs"], ' +
        'button[aria-label*="Your Library"], ' +
        'button[data-testid="add-button"]'
      );
      if (btn) return btn;
    }

    var allBtns = document.querySelectorAll('button[aria-label="Add to Liked Songs"], button[aria-label="Add to playlist"]');
    for (var i = allBtns.length - 1; i >= 0; i--) {
      if (!allBtns[i].closest('[role="grid"]') && !allBtns[i].closest('nav')) {
        return allBtns[i];
      }
    }
    return null;
  }

  function getLikeState() {
    var btn = getNativeLikeButton();
    if (!btn) return false;

    var checked = String(btn.getAttribute('aria-checked') || '').toLowerCase();
    var label = String(btn.getAttribute('aria-label') || '').toLowerCase();
    var classes = String(btn.className || '');

    if (checked === 'true' || label === 'add to playlist' || label.indexOf('remove') !== -1 || classes.indexOf('bright-accent') !== -1) {
      return true;
    }
    if (checked === 'false' || label === 'add to liked songs' || classes.indexOf('text-subdued') !== -1) {
      return false;
    }
    return false;
  }

  function handleLikeButtonClick() {
    var nativeLike = getNativeLikeButton();
    if (!nativeLike) return;

    var currentlyLiked = getLikeState();
    if (!currentlyLiked) {
      robustClick(nativeLike);
      setTimeout(syncState, 150);
      setTimeout(syncState, 450);
    } else {
      robustClick(nativeLike);

      var checkTimer = setInterval(function () {
        var popover = document.querySelector('[data-testid="add-to-playlist-menu"], [role="dialog"], [data-encore-id="popover"], div[data-tippy-root]');
        if (popover) {
          clearInterval(checkTimer);
          var likedOption = popover.querySelector('button[aria-label*="Liked Songs"], [role="menuitemcheckbox"][aria-checked="true"], input[type="checkbox"]:checked, [data-encore-id="listRow"]');
          if (likedOption) {
            robustClick(likedOption);
          }
          setTimeout(function () {
            document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape', code: 'Escape', keyCode: 27 }));
            setTimeout(syncState, 200);
          }, 150);
        }
      }, 50);

      setTimeout(function () { clearInterval(checkTimer); }, 1500);
    }
  }

  // --- 6. ON-DEMAND DIRECT PANEL OPENERS ---
  function ensureLibraryOpen(callback) {
    var openLibBtn = document.querySelector('button[aria-label="Open Your Library"]');
    if (openLibBtn) {
      openLibBtn.click();
      setTimeout(callback, 400);
      return;
    }
    callback();
  }

  function ensureQueueOpen(callback) {
    var qBtn = document.querySelector('button[data-testid="control-button-queue"], button[aria-label="Queue"]');
    var isClosed = false;
    if (qBtn) {
      var active = qBtn.getAttribute('data-active');
      var pressed = qBtn.getAttribute('aria-pressed');
      if (active === 'false' || pressed === 'false') {
        isClosed = true;
      }
    }
    if (qBtn && isClosed) {
      qBtn.click();
      setTimeout(callback, 400);
      return;
    }
    callback();
  }

  // --- 7. SCRAPERS (PLAYLISTS, TRACKS, QUEUE & SEARCH) ---
  function refreshLibraryList() {
    var container = document.getElementById('sp-library-list');
    if (!container) return;

    ensureLibraryOpen(function () {
      var libGrid = document.querySelector('div[role="grid"][aria-label="Your Library"]');
      var rows = libGrid
        ? libGrid.querySelectorAll('[data-encore-id="listRow"]')
        : document.querySelectorAll('nav[aria-label="Your Library"] [data-encore-id="listRow"], [aria-label="Your Library"] [data-encore-id="listRow"]');

      var playlistCards = [];
      var seenTitles = {};

      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        if (row.querySelector('button[aria-label*="Search"], input')) continue;

        var titleEl = row.querySelector('[data-encore-id="listRowTitle"] .e-10860-line-clamp, [data-encore-id="listRowTitle"], [id^="listrow-title-"]');
        var title = titleEl ? titleEl.innerText.trim() : '';

        var subEl = row.querySelector('[data-encore-id="listRowSubtitle"], [id^="listrow-subtitle-"]');
        var sub = 'Playlist';
        if (subEl) {
          var clone = subEl.cloneNode(true);
          var pinnedIcons = clone.querySelectorAll('svg, title');
          for (var p = 0; p < pinnedIcons.length; p++) pinnedIcons[p].remove();
          sub = clone.innerText.trim() || 'Playlist';
        }

        if (!title) {
          var link = row.querySelector('a[href*="/playlist/"], a[href*="/collection/tracks"], a[href*="/album/"], a[href*="/artist/"]');
          if (link) title = link.getAttribute('aria-label') || link.innerText.trim();
        }

        if (!title || seenTitles[title]) continue;
        seenTitles[title] = true;

        var imgEl = row.querySelector('img[data-testid="entity-image"], img');
        var imgSrc = upgradeToHDArt(imgEl ? imgEl.src : '');

        var playBtn = row.querySelector('button[data-testid="play-button"], button[aria-label*="Play"]');
        var openTarget = row.querySelector('.e-10860-legacy-list-row__row-button, [role="button"]') || row;

        playlistCards.push({
          title: title,
          sub: sub,
          imgSrc: imgSrc,
          playBtn: playBtn,
          openTarget: openTarget,
          row: row
        });
      }

      if (!playlistCards.length) {
        container.innerHTML = '<div style="color:#a7a7a7;font-size:3.8vw;text-align:center;padding:5vh 2vw;">No playlists detected yet. Tap Reload in a moment.</div>';
        return;
      }

      container.innerHTML = '';
      for (var c = 0; c < playlistCards.length; c++) {
        (function (data) {
          var card = document.createElement('div');
          card.className = 'sp-list-card';
          card.innerHTML =
            (data.imgSrc
              ? '<img class="sp-list-img" src="' + data.imgSrc + '" alt="" />'
              : '<div class="sp-list-img" style="display:flex;align-items:center;justify-content:center;background:#282828;"><svg style="width:6vw;height:6vw;fill:#b3b3b3;" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>') +
            '<div class="sp-list-info">' +
            '<span class="sp-list-title">' + data.title + '</span>' +
            '<span class="sp-list-sub">' + data.sub + '</span>' +
            '</div>' +
            '<button class="sp-card-play-btn" title="Play">' +
            '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>' +
            '</button>';

          card.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('.sp-card-play-btn')) return;
            robustClick(data.openTarget);
            setTimeout(function () {
              switchTab('tracks');
            }, 450);
          });

          var btn = card.querySelector('.sp-card-play-btn');
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (data.playBtn) {
              robustClick(data.playBtn);
            } else {
              robustClick(data.openTarget);
              setTimeout(function () {
                var mainPlay = document.querySelector('[data-testid="action-bar-row"] [data-testid="play-button"], button[data-testid="play-button"]');
                if (mainPlay) robustClick(mainPlay);
              }, 600);
            }
            switchTab('player');
          });

          container.appendChild(card);
        })(playlistCards[c]);
      }
    });
  }

  function extractTrackData(row, idx) {
    var titleEl = row.querySelector('[data-testid="internal-track-link"] div, [data-testid="internal-track-link"], [data-encore-id="listRowTitle"] .e-10860-line-clamp, [data-encore-id="listRowTitle"]');
    var title = titleEl ? titleEl.innerText.trim() : 'Track ' + (idx + 1);

    var artistLinks = row.querySelectorAll('a[href*="/artist/"]');
    var artist = '';
    if (artistLinks.length > 0) {
      var arr = [];
      for (var a = 0; a < artistLinks.length; a++) {
        var txt = artistLinks[a].innerText.trim();
        if (txt && arr.indexOf(txt) === -1) arr.push(txt);
      }
      artist = arr.join(', ');
    } else {
      var subEl = row.querySelector('[data-encore-id="listRowSubtitle"]');
      if (subEl) {
        var clone = subEl.cloneNode(true);
        var badges = clone.querySelectorAll('svg, [title="Explicit"], [aria-label="Explicit"], [title="Music video"]');
        for (var b = 0; b < badges.length; b++) badges[b].remove();
        artist = clone.innerText.split('•').pop().trim();
      }
      if (!artist) artist = 'Spotify Artist';
    }

    var imgEl = row.querySelector('img[data-testid="entity-image"], img');
    var imgSrc = upgradeToHDArt(imgEl ? imgEl.src : '');
    var playBtn = row.querySelector('button[aria-label*="Play"], button[aria-label*="Pause"], button[data-testid="play-button"]');
    var clickTarget = playBtn || row.querySelector('[data-testid="internal-track-link"], .e-10860-legacy-list-row__row-button') || row;

    return { title: title, artist: artist, imgSrc: imgSrc, clickTarget: clickTarget, playBtn: playBtn, row: row };
  }

  // Robust play action for any track row
  function playTrackRow(data) {
    if (!data) return;

    if (data.row) {
      try { data.row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); } catch(e) {}

      // 1. Clean single click on native play button if present
      var pBtn = data.row.querySelector('button[aria-label*="Play"], button[data-testid="play-button"]');
      if (pBtn) {
        pBtn.click();
        return;
      }

      // 2. Double click on the native row
      try {
        data.row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
      } catch(e) {}

      // 3. Fallback click on row button / link
      var clickEl = data.row.querySelector('.e-10860-legacy-list-row__row-button, a[href*="/track/"], [role="button"]') || data.clickTarget;
      if (clickEl) {
        try { clickEl.click(); } catch(e) {}
      }
    }
  }

  function renderRowsToContainer(rows, container, emptyMsg) {
    if (!rows || !rows.length) {
      container.innerHTML = '<div style="color:#a7a7a7;font-size:3.8vw;text-align:center;padding:5vh 2vw;">' + emptyMsg + '</div>';
      return;
    }

    container.innerHTML = '';
    for (var i = 0; i < rows.length; i++) {
      (function (data) {
        var card = document.createElement('div');
        card.className = 'sp-list-card';
        card.innerHTML =
          (data.imgSrc
            ? '<img class="sp-list-img" src="' + data.imgSrc + '" alt="" />'
            : '<div class="sp-list-img" style="background:#282828;"></div>') +
          '<div class="sp-list-info">' +
          '<span class="sp-list-title">' + data.title + '</span>' +
          '<span class="sp-list-sub">' + data.artist + '</span>' +
          '</div>' +
          '<button class="sp-card-play-btn" title="Play">' +
          '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>' +
          '</button>';

        // Tapping the card or the green play button plays the song and opens player view
        card.onclick = function () {
          playTrackRow(data);
          setTimeout(function () {
            switchTab('player');
          }, 150);
        };

        container.appendChild(card);
      })(extractTrackData(rows[i], i));
    }
  }

  // --- SEPARATE TAB 1: TRACKS (Current Playlist / Album in view) ---
  function refreshTracksList() {
    var container = document.getElementById('sp-tracks-list');
    if (!container) return;

    var rows = document.querySelectorAll(
      '[data-testid="track-list"] [data-testid="tracklist-row"], [data-testid="tracklist-row"]'
    );
    renderRowsToContainer(rows, container, 'No tracks open. Select a playlist in Library to view tracks here!');
  }

  // --- SEPARATE TAB 2: QUEUE (Strictly Next Up List) ---
  function refreshQueueList() {
    var container = document.getElementById('sp-queue-list');
    if (!container) return;

    ensureQueueOpen(function () {
      var queueList = document.querySelector('ul[aria-label="Next up"], ul[role="treegrid"][aria-label*="Next"]');
      var rows = queueList ? queueList.querySelectorAll('li[role="row"]') : [];
      renderRowsToContainer(rows, container, 'Queue is empty or loading. Tap Reload!');
    });
  }

  function setNativeInputValue(input, val) {
    var valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    var prototype = Object.getPrototypeOf(input);
    var prototypeSetter = Object.getOwnPropertyDescriptor(prototype, 'value') ? Object.getOwnPropertyDescriptor(prototype, 'value').set : null;
    if (prototypeSetter && valueSetter !== prototypeSetter) {
      prototypeSetter.call(input, val);
    } else if (valueSetter) {
      valueSetter.call(input, val);
    } else {
      input.value = val;
    }
    if (input._valueTracker) input._valueTracker.setValue('');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function executeLiveSearch(query) {
    var resultsContainer = document.getElementById('sp-search-results');
    if (!query || !String(query).trim()) return;

    resultsContainer.innerHTML = '<div style="color:#a7a7a7;font-size:3.8vw;text-align:center;padding:4vh;">Searching Spotify...</div>';

    var searchInput = document.querySelector('input[data-testid="search-input"], input[data-encore-id="formInput"]');
    if (!searchInput) {
      var searchIcon = document.querySelector('button[data-testid="search-icon"], a[href="/search"]');
      if (searchIcon) robustClick(searchIcon);
    }

    setTimeout(function () {
      var input = document.querySelector('input[data-testid="search-input"], input[data-encore-id="formInput"]');
      if (input) {
        input.focus();
        setNativeInputValue(input, query);
      }
      setTimeout(function () {
        var resultRows = document.querySelectorAll(
          '#search-dropdown [data-encore-id="listRow"], ul[data-encore-id="typeList"] [data-encore-id="listRow"], [data-encore-id="listRow"][role="row"], [data-testid="tracklist-row"]'
        );
        renderRowsToContainer(resultRows, resultsContainer, 'No search results found.');
      }, 700);
    }, 200);
  }

  function switchTab(tabName) {
    var panels = document.querySelectorAll('.sp-view-panel');
    for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active-view');
    var btns = document.querySelectorAll('.sp-nav-btn');
    for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active-tab');

    var p = document.getElementById('sp-view-' + tabName);
    if (p) p.classList.add('active-view');
    var b = document.getElementById('sp-tab-' + tabName);
    if (b) b.classList.add('active-tab');

    if (tabName === 'library') refreshLibraryList();
    if (tabName === 'tracks') refreshTracksList();
    if (tabName === 'queue') refreshQueueList();
  }

  // --- 8. CONTINUOUS SYNC LOOP ---
  function syncState() {
    var isSong = isRealSongPlaying();
    var targetRate = isSong ? 1.0 : 16.0;

    var mediaList = getAllMedia();
    for (var i = 0; i < mediaList.length; i++) {
      var media = mediaList[i];
      if (media.playbackRate !== targetRate) {
        try {
          media.playbackRate = targetRate;
          media.defaultPlaybackRate = targetRate;
        } catch (e) {}
      }
      if (!isSong && !media.muted) {
        media.muted = true;
      } else if (isSong && media.muted) {
        media.muted = false;
      }
    }

    var badge = document.getElementById('sp-badge');
    var badgeText = document.getElementById('sp-badge-text');
    if (badge && badgeText) {
      badgeText.innerText = isSong ? '1x Song' : '16x Ad Skip';
      badge.className = isSong ? 'sp-speed-pill mode-1x' : 'sp-speed-pill mode-16x';
    }

    var titleEl = document.getElementById('sp-title');
    var artistEl = document.getElementById('sp-artist');
    var artEl = document.getElementById('sp-art');

    var domTitleNode = document.querySelector('[data-testid="context-item-link"]');
    var domArtistNode = document.querySelector('[data-testid="context-item-info-subtitles"]');
    var domArtNode = document.querySelector('[data-testid="cover-art-image"]');

    var domTitle = domTitleNode ? domTitleNode.innerText : '';
    var domArtist = domArtistNode ? domArtistNode.innerText : '';
    var metaArt = (navigator.mediaSession && navigator.mediaSession.metadata && navigator.mediaSession.metadata.artwork && navigator.mediaSession.metadata.artwork[0])
      ? navigator.mediaSession.metadata.artwork[0].src
      : '';
    var hdArtUrl = upgradeToHDArt((domArtNode ? domArtNode.src : '') || metaArt);

    if (titleEl) {
      titleEl.innerText = domTitle || (navigator.mediaSession && navigator.mediaSession.metadata ? navigator.mediaSession.metadata.title : '') || 'Ready to Play';
    }
    if (artistEl) {
      artistEl.innerText = domArtist || (navigator.mediaSession && navigator.mediaSession.metadata ? navigator.mediaSession.metadata.artist : '') || 'Spotify';
    }
    if (artEl && hdArtUrl && artEl.src !== hdArtUrl) {
      artEl.src = hdArtUrl;
    }

    if (navigator.mediaSession && navigator.mediaSession.metadata && hdArtUrl) {
      var curArt = (navigator.mediaSession.metadata.artwork && navigator.mediaSession.metadata.artwork[0]) ? navigator.mediaSession.metadata.artwork[0].src : '';
      if (String(curArt).indexOf('0000b273') === -1) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: domTitle || navigator.mediaSession.metadata.title,
            artist: domArtist || navigator.mediaSession.metadata.artist,
            album: navigator.mediaSession.metadata.album || '',
            artwork: [{ src: hdArtUrl, sizes: '640x640', type: 'image/jpeg' }]
          });
        } catch (e) {}
      }
    }

    var nativePlay = document.querySelector('[data-testid="control-button-playpause"]');
    var playSvg = document.getElementById('sp-play-svg');
    if (nativePlay && playSvg) {
      var playLabel = String(nativePlay.getAttribute('aria-label') || '').toLowerCase();
      var isPlaying = playLabel.indexOf('pause') !== -1;
      playSvg.innerHTML = isPlaying
        ? '<path d="M5.7 3a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7H5.7zm10 0a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7h-2.6z"></path>'
        : '<path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606"></path></svg>';
    }

    // Shuffle Sync
    var btnShuf = document.getElementById('sp-btn-shuf');
    var shufBadge = document.getElementById('sp-shuf-badge');
    if (btnShuf) {
      var shufState = getShuffleState();
      btnShuf.classList.toggle('state-active', shufState.active);
      btnShuf.classList.toggle('show-badge', shufState.smart);
      if (shufBadge) shufBadge.innerText = '✦';
    }

    // Repeat Sync
    var nativeRep = document.querySelector('[data-testid="control-button-repeat"]');
    var btnRep = document.getElementById('sp-btn-rep');
    if (nativeRep && btnRep) {
      var repChecked = nativeRep.getAttribute('aria-checked');
      var repLabel = String(nativeRep.getAttribute('aria-label') || '').toLowerCase();
      var repColor = window.getComputedStyle(nativeRep).color;

      var isRepeatOne = repChecked === 'mixed' || repLabel.indexOf('disable repeat') !== -1;
      var isRepeatAll = !isRepeatOne && (repChecked === 'true' || repLabel.indexOf('repeat one') !== -1 || repColor.indexOf('29, 185, 84') !== -1 || repColor.indexOf('30, 215, 96') !== -1);

      btnRep.classList.toggle('state-active', isRepeatAll || isRepeatOne);
      btnRep.classList.toggle('show-badge', isRepeatOne);
    }

    // Like Sync (Exact matching outline vs solid heart)
    var btnLike = document.getElementById('sp-btn-like');
    var likeSvg = document.getElementById('sp-like-svg');
    if (btnLike && likeSvg) {
      var isLiked = getLikeState();
      btnLike.classList.toggle('is-liked', isLiked);
      likeSvg.innerHTML = isLiked
        ? '<path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/>'
        : '<path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>';
    }

    // Timeline Sync
    if (!isUserScrubbing) {
      var rangeInput = document.querySelector('[data-testid="playback-progressbar"] input[type="range"]');
      var fillEl = document.getElementById('sp-scrub-fill');
      var curText = document.getElementById('sp-time-cur');
      var durText = document.getElementById('sp-time-dur');

      var cStr = '';
      var dStr = '';
      var pct = 0;

      if (rangeInput) {
        var vt = rangeInput.getAttribute('aria-valuetext') || '';
        if (vt.indexOf('/') !== -1) {
          var parts = vt.split('/');
          cStr = parts[0].trim();
          dStr = parts[1].trim();
        }
        var curVal = parseFloat(rangeInput.value) || 0;
        var maxVal = parseFloat(rangeInput.max) || 0;
        if (maxVal > 0) {
          pct = Math.min(100, Math.max(0, (curVal / maxVal) * 100));
        }
      }

      if (!cStr) {
        var posEl = document.querySelector('[data-testid="playback-position"]');
        if (posEl) cStr = (posEl.innerText || posEl.textContent || '').trim();
      }
      if (!dStr) {
        var durEl = document.querySelector('[data-testid="playback-duration"]');
        if (durEl) dStr = (durEl.innerText || durEl.textContent || '').trim();
      }

      if (!dStr || dStr === '0:00' || (!cStr && !dStr)) {
        var allM = getAllMedia();
        for (var mi = 0; mi < allM.length; mi++) {
          if (allM[mi].duration && allM[mi].duration > 1) {
            cStr = formatSeconds(allM[mi].currentTime || 0);
            dStr = formatSeconds(allM[mi].duration || 0);
            pct = Math.min(100, Math.max(0, ((allM[mi].currentTime || 0) / allM[mi].duration) * 100));
            break;
          }
        }
      }

      if (pct === 0 && cStr && dStr) {
        var cSec = parseTimeStr(cStr);
        var dSec = parseTimeStr(dStr);
        if (dSec > 0) pct = Math.min(100, Math.max(0, (cSec / dSec) * 100));
      }

      if (cStr && curText) curText.innerText = cStr;
      if (dStr && durText) durText.innerText = dStr;
      if (fillEl) fillEl.style.width = pct + '%';
    }
  }

  setInterval(syncState, 150);

  // --- 9. MOUNT APPLICATION UI ---
  function mountShell() {
    if (document.getElementById('sp-mobile-shell')) return;
    var root = document.body || document.documentElement;
    if (!root) return;

    var eyeIconSvg = '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
    var peekBtn = document.createElement('button');
    peekBtn.id = 'sp-peek-btn';
    peekBtn.innerHTML = eyeIconSvg + '<span>Desktop</span>';
    peekBtn.onclick = function () {
      var shell = document.getElementById('sp-mobile-shell');
      if (!shell) return;
      var hidden = shell.classList.toggle('is-hidden');
      setViewportMode(!hidden);
      peekBtn.innerHTML = hidden ? eyeIconSvg + '<span>Mobile UI</span>' : eyeIconSvg + '<span>Desktop</span>';
    };
    root.appendChild(peekBtn);

    var shell = document.createElement('div');
    shell.id = 'sp-mobile-shell';
    shell.innerHTML =
      '<div class="sp-top-bar">' +
        '<div id="sp-badge" class="sp-speed-pill mode-16x">' +
          '<span class="sp-dot"></span>' +
          '<span id="sp-badge-text">16x Ad Skip</span>' +
        '</div>' +
      '</div>' +

      '<div id="sp-view-player" class="sp-view-panel active-view">' +
        '<div class="sp-art-container">' +
          '<img id="sp-art" class="sp-art-img" src="" alt="" />' +
        '</div>' +
        '<div class="sp-meta-row">' +
          '<div class="sp-meta-text">' +
            '<span id="sp-title" class="sp-track-title">Spotify</span>' +
            '<span id="sp-artist" class="sp-track-artist">Select a song</span>' +
          '</div>' +
          '<button id="sp-btn-like" class="sp-like-btn" title="Save to Liked Songs">' +
            '<svg id="sp-like-svg" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="sp-scrubber-wrap">' +
          '<div id="sp-scrub-zone" class="sp-scrub-touch-area">' +
            '<div id="sp-scrub-rail" class="sp-scrub-track">' +
              '<div id="sp-scrub-fill" class="sp-scrub-fill">' +
                '<div class="sp-scrub-thumb"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="sp-time-labels">' +
            '<span id="sp-time-cur">0:00</span>' +
            '<span id="sp-time-dur">0:00</span>' +
          '</div>' +
        '</div>' +
        '<div class="sp-controls-row">' +
          '<button id="sp-btn-shuf" class="sp-ctrl-btn" title="Shuffle">' +
            '<span id="sp-shuf-badge" class="sp-mode-badge">✦</span>' +
            '<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>' +
          '</button>' +
          '<button id="sp-btn-prev" class="sp-ctrl-btn primary-skip" title="Previous">' +
            '<svg viewBox="0 0 24 24"><path d="M6 6h3v12H6zm3.5 6l8.5 6V6z"/></svg>' +
          '</button>' +
          '<button id="sp-btn-play" class="sp-play-main" title="Play/Pause">' +
            '<svg id="sp-play-svg" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606"></path></svg>' +
          '</button>' +
          '<button id="sp-btn-next" class="sp-ctrl-btn primary-skip" title="Next">' +
            '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h3V6h-3z"/></svg>' +
          '</button>' +
          '<button id="sp-btn-rep" class="sp-ctrl-btn" title="Repeat">' +
            '<span class="sp-mode-badge">1</span>' +
            '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div id="sp-view-search" class="sp-view-panel">' +
        '<div class="sp-section-header"><span>Search</span></div>' +
        '<div class="sp-search-bar">' +
          '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
          '<input id="sp-search-input" class="sp-search-input" type="text" placeholder="What do you want to play?" />' +
        '</div>' +
        '<div id="sp-search-results" class="sp-item-list"></div>' +
      '</div>' +

      '<div id="sp-view-library" class="sp-view-panel">' +
        '<div class="sp-section-header">' +
          '<span>Your Library</span>' +
          '<button id="sp-refresh-lib" class="sp-action-pill">Reload</button>' +
        '</div>' +
        '<div id="sp-library-list" class="sp-item-list"></div>' +
      '</div>' +

      '<div id="sp-view-tracks" class="sp-view-panel">' +
        '<div class="sp-section-header">' +
          '<span>Playlist Tracks</span>' +
          '<button id="sp-refresh-tracks" class="sp-action-pill">Reload</button>' +
        '</div>' +
        '<div id="sp-tracks-list" class="sp-item-list"></div>' +
      '</div>' +

      '<div id="sp-view-queue" class="sp-view-panel">' +
        '<div class="sp-section-header">' +
          '<span>Up Next (Queue)</span>' +
          '<button id="sp-refresh-q" class="sp-action-pill">Reload</button>' +
        '</div>' +
        '<div id="sp-queue-list" class="sp-item-list"></div>' +
      '</div>' +

      '<nav class="sp-bottom-nav">' +
        '<button id="sp-tab-player" class="sp-nav-btn active-tab">' +
          '<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>' +
          '<span>Playing</span>' +
        '</button>' +
        '<button id="sp-tab-search" class="sp-nav-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
          '<span>Search</span>' +
        '</button>' +
        '<button id="sp-tab-library" class="sp-nav-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>' +
          '<span>Library</span>' +
        '</button>' +
        '<button id="sp-tab-tracks" class="sp-nav-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>' +
          '<span>Tracks</span>' +
        '</button>' +
        '<button id="sp-tab-queue" class="sp-nav-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M19 9H2V7h17v2zm0-4H2V3h17v2zm-6 8H2v-2h11v2zm8.5 3.5l-4.5 4.5v-9l4.5 4.5z"/></svg>' +
          '<span>Queue</span>' +
        '</button>' +
      '</nav>';

    root.appendChild(shell);

    document.getElementById('sp-btn-play').onclick = function () {
      robustClick(document.querySelector('[data-testid="control-button-playpause"]'));
      setTimeout(syncState, 60);
    };
    document.getElementById('sp-btn-next').onclick = function () {
      robustClick(document.querySelector('[data-testid="control-button-skip-forward"]'));
      setTimeout(syncState, 60);
    };
    document.getElementById('sp-btn-prev').onclick = function () {
      robustClick(document.querySelector('[data-testid="control-button-skip-back"]'));
      setTimeout(syncState, 60);
    };
    document.getElementById('sp-btn-rep').onclick = function () {
      robustClick(document.querySelector('[data-testid="control-button-repeat"]'));
      setTimeout(syncState, 100);
    };

    document.getElementById('sp-btn-shuf').onclick = function () {
      var nativeShuf = getNativeShuffleButton();
      if (nativeShuf) {
        robustClick(nativeShuf);
        setTimeout(syncState, 100);
        setTimeout(syncState, 350);
      }
    };

    document.getElementById('sp-btn-like').onclick = handleLikeButtonClick;

    document.getElementById('sp-tab-player').onclick = function () { switchTab('player'); };
    document.getElementById('sp-tab-search').onclick = function () { switchTab('search'); };
    document.getElementById('sp-tab-library').onclick = function () { switchTab('library'); };
    document.getElementById('sp-tab-tracks').onclick = function () { switchTab('tracks'); };
    document.getElementById('sp-tab-queue').onclick = function () { switchTab('queue'); };
    document.getElementById('sp-refresh-lib').onclick = refreshLibraryList;
    document.getElementById('sp-refresh-tracks').onclick = refreshTracksList;
    document.getElementById('sp-refresh-q').onclick = refreshQueueList;

    var searchTimer = null;
    var searchInputEl = document.getElementById('sp-search-input');
    searchInputEl.addEventListener('input', function (e) {
      clearTimeout(searchTimer);
      var val = e.target.value;
      searchTimer = setTimeout(function () { executeLiveSearch(val); }, 450);
    });
    searchInputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(searchTimer);
        executeLiveSearch(e.target.value);
        searchInputEl.blur();
      }
    });

    var zone = document.getElementById('sp-scrub-zone');
    var rail = document.getElementById('sp-scrub-rail');
    var fill = document.getElementById('sp-scrub-fill');
    var curLabel = document.getElementById('sp-time-cur');

    function getPointerRatio(e) {
      var rect = rail.getBoundingClientRect();
      var clientX = e.clientX;
      if (clientX === undefined && e.touches && e.touches[0]) clientX = e.touches[0].clientX;
      if (clientX === undefined && e.changedTouches && e.changedTouches[0]) clientX = e.changedTouches[0].clientX;
      clientX = clientX || 0;
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }

    function updateScrubPreview(ratio) {
      if (fill) fill.style.width = (ratio * 100) + '%';
      var totalSec = getTotalDurationSeconds();
      if (totalSec > 0 && curLabel) {
        curLabel.innerText = formatSeconds(totalSec * ratio);
      }
    }

    zone.addEventListener('pointerdown', function (e) {
      isUserScrubbing = true;
      try { zone.setPointerCapture(e.pointerId); } catch (err) {}
      updateScrubPreview(getPointerRatio(e));
    });

    zone.addEventListener('pointermove', function (e) {
      if (!isUserScrubbing) return;
      updateScrubPreview(getPointerRatio(e));
    });

    zone.addEventListener('pointerup', function (e) {
      if (!isUserScrubbing) return;
      var finalRatio = getPointerRatio(e);
      updateScrubPreview(finalRatio);
      executeSeek(finalRatio);
      setTimeout(function () {
        isUserScrubbing = false;
      }, 300);
    });
  }

  var initInterval = setInterval(function () {
    mountShell();
    if (document.getElementById('sp-mobile-shell')) clearInterval(initInterval);
  }, 200);
})();