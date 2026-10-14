// ==UserScript==
// @name         Spotify 16x Auto-Skipper & Full Mobile OS
// @namespace    http://tampermonkey.net/
// @version      7.0
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // Clean up any older mounted instances
  document.getElementById('sp-mobile-shell')?.remove();
  document.getElementById('sp-peek-btn')?.remove();
  document.getElementById('sp-mobile-styles')?.remove();

  // --- 1. VIEWPORT & ZOOM LOCK ---
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

  // --- 2. 100% VIEWPORT-RELATIVE (vw/vh) CSS (IMMUNE TO DESKTOP SCALING) ---
  const styleEl = document.createElement('style');
  styleEl.id = 'sp-mobile-styles';
  styleEl.textContent = `
    /* Floating Toggle Button (Always on top so you can see behind the overlay) */
    #sp-peek-btn {
      position: fixed !important;
      top: 2vh !important;
      right: 4vw !important;
      z-index: 2147483647 !important;
      background: rgba(24, 24, 24, 0.9) !important;
      color: #ffffff !important;
      border: 0.4vw solid #1db954 !important;
      border-radius: 50vw !important;
      padding: 1.2vh 3.5vw !important;
      font-size: 3.5vw !important;
      font-weight: 800 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      display: flex !important;
      align-items: center !important;
      gap: 1.5vw !important;
      box-shadow: 0 1vh 3vh rgba(0,0,0,0.8) !important;
      cursor: pointer !important;
      user-select: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    #sp-peek-btn:active {
      transform: scale(0.92) !important;
    }

    /* Main Fullscreen Overlay Shell */
    #sp-mobile-shell {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: linear-gradient(180deg, #1e1e1e 0%, #0a0a0a 45%, #000000 100%) !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      z-index: 2147483646 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
      user-select: none !important;
      overflow: hidden !important;
    }
    #sp-mobile-shell.is-hidden {
      display: none !important;
    }

    /* Top Status Bar */
    .sp-top-bar {
      padding: 2.2vh 5vw 1vh 5vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      flex-shrink: 0 !important;
    }
    .sp-speed-badge {
      font-size: 3.4vw !important;
      font-weight: 900 !important;
      padding: 0.8vh 3.2vw !important;
      border-radius: 50vw !important;
      letter-spacing: 0.05vw !important;
    }
    .sp-speed-badge.mode-16x {
      background: #e91429 !important;
      color: #ffffff !important;
      animation: sp-pulse 0.6s infinite alternate !important;
    }
    .sp-speed-badge.mode-1x {
      background: #1db954 !important;
      color: #000000 !important;
    }
    @keyframes sp-pulse {
      from { opacity: 0.6; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1.03); }
    }

    /* Tab Views Container */
    .sp-view-panel {
      display: none !important;
      flex: 1 !important;
      flex-direction: column !important;
      width: 100vw !important;
      overflow-y: auto !important;
      padding: 1vh 6vw !important;
      box-sizing: border-box !important;
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
    }
    .sp-art-wrap {
      width: 78vw !important;
      height: 78vw !important;
      max-width: 42vh !important;
      max-height: 42vh !important;
      border-radius: 4vw !important;
      overflow: hidden !important;
      box-shadow: 0 2vh 5vh rgba(0,0,0,0.85) !important;
      background: #222 !important;
      flex-shrink: 0 !important;
    }
    .sp-art-img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
    }

    /* Track Info + Like Heart Row */
    .sp-meta-row {
      width: 88vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 4vw !important;
    }
    .sp-meta-text {
      flex: 1 !important;
      overflow: hidden !important;
    }
    .sp-track-title {
      font-size: 6vw !important;
      font-weight: 900 !important;
      color: #ffffff !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }
    .sp-track-artist {
      font-size: 4.2vw !important;
      font-weight: 600 !important;
      color: #b3b3b3 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      margin-top: 0.5vh !important;
    }
    .sp-like-btn {
      background: none !important;
      border: none !important;
      color: #b3b3b3 !important;
      padding: 2vw !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
    }
    .sp-like-btn svg {
      width: 8.5vw !important;
      height: 8.5vw !important;
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
      height: 1.2vh !important;
      background: #404040 !important;
      border-radius: 1vh !important;
      position: relative !important;
    }
    .sp-scrub-fill {
      width: 0% !important;
      height: 100% !important;
      background: #1db954 !important;
      border-radius: 1vh !important;
      position: relative !important;
    }
    .sp-scrub-thumb {
      position: absolute !important;
      right: -2.5vw !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 5vw !important;
      height: 5vw !important;
      background: #ffffff !important;
      border-radius: 50% !important;
      box-shadow: 0 0.4vh 1.2vh rgba(0,0,0,0.9) !important;
    }
    .sp-time-labels {
      display: flex !important;
      justify-content: space-between !important;
      font-size: 3.4vw !important;
      font-weight: 700 !important;
      color: #a7a7a7 !important;
      margin-top: -0.5vh !important;
    }

    /* Primary Transport Controls */
    .sp-controls-row {
      width: 92vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 0.5vh 0 !important;
    }
    .sp-ctrl-btn {
      background: transparent !important;
      border: none !important;
      color: #b3b3b3 !important;
      width: 14vw !important;
      height: 14vw !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
      cursor: pointer !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-ctrl-btn:active {
      transform: scale(0.85) !important;
    }
    .sp-ctrl-btn svg {
      width: 8vw !important;
      height: 8vw !important;
      fill: currentColor !important;
    }
    /* Active green indicator for Shuffle & Repeat */
    .sp-ctrl-btn.state-active {
      color: #1db954 !important;
    }
    .sp-ctrl-btn.state-active::after {
      content: '' !important;
      position: absolute !important;
      bottom: 0.8vw !important;
      width: 1.6vw !important;
      height: 1.6vw !important;
      background: #1db954 !important;
      border-radius: 50% !important;
    }
    /* Repeat-1 Badge */
    .sp-repeat-one-badge {
      position: absolute !important;
      top: 1.2vw !important;
      right: 1.2vw !important;
      background: #1db954 !important;
      color: #000000 !important;
      font-size: 2.6vw !important;
      font-weight: 900 !important;
      width: 4vw !important;
      height: 4vw !important;
      border-radius: 50% !important;
      display: none !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .sp-ctrl-btn.state-repeat-one .sp-repeat-one-badge {
      display: flex !important;
    }

    /* Giant Play/Pause Circle */
    .sp-play-main {
      background: #ffffff !important;
      color: #000000 !important;
      width: 20vw !important;
      height: 20vw !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: none !important;
      box-shadow: 0 1vh 3vh rgba(0,0,0,0.6) !important;
    }
    .sp-play-main:active {
      transform: scale(0.9) !important;
    }
    .sp-play-main svg {
      width: 9.5vw !important;
      height: 9.5vw !important;
      fill: #000000 !important;
    }

    /* --- VIEW 2 & 3: CUSTOM LIBRARY & QUEUE LISTS --- */
    .sp-section-header {
      font-size: 6.5vw !important;
      font-weight: 900 !important;
      margin: 1vh 0 2vh 0 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    .sp-refresh-btn {
      background: #282828 !important;
      color: #fff !important;
      border: none !important;
      padding: 1vh 3.5vw !important;
      border-radius: 50vw !important;
      font-size: 3.4vw !important;
      font-weight: 700 !important;
    }
    .sp-item-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 1.4vh !important;
      padding-bottom: 4vh !important;
    }
    .sp-list-card {
      background: #181818 !important;
      border-radius: 2.5vw !important;
      padding: 1.5vh 3.5vw !important;
      display: flex !important;
      align-items: center !important;
      gap: 3.5vw !important;
      cursor: pointer !important;
    }
    .sp-list-card:active {
      background: #282828 !important;
    }
    .sp-list-img {
      width: 13vw !important;
      height: 13vw !important;
      border-radius: 1.5vw !important;
      object-fit: cover !important;
      background: #333 !important;
      flex-shrink: 0 !important;
    }
    .sp-list-info {
      flex: 1 !important;
      overflow: hidden !important;
    }
    .sp-list-title {
      font-size: 4.2vw !important;
      font-weight: 700 !important;
      color: #fff !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }
    .sp-list-sub {
      font-size: 3.3vw !important;
      color: #a7a7a7 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      margin-top: 0.3vh !important;
    }

    /* Bottom Navigation Bar */
    .sp-bottom-nav {
      height: 9.5vh !important;
      background: #080808 !important;
      border-top: 0.2vh solid #222 !important;
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
      color: #777777 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0.6vh !important;
      font-size: 3.2vw !important;
      font-weight: 700 !important;
      cursor: pointer !important;
    }
    .sp-nav-btn svg {
      width: 6.5vw !important;
      height: 6.5vw !important;
      fill: currentColor !important;
    }
    .sp-nav-btn.active-tab {
      color: #1db954 !important;
    }
  `;
  document.head.appendChild(styleEl);

  // --- 3. CORE MEDIA & 16x DEFAULT AD-SKIPPER ENGINE ---
  // Intercepts all created audio/video tags on the page so we never grab the wrong one
  const trackedMedia = new Set();
  const origCreate = document.createElement;
  document.createElement = function(tag) {
    const el = origCreate.apply(this, arguments);
    if (tag && (tag.toLowerCase() === 'audio' || tag.toLowerCase() === 'video')) {
      el.playbackRate = 16.0;
      el.defaultPlaybackRate = 16.0;
      trackedMedia.add(el);
    }
    return el;
  };

  function getAllMediaElements() {
    document.querySelectorAll('audio, video').forEach(el => trackedMedia.add(el));
    return Array.from(trackedMedia);
  }

  // Positive Song Verification: Default is 16x unless a real song is verified
  function isVerifiedSongPlaying() {
    // 1. Check for any ad indicators in the DOM
    const adUi = document.querySelector('[data-testid="ad-info"], [aria-label*="Advertisement"], [data-testid="context-item-info-ad-subtitle"]');
    if (adUi) return false;

    // 2. Check MediaSession metadata
    if (navigator.mediaSession?.metadata) {
      const title = (navigator.mediaSession.metadata.title || '').toLowerCase();
      const artist = (navigator.mediaSession.metadata.artist || '').toLowerCase();
      if (!title || title.includes('advertisement') || title === 'spotify' || artist === 'spotify') {
        return false;
      }
    }

    // 3. Verify that the now-playing widget has a genuine track/album href link
    const trackLink = document.querySelector('[data-testid="context-item-link"], [data-testid="nowplaying-track-link"]');
    if (!trackLink) return false;
    const href = trackLink.getAttribute('href') || '';
    if (!href.includes('/track/') && !href.includes('/album/') && !href.includes('/playlist/') && !href.includes('/episode/')) {
      return false;
    }

    return true;
  }

  // --- 4. TIMELINE SEEKING ENGINE ---
  let isUserScrubbing = false;

  function parseTimeStr(str) {
    if (!str) return 0;
    const parts = str.trim().split(':').map(Number);
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

  function seekToRatio(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));

    // Method A: Simulate full mouse + pointer drag sequence on Spotify's desktop progress bar
    const bar = document.querySelector('[data-testid="playback-progressbar"]');
    if (bar) {
      const target = bar.querySelector('.bg-line, [data-testid="progress-bar"], div') || bar;
      const rect = target.getBoundingClientRect();
      if (rect.width > 0) {
        const clientX = rect.left + rect.width * clamped;
        const clientY = rect.top + rect.height / 2;
        const opts = { bubbles: true, cancelable: true, view: window, clientX, clientY, button: 0, buttons: 1 };

        target.dispatchEvent(new PointerEvent('pointerdown', opts));
        target.dispatchEvent(new MouseEvent('mousedown', opts));
        document.dispatchEvent(new PointerEvent('pointermove', opts));
        document.dispatchEvent(new MouseEvent('mousemove', opts));
        target.dispatchEvent(new PointerEvent('pointerup', opts));
        target.dispatchEvent(new MouseEvent('mouseup', opts));
        target.dispatchEvent(new MouseEvent('click', opts));
      }

      // Method B: Range input native value setter
      const rangeInput = bar.querySelector('input[type="range"]');
      if (rangeInput) {
        const min = parseFloat(rangeInput.min || 0);
        const max = parseFloat(rangeInput.max || 100);
        const val = min + (max - min) * clamped;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
          setter.call(rangeInput, val);
          rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
          rangeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    // Method C: Direct media element seek
    getAllMediaElements().forEach(media => {
      if (media.duration && media.duration > 5) {
        try { media.currentTime = media.duration * clamped; } catch (e) {}
      }
    });
  }

  // --- 5. SCRAPERS FOR LIBRARY & QUEUE ---
  function refreshLibraryList() {
    const container = document.getElementById('sp-library-list');
    if (!container) return;

    // Scrape playlists/artists from Spotify's left library sidebar
    const items = document.querySelectorAll('[data-testid="rootlist-item"], [role="listitem"], [data-encore-id="listRow"]');
    if (!items.length) {
      container.innerHTML = `<div style="color:#888;font-size:4vw;text-align:center;padding:4vh;">No library items found yet. Make sure you are logged in!</div>`;
      return;
    }

    container.innerHTML = '';
    items.forEach((item, idx) => {
      const titleEl = item.querySelector('[data-encore-id="text"], p, span');
      const imgEl = item.querySelector('img');
      const title = titleEl ? titleEl.innerText.split('\n')[0] : `Playlist #${idx + 1}`;
      const sub = item.innerText.split('\n')[1] || 'Library Item';
      const imgSrc = imgEl ? imgEl.src : '';

      const card = document.createElement('div');
      card.className = 'sp-list-card';
      card.innerHTML = `
        <img class="sp-list-img" src="${imgSrc}" alt="" />
        <div class="sp-list-info">
          <span class="sp-list-title">${title}</span>
          <span class="sp-list-sub">${sub}</span>
        </div>
      `;
      card.onclick = () => {
        const clickTarget = item.querySelector('[role="button"], a') || item;
        clickTarget.click();
        // Switch back to Player view or let user pick song
        const playBtn = item.querySelector('[data-testid="play-button"]');
        if (playBtn) playBtn.click();
      };
      container.appendChild(card);
    });
  }

  function refreshQueueList() {
    const container = document.getElementById('sp-queue-list');
    if (!container) return;

    // Ensure Spotify's desktop Queue drawer or visible track rows are scraped
    const rows = document.querySelectorAll('[data-testid="tracklist-row"]');
    if (!rows.length) {
      // Try clicking Spotify's Queue button to open the queue panel in the background
      const qBtn = document.querySelector('[data-testid="control-button-queue"]');
      if (qBtn) qBtn.click();
      setTimeout(() => {
        const retryRows = document.querySelectorAll('[data-testid="tracklist-row"]');
        renderTrackRows(retryRows, container);
      }, 400);
      return;
    }
    renderTrackRows(rows, container);
  }

  function renderTrackRows(rows, container) {
    if (!rows.length) {
      container.innerHTML = `<div style="color:#888;font-size:4vw;text-align:center;padding:4vh;">No tracks visible in current queue/playlist view.</div>`;
      return;
    }
    container.innerHTML = '';
    rows.forEach((row, i) => {
      const titleEl = row.querySelector('[data-testid="internal-track-link"] div, [dir="auto"]');
      const artistEl = row.querySelector('span a, [data-encore-id="text"]');
      const imgEl = row.querySelector('img');
      const title = titleEl ? titleEl.innerText : `Track ${i + 1}`;
      const artist = artistEl ? artistEl.innerText : '';
      const img = imgEl ? imgEl.src : '';

      const card = document.createElement('div');
      card.className = 'sp-list-card';
      card.innerHTML = `
        <img class="sp-list-img" src="${img}" alt="" />
        <div class="sp-list-info">
          <span class="sp-list-title">${title}</span>
          <span class="sp-list-sub">${artist}</span>
        </div>
      `;
      card.onclick = () => {
        const playBtn = row.querySelector('[data-testid="play-button"]') || row;
        playBtn.click();
        // Also dispatch double-click on the row (Spotify desktop plays row on dblclick)
        row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        switchTab('player');
      };
      container.appendChild(card);
    });
  }

  function switchTab(tabName) {
    document.querySelectorAll('.sp-view-panel').forEach(p => p.classList.remove('active-view'));
    document.querySelectorAll('.sp-nav-btn').forEach(b => b.classList.remove('active-tab'));

    if (tabName === 'player') {
      document.getElementById('sp-view-player')?.classList.add('active-view');
      document.getElementById('sp-tab-player')?.classList.add('active-tab');
    } else if (tabName === 'library') {
      document.getElementById('sp-view-library')?.classList.add('active-view');
      document.getElementById('sp-tab-library')?.classList.add('active-tab');
      refreshLibraryList();
    } else if (tabName === 'queue') {
      document.getElementById('sp-view-queue')?.classList.add('active-view');
      document.getElementById('sp-tab-queue')?.classList.add('active-tab');
      refreshQueueList();
    }
  }

  // --- 6. STATE SYNCHRONIZATION LOOP ---
  function syncUI() {
    // 1. Default 16x Speed Logic
    const songVerified = isVerifiedSongPlaying();
    const targetSpeed = songVerified ? 1.0 : 16.0;

    getAllMediaElements().forEach(media => {
      if (media.playbackRate !== targetSpeed) {
        media.playbackRate = targetSpeed;
        media.defaultPlaybackRate = targetSpeed;
      }
      // Mute ads while fast-forwarding at 16x so there's no high-pitched squeak
      if (!songVerified && !media.muted) {
        media.muted = true;
      } else if (songVerified && media.muted) {
        media.muted = false;
      }
    });

    const badge = document.getElementById('sp-badge');
    if (badge) {
      badge.innerText = songVerified ? '1x SONG DETECTED' : '16x FAST-FORWARD (DEFAULT)';
      badge.className = songVerified ? 'sp-speed-badge mode-1x' : 'sp-speed-badge mode-16x';
    }

    // 2. Metadata (Title, Artist, Artwork)
    const titleEl = document.getElementById('sp-title');
    const artistEl = document.getElementById('sp-artist');
    const artEl = document.getElementById('sp-art');

    const domTitle = document.querySelector('[data-testid="context-item-link"]')?.innerText;
    const domArtist = document.querySelector('[data-testid="context-item-info-subtitles"]')?.innerText;
    const domArt = document.querySelector('[data-testid="cover-art-image"]')?.src;

    if (navigator.mediaSession?.metadata) {
      const meta = navigator.mediaSession.metadata;
      if (titleEl) titleEl.innerText = meta.title || domTitle || 'Not Playing';
      if (artistEl) artistEl.innerText = meta.artist || domArtist || 'Spotify';
      if (artEl && meta.artwork?.length) {
        artEl.src = meta.artwork[meta.artwork.length - 1].src;
      } else if (artEl && domArt) {
        artEl.src = domArt;
      }
    } else {
      if (titleEl && domTitle) titleEl.innerText = domTitle;
      if (artistEl && domArtist) artistEl.innerText = domArtist;
      if (artEl && domArt) artEl.src = domArt;
    }

    // 3. Play/Pause Button State
    const nativePlay = document.querySelector('[data-testid="control-button-playpause"]');
    const playSvg = document.getElementById('sp-play-svg');
    if (nativePlay && playSvg) {
      const label = (nativePlay.getAttribute('aria-label') || '').toLowerCase();
      const isPlaying = label.includes('pause');
      playSvg.innerHTML = isPlaying
        ? '<rect x="6" y="4" width="4.5" height="16" rx="1"></rect><rect x="13.5" y="4" width="4.5" height="16" rx="1"></rect>'
        : '<polygon points="6 4 20 12 6 20 6 4"></polygon>';
    }

    // 4. Shuffle Indicator (Off vs Active Green)
    const nativeShuf = document.querySelector('[data-testid="control-button-shuffle"]');
    const btnShuf = document.getElementById('sp-btn-shuf');
    if (nativeShuf && btnShuf) {
      const ariaChecked = nativeShuf.getAttribute('aria-checked') === 'true';
      const ariaLabel = (nativeShuf.getAttribute('aria-label') || '').toLowerCase();
      const isShufOn = ariaChecked || ariaLabel.includes('disable shuffle');
      btnShuf.classList.toggle('state-active', isShufOn);
    }

    // 5. Repeat 3-State Indicator (Off -> Repeat All [Green] -> Repeat One [Green + '1'])
    const nativeRep = document.querySelector('[data-testid="control-button-repeat"]');
    const btnRep = document.getElementById('sp-btn-rep');
    if (nativeRep && btnRep) {
      const ariaChecked = nativeRep.getAttribute('aria-checked');
      const ariaLabel = (nativeRep.getAttribute('aria-label') || '').toLowerCase();

      // State 3: Repeat One (aria-checked="mixed" or label says "disable repeat")
      const isRepeatOne = ariaChecked === 'mixed' || ariaLabel.includes('disable repeat');
      // State 2: Repeat Context/All (aria-checked="true" or label says "enable repeat one")
      const isRepeatAll = !isRepeatOne && (ariaChecked === 'true' || ariaLabel.includes('repeat one'));

      btnRep.classList.toggle('state-active', isRepeatAll || isRepeatOne);
      btnRep.classList.toggle('state-repeat-one', isRepeatOne);
    }

    // 6. Like / Heart Button State
    const nativeLike = document.querySelector('footer [data-testid="add-button"], [data-testid="now-playing-bar"] [data-testid="add-button"]');
    const btnLike = document.getElementById('sp-btn-like');
    if (nativeLike && btnLike) {
      const isSaved = nativeLike.getAttribute('aria-checked') === 'true' ||
                      (nativeLike.getAttribute('aria-label') || '').toLowerCase().includes('remove') ||
                      (nativeLike.getAttribute('aria-label') || '').toLowerCase().includes('saved');
      btnLike.classList.toggle('is-liked', isSaved);
    }

    // 7. Timeline Position & Duration
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

  setInterval(syncUI, 150);

  // --- 7. BUILD & MOUNT UI ---
  function clickNative(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      setTimeout(syncUI, 50);
    }
  }

  function mountApp() {
    if (document.getElementById('sp-mobile-shell')) return;
    const root = document.body || document.documentElement;
    if (!root) return;

    // 1. Floating Peek Button (Toggle Overlay On/Off)
    const peekBtn = document.createElement('button');
    peekBtn.id = 'sp-peek-btn';
    peekBtn.innerHTML = '👁️ Hide UI';
    peekBtn.onclick = () => {
      const shell = document.getElementById('sp-mobile-shell');
      if (!shell) return;
      const hidden = shell.classList.toggle('is-hidden');
      peekBtn.innerHTML = hidden ? '📱 Show UI' : '👁️ Hide UI';
    };
    root.appendChild(peekBtn);

    // 2. Main Mobile Shell
    const shell = document.createElement('div');
    shell.id = 'sp-mobile-shell';
    shell.innerHTML = `
      <!-- Top Bar -->
      <div class="sp-top-bar">
        <span id="sp-badge" class="sp-speed-badge mode-16x">16x DEFAULT</span>
      </div>

      <!-- TAB 1: NOW PLAYING -->
      <div id="sp-view-player" class="sp-view-panel active-view">
        <div class="sp-art-wrap">
          <img id="sp-art" class="sp-art-img" src="" alt="" />
        </div>

        <div class="sp-meta-row">
          <div class="sp-meta-text">
            <span id="sp-title" class="sp-track-title">Waiting for song...</span>
            <span id="sp-artist" class="sp-track-artist">Spotify</span>
          </div>
          <button id="sp-btn-like" class="sp-like-btn" title="Like Song">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>

        <!-- Draggable Timeline -->
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
            <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button id="sp-btn-prev" class="sp-ctrl-btn" title="Previous">
            <svg viewBox="0 0 24 24"><path d="M6 6h3v12H6zm4 6l10 7V5z"/></svg>
          </button>
          <button id="sp-btn-play" class="sp-play-main" title="Play/Pause">
            <svg id="sp-play-svg" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
          </button>
          <button id="sp-btn-next" class="sp-ctrl-btn" title="Next">
            <svg viewBox="0 0 24 24"><path d="M4 19l10-7L4 5v14zm11-14h3v14h-3z"/></svg>
          </button>
          <button id="sp-btn-rep" class="sp-ctrl-btn" title="Repeat">
            <span class="sp-repeat-one-badge">1</span>
            <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
          </button>
        </div>
      </div>

      <!-- TAB 2: CUSTOM LIBRARY -->
      <div id="sp-view-library" class="sp-view-panel">
        <div class="sp-section-header">
          <span>Your Library</span>
          <button id="sp-refresh-lib" class="sp-refresh-btn">↻ Refresh</button>
        </div>
        <div id="sp-library-list" class="sp-item-list"></div>
      </div>

      <!-- TAB 3: CUSTOM QUEUE / TRACKS -->
      <div id="sp-view-queue" class="sp-view-panel">
        <div class="sp-section-header">
          <span>Queue & Tracks</span>
          <button id="sp-refresh-q" class="sp-refresh-btn">↻ Refresh</button>
        </div>
        <div id="sp-queue-list" class="sp-item-list"></div>
      </div>

      <!-- Bottom Tab Navigation -->
      <nav class="sp-bottom-nav">
        <button id="sp-tab-player" class="sp-nav-btn active-tab">
          <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          <span>Player</span>
        </button>
        <button id="sp-tab-library" class="sp-nav-btn">
          <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
          <span>Library</span>
        </button>
        <button id="sp-tab-queue" class="sp-nav-btn">
          <svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
          <span>Queue</span>
        </button>
      </nav>
    `;

    root.appendChild(shell);

    // Wire Player Controls
    document.getElementById('sp-btn-play').onclick = () => clickNative('[data-testid="control-button-playpause"]');
    document.getElementById('sp-btn-next').onclick = () => clickNative('[data-testid="control-button-skip-forward"]');
    document.getElementById('sp-btn-prev').onclick = () => clickNative('[data-testid="control-button-skip-back"]');
    document.getElementById('sp-btn-shuf').onclick = () => clickNative('[data-testid="control-button-shuffle"]');
    document.getElementById('sp-btn-rep').onclick = () => clickNative('[data-testid="control-button-repeat"]');
    document.getElementById('sp-btn-like').onclick = () => clickNative('footer [data-testid="add-button"], [data-testid="now-playing-bar"] [data-testid="add-button"]');

    // Wire Tabs
    document.getElementById('sp-tab-player').onclick = () => switchTab('player');
    document.getElementById('sp-tab-library').onclick = () => switchTab('library');
    document.getElementById('sp-tab-queue').onclick = () => switchTab('queue');
    document.getElementById('sp-refresh-lib').onclick = refreshLibraryList;
    document.getElementById('sp-refresh-q').onclick = refreshQueueList;

    // Wire Timeline Dragging
    const zone = document.getElementById('sp-scrub-zone');
    const rail = document.getElementById('sp-scrub-rail');
    const fill = document.getElementById('sp-scrub-fill');
    const curLabel = document.getElementById('sp-time-cur');
    const durLabel = document.getElementById('sp-time-dur');

    function getTouchRatio(e) {
      const rect = rail.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }

    function previewScrub(ratio) {
      fill.style.width = `${ratio * 100}%`;
      const totalSec = parseTimeStr(durLabel.innerText);
      if (totalSec > 0) {
        curLabel.innerText = formatSeconds(totalSec * ratio);
      }
    }

    zone.addEventListener('pointerdown', (e) => {
      isUserScrubbing = true;
      zone.setPointerCapture(e.pointerId);
      previewScrub(getTouchRatio(e));
    });

    zone.addEventListener('pointermove', (e) => {
      if (!isUserScrubbing) return;
      previewScrub(getTouchRatio(e));
    });

    zone.addEventListener('pointerup', (e) => {
      if (!isUserScrubbing) return;
      const finalRatio = getTouchRatio(e);
      previewScrub(finalRatio);
      seekToRatio(finalRatio);
      setTimeout(() => { isUserScrubbing = false; }, 250);
    });
  }

  const bootLoop = setInterval(() => {
    mountApp();
    if (document.getElementById('sp-mobile-shell')) clearInterval(bootLoop);
  }, 200);
})();