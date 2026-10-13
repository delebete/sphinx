// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Mobile HUD
// @namespace    http://tampermonkey.net/
// @version      1.0
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. EMBEDDED STYLES ---
  const css = `
    #custom-spotify-hud {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100vw;
      background: rgba(18, 18, 18, 0.96);
      backdrop-filter: blur(12px);
      border-top: 1px solid #282828;
      padding: 12px 16px 24px;
      z-index: 999999999;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #ffffff;
    }
    .hud-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
    }
    #hud-track-title {
      max-width: 65%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
    }
    .badge-song {
      background: #1db954;
      color: #000;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 10px;
    }
    .badge-ad {
      background: #ff4444;
      color: #fff;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 10px;
    }
    .hud-scrubber {
      width: 100%;
      height: 6px;
      background: #404040;
      border-radius: 3px;
      cursor: pointer;
      margin-bottom: 12px;
      position: relative;
    }
    #hud-progress-fill {
      width: 0%;
      height: 100%;
      background: #1db954;
      border-radius: 3px;
      transition: width 0.1s linear;
    }
    .hud-controls {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
    .hud-controls button {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hud-play-btn {
      background: #1db954 !important;
      color: #000 !important;
      width: 44px;
      height: 44px;
      font-size: 18px !important;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // --- 2. FAST-FORWARD & LOGIC ---
  let activeMedia = null;
  function getMedia() {
    const el = document.querySelector('audio, video');
    if (el && el !== activeMedia) activeMedia = el;
    return activeMedia;
  }

  function isAd() {
    if (navigator.mediaSession?.metadata) {
      const title = navigator.mediaSession.metadata.title?.toLowerCase() || '';
      const artist = navigator.mediaSession.metadata.artist?.toLowerCase() || '';
      if (title.includes('advertisement') || artist.includes('spotify')) return true;
    }
    const hasTrackLink = document.querySelector('[data-testid="context-item-link"], [data-testid="nowplaying-track-link"]');
    return !hasTrackLink;
  }

  function tick() {
    const media = getMedia();
    if (!media) return;

    const adPlaying = isAd();
    const speed = adPlaying ? 16.0 : 1.0;

    if (media.playbackRate !== speed) {
      media.playbackRate = speed;
      media.defaultPlaybackRate = speed;
    }

    const badge = document.getElementById('hud-mode-badge');
    const title = document.getElementById('hud-track-title');
    const bar = document.getElementById('hud-progress-fill');

    if (badge) {
      badge.innerText = adPlaying ? '16x FF (AD)' : '1x SONG';
      badge.className = adPlaying ? 'badge-ad' : 'badge-song';
    }
    if (title && navigator.mediaSession?.metadata) {
      title.innerText = `${navigator.mediaSession.metadata.title} - ${navigator.mediaSession.metadata.artist}`;
    }
    if (bar && media.duration) {
      bar.style.width = `${(media.currentTime / media.duration) * 100}%`;
    }
  }
  setInterval(tick, 250);

  // --- 3. DOM CONTROLS & HUD ---
  function trigger(testId) {
    const btn = document.querySelector(`[data-testid="${testId}"]`);
    if (btn) btn.click();
  }

  function mountHUD() {
    if (document.getElementById('custom-spotify-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'custom-spotify-hud';
    hud.innerHTML = `
      <div class="hud-top">
        <span id="hud-track-title">Connecting...</span>
        <span id="hud-mode-badge" class="badge-song">1x SONG</span>
      </div>
      <div class="hud-scrubber" id="hud-scrubber">
        <div id="hud-progress-fill"></div>
      </div>
      <div class="hud-controls">
        <button id="hud-shuffle">🔀</button>
        <button id="hud-prev">⏮️</button>
        <button id="hud-play" class="hud-play-btn">⏯️</button>
        <button id="hud-next">⏭️</button>
        <button id="hud-repeat">🔁</button>
      </div>
    `;
    document.body.appendChild(hud);

    document.getElementById('hud-play').onclick = () => trigger('control-button-playpause');
    document.getElementById('hud-next').onclick = () => trigger('control-button-skip-forward');
    document.getElementById('hud-prev').onclick = () => trigger('control-button-skip-back');
    document.getElementById('hud-shuffle').onclick = () => trigger('control-button-shuffle');
    document.getElementById('hud-repeat').onclick = () => trigger('control-button-repeat');

    const scrubber = document.getElementById('hud-scrubber');
    scrubber.onclick = (e) => {
      const rect = scrubber.getBoundingClientRect();
      const media = getMedia();
      if (media && media.duration) {
        media.currentTime = media.duration * ((e.clientX - rect.left) / rect.width);
      }
    };
  }

  window.addEventListener('load', mountHUD);
  setTimeout(mountHUD, 2000);
})();