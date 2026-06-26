export function generateCameraSection() {
  return `
    <section class="camera-section">
      <div class="camera-container">
        <div class="camera-wrapper">
          <video id="media-video" autoplay muted playsinline></video>
          <canvas id="media-canvas" class="hidden"></canvas>
          <div id="camera-overlay" class="camera-overlay">
            <div class="overlay-frame"></div>
            <div class="scan-line"></div>
          </div>
          <div id="camera-placeholder" class="camera-placeholder">
            <div class="placeholder-icon">
              <i data-lucide="camera-off" width="40" height="40"></i>
            </div>
            <p>Ketuk tombol untuk mengaktifkan kamera</p>
          </div>
        </div>

        <div class="camera-controls">
          <button id="btn-toggle" class="capture-btn" title="Mulai/Hentikan Pemindaian" aria-label="Toggle camera scanning">
            <i data-lucide="scan-line" width="26" height="26"></i>
          </button>
        </div>

        <div class="settings-bar">
          <div class="setting-item">
            <i data-lucide="camera" width="15" height="15"></i>
            <select id="camera-select" aria-label="Pilih kamera">
              <option value="default">Kamera Belakang</option>
              <option value="front">Kamera Depan</option>
            </select>
          </div>
          <div class="setting-item fps-setting">
            <i data-lucide="gauge" width="15" height="15"></i>
            <span id="fps-label">30 FPS</span>
            <input type="range" id="fps-slider" min="15" max="60" step="15" value="30" aria-label="Frame per detik" />
          </div>
          <div class="setting-item tone-setting">
            <i data-lucide="mic" width="15" height="15"></i>
            <select id="tone-select" aria-label="Pilih gaya fakta">
              <option value="normal" selected>Normal</option>
              <option value="funny">Lucu 😄</option>
              <option value="professional">Profesional 🎓</option>
              <option value="casual">Santai 😎</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function generateInfoPanel() {
  return `
    <section class="results-section">
      ${generateIdleState()}
      ${generateLoadingState()}
      ${generateResultState()}
    </section>
  `;
}

function generateIdleState() {
  return `
    <div id="state-idle" class="result-card idle-card">
      <div class="idle-icon">
        <i data-lucide="sparkles" width="36" height="36"></i>
      </div>
      <h2>Scan Sayuran</h2>
      <p>Arahkan kamera ke sayuran dan temukan <strong>fakta menarik</strong> yang dihasilkan oleh AI secara instan!</p>
      <div class="feature-tags">
        <span class="feature-tag"><i data-lucide="cpu" width="12" height="12"></i> TensorFlow.js</span>
        <span class="feature-tag"><i data-lucide="brain" width="12" height="12"></i> Transformers.js</span>
        <span class="feature-tag"><i data-lucide="wifi-off" width="12" height="12"></i> Offline PWA</span>
      </div>
    </div>
  `;
}

function generateLoadingState() {
  return `
    <div id="state-loading" class="result-card loading-card hidden">
      <div class="loading-animation">
        <div class="loading-ring"></div>
        <div class="loading-icon">
          <i data-lucide="scan-search" width="22" height="22"></i>
        </div>
      </div>
      <h2>Mencari Sayuran...</h2>
      <p>Arahkan sayuran ke dalam bingkai untuk dideteksi</p>
    </div>
  `;
}

function generateResultState() {
  return `
    <div id="state-result" class="result-card result-main hidden">
      <div class="detected-badge">
        <i data-lucide="check-circle-2" width="14" height="14"></i>
        <span id="detected-name">Sayuran</span>
        <span class="badge-detected">Terdeteksi!</span>
      </div>

      <div class="fun-fact-card">
        <div class="fun-fact-header">
          <div class="fun-fact-icon">
            <i data-lucide="lightbulb" width="22" height="22"></i>
          </div>
          <span class="fun-fact-label">Fakta Menarik</span>
        </div>
        <div id="fun-fact-loading" class="fun-fact-loading hidden">
          <div class="fun-fact-loading-spinner"></div>
          <span>AI sedang menulis fakta unik...</span>
        </div>
        <div id="fun-fact-content">
          <p id="fun-fact-text" class="fun-fact-text">Fakta menarik akan muncul di sini...</p>
          <button id="btn-copy" class="copy-btn" title="Salin fakta" aria-label="Salin teks fakta">
            <i data-lucide="copy" width="16" height="16"></i>
          </button>
        </div>
      </div>

      <div class="confidence-bar">
        <span class="confidence-label">Akurasi</span>
        <div class="confidence-track">
          <div id="confidence-fill" class="confidence-fill" style="width: 0%"></div>
        </div>
        <span id="detected-confidence" class="confidence-value">0%</span>
      </div>

      <div class="share-hint">
        <i data-lucide="share-2" width="13" height="13"></i>
        <span>Salin dan bagikan ke temanmu!</span>
      </div>
    </div>
  `;
}

export function generateFooter() {
  return `
    <footer class="footer">
      <p>⚡ Powered by <strong>TensorFlow.js</strong> &amp; <strong>Transformers.js</strong> &nbsp;|&nbsp; PWA Offline-Ready</p>
    </footer>
  `;
}
