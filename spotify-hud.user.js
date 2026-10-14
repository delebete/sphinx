// ==UserScript==
// @name         Spotify 16x Auto-Skipper & Native Mobile OS
// @namespace    http://tampermonkey.net/
// @version      8.0
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function () {
  'use strict';

  // Cleanup any previous instances
  document.getElementById('sp-mobile-shell')?.remove();
  document.getElementById('sp-peek-btn')?.remove();
  document.getElementById('sp-mobile-styles')?.remove();

  // --- 1. HARD ZOOM LOCK (VIEWPORT + MULTI-TOUCH INTERCEPTOR) ---
  function enforceNoZoom() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }
  enforceNoZoom();

  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // --- 2. NATIVE SPOTIFY MOBILE STYLING (VW/VH SCALED, ZERO EMOJIS) ---
  const styleEl = document.createElement('style');
  styleEl.id = 'sp-mobile-styles';
  styleEl.textContent = `
    * {
      box-sizing: border-box !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    /* Floating Overlay Toggle Button (Top Right) */
    #sp-peek-btn {
      position: fixed !important;
      top: 1.8vh !important;
      right: 4vw !important;
      z-index: 2147483647 !important;
      background: rgba(18, 18, 18, 0.92) !important;
      backdrop-filter: blur(12px) !important;
      color: #ffffff !important;
      border: 0.3vw solid rgba(255, 255, 255, 0.18) !important;
      border-radius: 50vw !important;
      padding: 1vh 3.4vw !important;
      font-size: 3.1vw !important;
      font-weight: 700 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      display: flex !important;
      align-items: center !important;
      gap: 1.5vw !important;
      box-shadow: 0 0.8vh 2.4vh rgba(0,0,0,0.7) !important;
      cursor: pointer !important;
      user-select: none !important;
    }
    #sp-peek-btn svg {
      width: 4.2vw !important;
      height: 4.2vw !important;
      fill: #1db954 !important;
    }
    #sp-peek-btn:active {
      transform: scale(0.94) !important;
    }

    /* Fullscreen Spotify Mobile Shell */
    #sp-mobile-shell {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: linear-gradient(180deg, #222222 0%, #121212 42%, #000000 100%) !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      z-index: 2147483646 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      user-select: none !important;
      overflow: hidden !important;
       transition: background 0.5s ease !important;
    }
    #sp-mobile-shell.is-hidden {
      display: none !important;
    }

    /* Top Header Bar */
    .sp-top-bar {
      padding: 2vh 5vw 1vh 5vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      flex-shrink: 0 !important;
      height: 7vh !important;
    }
    .sp-speed-pill {
      font-size: 2.9vw !important;
      font-weight: 800 !important;
      padding: 0.7vh 2.8vw !important;
      border-radius: 50vw !important;
      letter-spacing: 0.06vw !important;
      text-transform: uppercase !important;
      display: flex !important;
      align-items: center !important;
      gap: 1.4vw !important;
    }
    .sp-speed-pill .sp-dot {
      width: 1.8vw !important;
      height: 1.8vw !important;
      border-radius: 50% !important;
    }
    .sp-speed-pill.mode-16x {
      background: rgba(233, 20, 41, 0.2) !important;
      color: #ff4d5e !important;
      border: 0.25vw solid #e91429 !important;
    }
    .sp-speed-pill.mode-16x .sp-dot {
      background: #ff4d5e !important;
    }
    .sp-speed-pill.mode-1x {
      background: rgba(29, 185, 84, 0.16) !important;
      color: #1db954 !important;
      border: 0.25vw solid rgba(29, 185, 84, 0.4) !important;
    }
    .sp-speed-pill.mode-1x .sp-dot {
      background: #1db954 !important;
    }

    /* View Panels */
    .sp-view-panel {
      display: none !important;
      flex: 1 !important;
      flex-direction: column !important;
      width: 100vw !important;
      overflow-y: auto !important;
      padding: 1vh 6vw !important;
      min-height: 0 !important;
    }
    .sp-view-panel.active-view {
      display: flex !important;
    }

    /* --- VIEW 1: NOW PLAYING --- */
    #sp-view-player {
      justify-content: space-evenly !important;
      align-items: center !important;
      overflow: hidden !important;
      padding: 0.5vh 6vw 1.5vh 6vw !important;
    }
    .sp-art-container {
      width: 82vw !important;
      height: 82vw !important;
      max-width: 43vh !important;
      max-height: 43vh !important;
      border-radius: 3vw !important;
      overflow: hidden !important;
      box-shadow: 0 2vh 5vh rgba(0,0,0,0.85) !important;
      background: #181818 !important;
      flex-shrink: 0 !important;
    }
    .sp-art-img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      display: block !important;
    }

    /* Track Info + Like Row */
    .sp-meta-row {
      width: 88vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 3vw !important;
      margin-top: 0.5vh !important;
    }
    .sp-meta-text {
      flex: 1 !important;
      overflow: hidden !important;
    }
    .sp-track-title {
      font-size: 5.6vw !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      letter-spacing: -0.05vw !important;
    }
    .sp-track-artist {
      font-size: 4vw !important;
      font-weight: 500 !important;
      color: #b3b3b3 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      margin-top: 0.4vh !important;
    }
    .sp-like-btn {
      background: none !important;
      border: none !important;
      color: #b3b3b3 !important;
      padding: 2vw !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: transform 0.12s ease, color 0.15s ease !important;
    }
    .sp-like-btn:active {
      transform: scale(0.82) !important;
    }
    .sp-like-btn svg {
      width: 7.5vw !important;
      height: 7.5vw !important;
      fill: currentColor !important;
    }
    .sp-like-btn.is-liked {
      color: #1db954 !important;
    }

    /* Timeline Scrubber */
    .sp-scrubber-wrap {
      width: 88vw !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .sp-scrub-touch-area {
      width: 100% !important;
      padding: 2.2vh 0 !important;
      cursor: pointer !important;
      touch-action: none !important;
    }
    .sp-scrub-track {
      width: 100% !important;
      height: 0.9vh !important;
      background: rgba(255, 255, 255, 0.22) !important;
      border-radius: 1vh !important;
      position: relative !important;
    }
    .sp-scrub-fill {
      width: 0% !important;
      height: 100% !important;
      background: #ffffff !important;
      border-radius: 1vh !important;
      position: relative !important;
    }
    .sp-scrub-touch-area:active .sp-scrub-fill {
      background: #1db954 !important;
    }
    .sp-scrub-thumb {
      position: absolute !important;
      right: -2.2vw !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 4.4vw !important;
      height: 4.4vw !important;
      background: #ffffff !important;
      border-radius: 50% !important;
      box-shadow: 0 0.3vh 1vh rgba(0,0,0,0.8) !important;
    }
    .sp-time-labels {
      display: flex !important;
      justify-content: space-between !important;
      font-size: 3.1vw !important;
      font-weight: 600 !important;
      color: #a7a7a7 !important;
      margin-top: -0.6vh !important;
    }

    /* Main Playback Controls */
    .sp-controls-row {
      width: 88vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    .sp-ctrl-btn {
      background: transparent !important;
      border: none !important;
      color: #b3b3b3 !important;
      width: 13vw !important;
      height: 13vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
      cursor: pointer !important;
    }
    .sp-ctrl-btn.primary-skip {
      color: #ffffff !important;
    }
    .sp-ctrl-btn:active {
      transform: scale(0.85) !important;
    }
    .sp-ctrl-btn svg {
      width: 7.5vw !important;
      height: 7.5vw !important;
      fill: currentColor !important;
    }
    .sp-ctrl-btn.primary-skip svg {
      width: 8.8vw !important;
      height: 8.8vw !important;
    }

    /* Active State Indicators for Shuffle & Repeat */
    .sp-ctrl-btn.state-active {
      color: #1db954 !important;
    }
    .sp-ctrl-btn.state-active::after {
      content: '' !important;
      position: absolute !important;
      bottom: 0.6vw !important;
      width: 1.4vw !important;
      height: 1.4vw !important;
      background: #1db954 !important;
      border-radius: 50% !important;
    }

    /* Repeat-1 & Smart Shuffle Badges */
    .sp-mode-badge {
      position: absolute !important;
      top: 0.8vw !important;
      right: 0.6vw !important;
      background: #1db954 !important;
      color: #000000 !important;
      font-size: 2.3vw !important;
      font-weight: 900 !important;
      min-width: 3.8vw !important;
      height: 3.8vw !important;
      padding: 0 0.6vw !important;
      border-radius: 50vw !important;
      display: none !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
    }
    .sp-ctrl-btn.show-badge .sp-mode-badge {
      display: flex !important;
    }

    /* Center Play/Pause Button */
    .sp-play-main {
      background: #ffffff !important;
      color: #000000 !important;
      width: 18.5vw !important;
      height: 18.5vw !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: none !important;
      box-shadow: 0 0.8vh 2.5vh rgba(0,0,0,0.5) !important;
      cursor: pointer !important;
    }
    .sp-play-main:active {
      transform: scale(0.92) !important;
    }
    .sp-play-main svg {
      width: 8.5vw !important;
      height: 8.5vw !important;
      fill: #000000 !important;
    }

    /* --- LIST VIEWS (SEARCH, LIBRARY, QUEUE) --- */
    .sp-section-header {
      font-size: 6vw !important;
      font-weight: 800 !important;
      margin: 1vh 0 1.8vh 0 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }
    .sp-action-pill {
      background: #282828 !important;
      color: #ffffff !important;
      border: none !important;
      padding: 1vh 3.5vw !important;
      border-radius: 50vw !important;
      font-size: 3.2vw !important;
      font-weight: 700 !important;
      display: flex !important;
      align-items: center !important;
      gap: 1.5vw !important;
      cursor: pointer !important;
    }
    .sp-action-pill:active {
      background: #3e3e3e !important;
    }

    /* Search Input Box */
    .sp-search-bar {
      width: 100% !important;
      background: #ffffff !important;
      border-radius: 2vw !important;
      padding: 1.4vh 3.5vw !important;
      display: flex !important;
      align-items: center !important;
      gap: 2.5vw !important;
      margin-bottom: 2vh !important;
      flex-shrink: 0 !important;
    }
    .sp-search-bar svg {
      width: 5.5vw !important;
      height: 5.5vw !important;
      fill: #121212 !important;
      flex-shrink: 0 !important;
    }
    .sp-search-input {
      border: none !important;
      outline: none !important;
      background: transparent !important;
      color: #000000 !important;
      font-size: 4vw !important;
      font-weight: 600 !important;
      width: 100% !important;
    }

    .sp-item-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 1.2vh !important;
      padding-bottom: 4vh !important;
      overflow-y: auto !important;
    }
    .sp-list-card {
      background: rgba(255, 255, 255, 0.05) !important;
      border-radius: 2vw !important;
      padding: 1.2vh 3vw !important;
      display: flex !important;
      align-items: center !important;
      gap: 3.5vw !important;
      cursor: pointer !important;
    }
    .sp-list-card:active {
      background: rgba(255, 255, 255, 0.14) !important;
    }
    .sp-list-img {
      width: 13vw !important;
      height: 13vw !important;
      border-radius: 1.2vw !important;
      object-fit: cover !important;
      background: #282828 !important;
      flex-shrink: 0 !important;
    }
    .sp-list-info {
      flex: 1 !important;
      overflow: hidden !important;
    }
    .sp-list-title {
      font-size: 4vw !important;
      font-weight: 700 !important;
      color: #ffffff !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }
    .sp-list-title.is-playing {
      color: #1db954 !important;
    }
    .sp-list-sub {
      font-size: 3.2vw !important;
      color: #a7a7a7 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      margin-top: 0.3vh !important;
    }
    .sp-card-play-btn {
      width: 10vw !important;
      height: 10vw !important;
      border-radius: 50% !important;
      background: #1db954 !important;
      color: #000000 !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    .sp-card-play-btn svg {
      width: 4.8vw !important;
      height: 4.8vw !important;
      fill: #000000 !important;
    }

    /* Bottom 4-Tab Navigation Bar */
    .sp-bottom-nav {
      height: 9vh !important;
      background: #000000 !important;
      border-top: 0.15vh solid rgba(255, 255, 255, 0.1) !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      flex-shrink: 0 !important;
      padding-bottom: env(safe-area-inset-bottom, 0px) !important;
    }
    .sp-nav-btn {
      flex: 1 !important;
      height: 100% !important;
      background: none !important;
      border: none !important;
      color: #b3b3b3 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0.6vh !important;
      font-size: 2.9vw !important;
      font-weight: 600 !important;
      cursor: pointer !important;
    }
    .sp-nav-btn svg {
      width: 6vw !important;
      height: 6vw !important;
      fill: currentColor !important;
    }
    .sp-nav-btn.active-tab {
      color: #ffffff !important;
    }
  `;
  document.head.appendChild(styleEl);

  // --- 3. 16x DEFAULT SPEED & MEDIA HOOK ENGINE ---
  const trackedMedia = new Set();
  const origCreateElement = document.createElement;
  document.createElement = function (tag) {
    const el = origCreateElement.apply(this, arguments);
    if (tag && (tag.toLowerCase() === 'audio' || tag.toLowerCase() === 'video')) {
      el.playbackRate = 16.0;
      el.defaultPlaybackRate = 16.0;
      trackedMedia.add(el);
    }
    return el;
  };

  // Capture MediaSession Seek Handler if Spotify registers it
  let spotifySeekHandler = null;
  if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
    const origSetHandler = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
    navigator.mediaSession.setActionHandler = function (action, handler) {
      if (action === 'seekto' && typeof handler === 'function') {
        spotifySeekHandler = handler;
      }
      return origSetHandler(action, handler);
    };
  }

  function getAllMedia() {
    document.querySelectorAll('audio, video').forEach((el) => trackedMedia.add(el));
    return Array.from(trackedMedia);
  }

  function isRealSongPlaying() {
    const adNodes = document.querySelector(
      '[data-testid="ad-info"], [aria-label*="Advertisement"], [data-testid="context-item-info-ad-subtitle"]'
    );
    if (adNodes) return false;

    if (navigator.mediaSession?.metadata) {
      const t = (navigator.mediaSession.metadata.title || '').toLowerCase();
      const a = (navigator.mediaSession.metadata.artist || '').toLowerCase();
      if (!t || t.includes('advertisement') || t === 'spotify' || a === 'spotify') return false;
    }

    const trackLink = document.querySelector(
      '[data-testid="context-item-link"], [data-testid="nowplaying-track-link"]'
    );
    if (!trackLink) return false;
    const href = trackLink.getAttribute('href') || '';
    if (!href.includes('/track/') && !href.includes('/album/') && !href.includes('/playlist/') && !href.includes('/episode/')) {
      return false;
    }
    return true;
  }

  // Upgrade any Spotify image URL to 640x640 HD resolution
  function upgradeToHDArt(url) {
    if (!url) return '';
    return url
      .replace('ab67616d00004851', 'ab67616d0000b273')
      .replace('ab67616d00001e02', 'ab67616d0000b273');
  }

  // --- 4. BULLETPROOF TIMELINE SEEKING (REACT PROPS + MEDIASESSION + DOM) ---
  let isUserScrubbing = false;

  function parseTimeStr(str) {
    if (!str) return 0;
    const clean = str.replace('-', '').trim();
    const parts = clean.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  }

  function formatSeconds(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function getTotalDurationSeconds() {
    const durEl = document.querySelector('[data-testid="playback-duration"]');
    if (durEl) {
      const val = parseTimeStr(durEl.innerText);
      if (val > 0) return val;
    }
    const bar = document.querySelector('[data-testid="playback-progressbar"] input[type="range"]');
    if (bar && bar.max) {
      const maxVal = parseFloat(bar.max);
      return maxVal > 1000 ? maxVal / 1000 : maxVal;
    }
    return 0;
  }

  function executeSeek(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const totalSec = getTotalDurationSeconds();
    const targetSec = totalSec * clamped;
    const targetMs = Math.floor(targetSec * 1000);

    // 1. Try MediaSession 'seekto' handler
    if (spotifySeekHandler && totalSec > 0) {
      try {
        spotifySeekHandler({ seekTime: targetSec });
      } catch (e) {}
    }

    // 2. React Internal Fiber Prop Trigger on Spotify's ProgressBar & Range Input
    const pbContainer = document.querySelector('[data-testid="playback-progressbar"]');
    if (pbContainer) {
      const allNodes = [pbContainer, ...pbContainer.querySelectorAll('*')];
      for (const node of allNodes) {
        const reactKey = Object.keys(node).find((k) => k.startsWith('__reactProps$') \vert{}\vert{} k.startsWith('__reactFiber$'));
        if (reactKey) {
          const props = node[reactKey]?.memoizedProps || node[reactKey];
          if (props) {
            // If component takes a direct value change or mouse/pointer handler
            if (typeof props.onChange === 'function') {
              try {
                const max = props.max || totalSec * 1000 || 100;
                props.onChange({ target: { value: max * clamped }, currentTarget: { value: max * clamped } });
              } catch (e) {}
            }
            if (typeof props.onSeek === 'function') {
              try { props.onSeek(targetMs); } catch (e) {}
            }
          }
        }
      }

      // 3. Simulated Pointer + Mouse Drag on the visible track rail
      const railNode = pbContainer.querySelector('[data-testid="progress-bar"]') || pbContainer;
      const rect = railNode.getBoundingClientRect();
      if (rect.width > 0) {
        const clientX = rect.left + rect.width * clamped;
        const clientY = rect.top + rect.height / 2;
        const evOpts = {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
          clientX,
          clientY,
          screenX: clientX,
          screenY: clientY,
          button: 0,
          buttons: 1,
          pointerId: 1,
          isPrimary: true
        };
        railNode.dispatchEvent(new PointerEvent('pointerdown', evOpts));
        railNode.dispatchEvent(new MouseEvent('mousedown', evOpts));
        window.dispatchEvent(new PointerEvent('pointermove', evOpts));
        window.dispatchEvent(new MouseEvent('mousemove', evOpts));
        window.dispatchEvent(new PointerEvent('pointerup', evOpts));
        window.dispatchEvent(new MouseEvent('mouseup', evOpts));
      }
    }

    // 4. Direct HTML5 Audio Element Fallback
    getAllMedia().forEach((media) => {
      if (media.duration && media.duration > 10) {
        try {
          media.currentTime = media.duration * clamped;
        } catch (e) {}
      } else if (totalSec > 0) {
        try {
          media.currentTime = targetSec;
        } catch (e) {}
      }
    });
  }

  // --- 5. ACCURATE LIBRARY, QUEUE & SEARCH SCRAPERS ---
  function triggerReactClick(el) {
    if (!el) return;
    const key = Object.keys(el).find((k) => k.startsWith('__reactProps$'));
    if (key && typeof el[key]?.onClick === 'function') {
      try {
        el[key].onClick({ preventDefault: () => {}, stopPropagation: () => {}, target: el, currentTarget: el });
        return;
      } catch (e) {}
    }
    el.click();
  }

  function refreshLibraryList() {
    const container = document.getElementById('sp-library-list');
    if (!container) return;

    const rows = document.querySelectorAll(
      '[data-testid="rootlist-item"], #sp-left-sidebar [role="listitem"], [aria-label="Your Library"] [role="listitem"], [data-encore-id="listRow"]'
    );

    if (!rows.length) {
      container.innerHTML = `<div style="color:#a7a7a7;font-size:3.8vw;text-align:center;padding:5vh 2vw;">No playlists detected yet. Tap Refresh in a moment.</div>`;
      return;
    }

    container.innerHTML = '';
    rows.forEach((row) => {
      // Extract clean Title & Subtitle from aria-label or text nodes
      let title = '';
      let sub = '';

      const titleIdEl = row.querySelector('[id^="listrow-title-"]');
      const subIdEl = row.querySelector('[id^="listrow-subtitle-"]');

      if (titleIdEl) {
        title = titleIdEl.innerText.trim();
        sub = subIdEl ? subIdEl.innerText.trim() : 'Playlist';
      } else {
        const lines = (row.innerText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.toLowerCase() !== 'pinned');
        title = lines[0] || 'Playlist';
        sub = lines.slice(1).join(' • ') || 'Library';
      }

      const imgEl = row.querySelector('img');
      const imgSrc = upgradeToHDArt(imgEl ? imgEl.src : '');

      const card = document.createElement('div');
      card.className = 'sp-list-card';
      card.innerHTML = `
        <img class="sp-list-img" src="${imgSrc}" alt="" />
        <div class="sp-list-info">
          <span class="sp-list-title">${title}</span>
          <span class="sp-list-sub">${sub}</span>
        </div>
        <button class="sp-card-play-btn" title="Play Playlist">
          <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
        </button>
      `;

      // Clicking the row opens the playlist tracks inside the Queue/Tracks tab
      card.addEventListener('click', (e) => {
        if (e.target.closest('.sp-card-play-btn')) return;
        const clickTarget = row.querySelector('a, [role="button"], [id^="listrow-title-"]') || row;
        triggerReactClick(clickTarget);
        setTimeout(() => {
          switchTab('queue');
        }, 550);
      });

      // Clicking the green Play button starts playing that playlist immediately
      const playBtn = card.querySelector('.sp-card-play-btn');
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        setTimeout(() => {
          const nativePlay = row.querySelector('[data-testid="play-button"], button[aria-label*="Play"]');
          if (nativePlay) {
            triggerReactClick(nativePlay);
          } else {
            const clickTarget = row.querySelector('a, [role="button"]') || row;
            triggerReactClick(clickTarget);
            setTimeout(() => {
              const headerPlay = document.querySelector('[data-testid="action-bar-row"] [data-testid="play-button"]');
              if (headerPlay) triggerReactClick(headerPlay);
            }, 600);
          }
          switchTab('player');
        }, 120);
      });

      container.appendChild(card);
    });
  }

  function extractTrackRowData(row, index) {
    // 1. Song Title
    const titleNode =
      row.querySelector('[data-testid="internal-track-link"] div') ||
      row.querySelector('[data-testid="internal-track-link"]') ||
      row.querySelector('div[dir="auto"]');
    const title = titleNode ? titleNode.innerText.trim() : `Track ${index + 1}`;

    // 2. Artist Name (Explicitly search for artist anchor links or subtitle spans)
    const artistNodes = Array.from(row.querySelectorAll('a[href*="/artist/"]'));
    let artist = '';
    if (artistNodes.length > 0) {
      artist = artistNodes.map((a) => a.innerText.trim()).filter(Boolean).join(', ');
    } else {
      const allText = (row.innerText || '')
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t && t !== title && !/^\d+$/.test(t) && !/^\d+:\d+$/.test(t) && t !== 'E');
      artist = allText[0] || 'Spotify Artist';
    }

    const imgEl = row.querySelector('img');
    const imgSrc = upgradeToHDArt(imgEl ? imgEl.src : '');

    return { title, artist, imgSrc };
  }

  function renderTracksIntoContainer(rows, container) {
    if (!rows || !rows.length) {
      container.innerHTML = `<div style="color:#a7a7a7;font-size:3.8vw;text-align:center;padding:5vh 2vw;">No tracks found in current view. Select a playlist in Library first!</div>`;
      return;
    }

    container.innerHTML = '';
    rows.forEach((row, i) => {
      const { title, artist, imgSrc } = extractTrackRowData(row, i);

      const card = document.createElement('div');
      card.className = 'sp-list-card';
      card.innerHTML = `
        <img class="sp-list-img" src="${imgSrc}" alt="" />
        <div class="sp-list-info">
          <span class="sp-list-title">${title}</span>
          <span class="sp-list-sub">${artist}</span>
        </div>
      `;

      card.onclick = () => {
        row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        const playBtn = row.querySelector('[data-testid="play-button"], button[aria-label*="Play"]');
        if (playBtn) {
          triggerReactClick(playBtn);
        } else {
          row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
        }
        switchTab('player');
      };

      container.appendChild(card);
    });
  }

  function refreshQueueList() {
    const container = document.getElementById('sp-queue-list');
    if (!container) return;

    const rows = document.querySelectorAll('[data-testid="tracklist-row"]');
    if (!rows.length) {
      const qBtn = document.querySelector('[data-testid="control-button-queue"]');
      if (qBtn) qBtn.click();
      setTimeout(() => {
        renderTracksIntoContainer(document.querySelectorAll('[data-testid="tracklist-row"]'), container);
      }, 450);
      return;
    }
    renderTracksIntoContainer(rows, container);
  }

  function executeLiveSearch(query) {
    const resultsContainer = document.getElementById('sp-search-results');
    if (!query || !query.trim()) return;

    resultsContainer.innerHTML = `<div style="color:#a7a7a7;font-size:3.8vw;text-align:center;padding:4vh;">Searching Spotify for "${query}"...</div>`;

    // Navigate or type into Spotify's desktop search input
    const searchInput = document.querySelector('[data-testid="search-input"], input[placeholder*="What do you want to play"], input[type="search"]');
    if (searchInput) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(searchInput, query);
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setTimeout(() => {
        renderTracksIntoContainer(document.querySelectorAll('[data-testid="tracklist-row"]'), resultsContainer);
      }, 900);
    } else {
      window.history.pushState({}, '', `/search/${encodeURIComponent(query)}/tracks`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setTimeout(() => {
        renderTracksIntoContainer(document.querySelectorAll('[data-testid="tracklist-row"]'), resultsContainer);
      }, 1200);
    }
  }

  function switchTab(tabName) {
    document.querySelectorAll('.sp-view-panel').forEach((p) => p.classList.remove('active-view'));
    document.querySelectorAll('.sp-nav-btn').forEach((b) => b.classList.remove('active-tab'));

    document.getElementById(`sp-view-${tabName}`)?.classList.add('active-view');
    document.getElementById(`sp-tab-${tabName}`)?.classList.add('active-tab');

    if (tabName === 'library') refreshLibraryList();
    if (tabName === 'queue') refreshQueueList();
  }

  // --- 6. CONTINUOUS SYNC LOOP (SPEED, HD ART, SHUFFLE, REPEAT, LIKE, TIMELINE) ---
  function syncState() {
    // 1. Default 16x Ad-Skipper Engine
    const isSong = isRealSongPlaying();
    const targetRate = isSong ? 1.0 : 16.0;

    getAllMedia().forEach((media) => {
      if (media.playbackRate !== targetRate) {
        media.playbackRate = targetRate;
        media.defaultPlaybackRate = targetRate;
      }
      if (!isSong && !media.muted) {
        media.muted = true;
      } else if (isSong && media.muted) {
        media.muted = false;
      }
    });

    const badge = document.getElementById('sp-badge');
    const badgeText = document.getElementById('sp-badge-text');
    if (badge && badgeText) {
      badgeText.innerText = isSong ? '1x Song' : '16x Ad Skip';
      badge.className = isSong ? 'sp-speed-pill mode-1x' : 'sp-speed-pill mode-16x';
    }

    // 2. Metadata & 640x640 HD Notification Artwork Upgrade
    const titleEl = document.getElementById('sp-title');
    const artistEl = document.getElementById('sp-artist');
    const artEl = document.getElementById('sp-art');

    const domTitle = document.querySelector('[data-testid="context-item-link"]')?.innerText;
    const domArtist = document.querySelector('[data-testid="context-item-info-subtitles"]')?.innerText;
    const domArtEl = document.querySelector('[data-testid="cover-art-image"]');
    const hdArtUrl = upgradeToHDArt(domArtEl?.src || navigator.mediaSession?.metadata?.artwork?.[0]?.src || '');

    if (titleEl) titleEl.innerText = domTitle || navigator.mediaSession?.metadata?.title || 'Ready to Play';
    if (artistEl) artistEl.innerText = domArtist || navigator.mediaSession?.metadata?.artist || 'Spotify';
    if (artEl && hdArtUrl && artEl.src !== hdArtUrl) {
      artEl.src = hdArtUrl;
    }

    // Force High-Res 640x640 Artwork into Android/iOS Media Notifications
    if (navigator.mediaSession && navigator.mediaSession.metadata && hdArtUrl) {
      const curArt = navigator.mediaSession.metadata.artwork?.[0]?.src || '';
      if (!curArt.includes('0000b273')) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: domTitle || navigator.mediaSession.metadata.title,
            artist: domArtist || navigator.mediaSession.metadata.artist,
            album: navigator.mediaSession.metadata.album || '',
            artwork: [
              { src: hdArtUrl, sizes: '640x640', type: 'image/jpeg' }
            ]
          });
        } catch (e) {}
      }
    }

    // 3. Play/Pause SVG Sync
    const nativePlay = document.querySelector('[data-testid="control-button-playpause"]');
    const playSvg = document.getElementById('sp-play-svg');
    if (nativePlay && playSvg) {
      const label = (nativePlay.getAttribute('aria-label') || '').toLowerCase();
      const isPlaying = label.includes('pause');
      playSvg.innerHTML = isPlaying
        ? '<path d="M5.7 3a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7H5.7zm10 0a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7h-2.6z"></path>'
        : '<path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>';
    }

    // 4. Shuffle & Smart Shuffle 3-State Detection
    const nativeShuf = document.querySelector('[data-testid="control-button-shuffle"]');
    const btnShuf = document.getElementById('sp-btn-shuf');
    if (nativeShuf && btnShuf) {
      const checked = nativeShuf.getAttribute('aria-checked');
      const label = (nativeShuf.getAttribute('aria-label') || '').toLowerCase();
      const color = window.getComputedStyle(nativeShuf).color;

      const isSmart =
        label.includes('smart shuffle') && !label.includes('enable smart shuffle') ||
        checked === 'mixed';
      const isShufActive =
        checked === 'true' ||
        checked === 'mixed' ||
        label.includes('disable') ||
        color.includes('29, 185, 84') ||
        color.includes('30, 215, 96');

      btnShuf.classList.toggle('state-active', isShufActive);
      btnShuf.classList.toggle('show-badge', isSmart);
    }

    // 5. Repeat 3-State Detection (Off -> Repeat All -> Repeat One)
    const nativeRep = document.querySelector('[data-testid="control-button-repeat"]');
    const btnRep = document.getElementById('sp-btn-rep');
    if (nativeRep && btnRep) {
      const checked = nativeRep.getAttribute('aria-checked');
      const label = (nativeRep.getAttribute('aria-label') || '').toLowerCase();
      const color = window.getComputedStyle(nativeRep).color;

      const isRepeatOne = checked === 'mixed' || label.includes('disable repeat');
      const isRepeatAll =
        !isRepeatOne &&
        (checked === 'true' ||
          label.includes('repeat one') ||
          color.includes('29, 185, 84') ||
          color.includes('30, 215, 96'));

      btnRep.classList.toggle('state-active', isRepeatAll || isRepeatOne);
      btnRep.classList.toggle('show-badge', isRepeatOne);
    }

    // 6. Accurate Like / Saved Indicator
    const nativeLike = document.querySelector(
      '[data-testid="now-playing-bar"] [data-testid="add-button"], footer [data-testid="add-button"], [data-testid="now-playing-widget"] button[aria-label*="Library"], [data-testid="now-playing-widget"] button[aria-label*="Liked"]'
    );
    const btnLike = document.getElementById('sp-btn-like');
    const likeSvg = document.getElementById('sp-like-svg');
    if (nativeLike && btnLike && likeSvg) {
      const checked = nativeLike.getAttribute('aria-checked') === 'true';
      const label = (nativeLike.getAttribute('aria-label') || '').toLowerCase();
      const color = window.getComputedStyle(nativeLike).color;
      const isLiked =
        checked ||
        label.includes('remove') ||
        label.includes('saved') ||
        color.includes('29, 185, 84') ||
        color.includes('30, 215, 96');

      btnLike.classList.toggle('is-liked', isLiked);
      likeSvg.innerHTML = isLiked
        ? '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>'
        : '<path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>';
    }

    // 7. Timeline Progress Sync
    if (!isUserScrubbing) {
      const posEl = document.querySelector('[data-testid="playback-position"]');
      const durEl = document.querySelector('[data-testid="playback-duration"]');
      const fillEl = document.getElementById('sp-scrub-fill');
      const curText = document.getElementById('sp-time-cur');
      const durText = document.getElementById('sp-time-dur');

      if (posEl && durEl) {
        const cSec = parseTimeStr(posEl.innerText);
        const dSec = parseTimeStr(durEl.innerText);
        if (curText) curText.innerText = posEl.innerText;
        if (durText) durText.innerText = durEl.innerText;
        if (fillEl && dSec > 0) {
          fillEl.style.width = `${Math.min(100, (cSec / dSec) * 100)}%`;
        }
      }
    }
  }

  setInterval(syncState, 150);

  // --- 7. MOUNT APPLICATION UI ---
  function clickNative(selector) {
    const el = document.querySelector(selector);
    if (el) {
      triggerReactClick(el);
      setTimeout(syncState, 60);
    }
  }

  function mountShell() {
    if (document.getElementById('sp-mobile-shell')) return;
    const root = document.body || document.documentElement;
    if (!root) return;

    // 1. Floating Hide/Show Overlay Toggle (SVG Eye Icon, No Emojis)
    const eyeIconSvg = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    const peekBtn = document.createElement('button');
    peekBtn.id = 'sp-peek-btn';
    peekBtn.innerHTML = `${eyeIconSvg}<span>Desktop</span>`;
    peekBtn.onclick = () => {
      const shell = document.getElementById('sp-mobile-shell');
      if (!shell) return;
      const hidden = shell.classList.toggle('is-hidden');
      peekBtn.innerHTML = hidden ? `${eyeIconSvg}<span>Mobile UI</span>` : `${eyeIconSvg}<span>Desktop</span>`;
    };
    root.appendChild(peekBtn);

    // 2. Main Shell
    const shell = document.createElement('div');
    shell.id = 'sp-mobile-shell';
    shell.innerHTML = `
      <!-- Top Status Header -->
      <div class="sp-top-bar">
        <div id="sp-badge" class="sp-speed-pill mode-16x">
          <span class="sp-dot"></span>
          <span id="sp-badge-text">16x Ad Skip</span>
        </div>
      </div>

      <!-- TAB 1: NOW PLAYING -->
      <div id="sp-view-player" class="sp-view-panel active-view">
        <div class="sp-art-container">
          <img id="sp-art" class="sp-art-img" src="" alt="" />
        </div>

        <div class="sp-meta-row">
          <div class="sp-meta-text">
            <span id="sp-title" class="sp-track-title">Spotify</span>
            <span id="sp-artist" class="sp-track-artist">Select a song</span>
          </div>
          <button id="sp-btn-like" class="sp-like-btn" title="Save to Liked Songs">
            <svg id="sp-like-svg" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>
          </button>
        </div>

        <!-- Scrubber -->
        <div class="sp-scrubber-wrap">
          <div id="sp-scrub-zone" class="sp-scrub-touch-area">
            <div id="sp-scrub-rail" class="sp-scrub-track">
              <div id="sp-scrub-fill" class="sp-scrub-fill">
                <div class="sp-scrub-thumb"></div>
              </div>
            </div>
          </div>
          <div class="sp-time-labels">
            <span id="sp-time-cur">0:00</span>
            <span id="sp-time-dur">0:00</span>
          </div>
        </div>

        <!-- Transport Controls -->
        <div class="sp-controls-row">
          <button id="sp-btn-shuf" class="sp-ctrl-btn" title="Shuffle">
            <span class="sp-mode-badge">✦</span>
            <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button id="sp-btn-prev" class="sp-ctrl-btn primary-skip" title="Previous">
            <svg viewBox="0 0 24 24"><path d="M6 6h3v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button id="sp-btn-play" class="sp-play-main" title="Play/Pause">
            <svg id="sp-play-svg" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path></svg>
          </button>
          <button id="sp-btn-next" class="sp-ctrl-btn primary-skip" title="Next">
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h3V6h-3z"/></svg>
          </button>
          <button id="sp-btn-rep" class="sp-ctrl-btn" title="Repeat">
            <span class="sp-mode-badge">1</span>
            <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
          </button>
        </div>
      </div>

      <!-- TAB 2: SEARCH -->
      <div id="sp-view-search" class="sp-view-panel">
        <div class="sp-section-header">
          <span>Search</span>
        </div>
        <div class="sp-search-bar">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input id="sp-search-input" class="sp-search-input" type="text" placeholder="What do you want to listen to?" />
        </div>
        <div id="sp-search-results" class="sp-item-list"></div>
      </div>

      <!-- TAB 3: LIBRARY -->
      <div id="sp-view-library" class="sp-view-panel">
        <div class="sp-section-header">
          <span>Your Library</span>
          <button id="sp-refresh-lib" class="sp-action-pill">Reload</button>
        </div>
        <div id="sp-library-list" class="sp-item-list"></div>
      </div>

      <!-- TAB 4: QUEUE / PLAYLIST TRACKS -->
      <div id="sp-view-queue" class="sp-view-panel">
        <div class="sp-section-header">
          <span>Tracks & Queue</span>
          <button id="sp-refresh-q" class="sp-action-pill">Reload</button>
        </div>
        <div id="sp-queue-list" class="sp-item-list"></div>
      </div>

      <!-- Bottom Navigation Bar -->
      <nav class="sp-bottom-nav">
        <button id="sp-tab-player" class="sp-nav-btn active-tab">
          <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          <span>Playing</span>
        </button>
        <button id="sp-tab-search" class="sp-nav-btn">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span>Search</span>
        </button>
        <button id="sp-tab-library" class="sp-nav-btn">
          <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
          <span>Library</span>
        </button>
        <button id="sp-tab-queue" class="sp-nav-btn">
          <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
          <span>Tracks</span>
        </button>
      </nav>
    `;

    root.appendChild(shell);

    // Wire Transport Buttons
    document.getElementById('sp-btn-play').onclick = () => clickNative('[data-testid="control-button-playpause"]');
    document.getElementById('sp-btn-next').onclick = () => clickNative('[data-testid="control-button-skip-forward"]');
    document.getElementById('sp-btn-prev').onclick = () => clickNative('[data-testid="control-button-skip-back"]');
    document.getElementById('sp-btn-shuf').onclick = () => clickNative('[data-testid="control-button-shuffle"]');
    document.getElementById('sp-btn-rep').onclick = () => clickNative('[data-testid="control-button-repeat"]');
    document.getElementById('sp-btn-like').onclick = () =>
      clickNative(
        '[data-testid="now-playing-bar"] [data-testid="add-button"], footer [data-testid="add-button"], [data-testid="now-playing-widget"] button[aria-label*="Library"], [data-testid="now-playing-widget"] button[aria-label*="Liked"]'
      );

    // Wire Bottom Tabs
    document.getElementById('sp-tab-player').onclick = () => switchTab('player');
    document.getElementById('sp-tab-search').onclick = () => switchTab('search');
    document.getElementById('sp-tab-library').onclick = () => switchTab('library');
    document.getElementById('sp-tab-queue').onclick = () => switchTab('queue');
    document.getElementById('sp-refresh-lib').onclick = refreshLibraryList;
    document.getElementById('sp-refresh-q').onclick = refreshQueueList;

    // Wire Search Input
    let searchTimer = null;
    const searchInputEl = document.getElementById('sp-search-input');
    searchInputEl.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => executeLiveSearch(e.target.value), 500);
    });
    searchInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(searchTimer);
        executeLiveSearch(e.target.value);
        searchInputEl.blur();
      }
    });

    // Wire Timeline Scrubber
    const zone = document.getElementById('sp-scrub-zone');
    const rail = document.getElementById('sp-scrub-rail');
    const fill = document.getElementById('sp-scrub-fill');
    const curLabel = document.getElementById('sp-time-cur');

    function getPointerRatio(e) {
      const rect = rail.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }

    function updateScrubPreview(ratio) {
      fill.style.width = `${ratio * 100}%`;
      const totalSec = getTotalDurationSeconds();
      if (totalSec > 0) {
        curLabel.innerText = formatSeconds(totalSec * ratio);
      }
    }

    zone.addEventListener('pointerdown', (e) => {
      isUserScrubbing = true;
      zone.setPointerCapture(e.pointerId);
      updateScrubPreview(getPointerRatio(e));
    });

    zone.addEventListener('pointermove', (e) => {
      if (!isUserScrubbing) return;
      updateScrubPreview(getPointerRatio(e));
    });

    zone.addEventListener('pointerup', (e) => {
      if (!isUserScrubbing) return;
      const finalRatio = getPointerRatio(e);
      updateScrubPreview(finalRatio);
      executeSeek(finalRatio);
      setTimeout(() => {
        isUserScrubbing = false;
      }, 300);
    });
  }

  const initInterval = setInterval(() => {
    mountShell();
    if (document.getElementById('sp-mobile-shell')) clearInterval(initInterval);
  }, 200);
})();