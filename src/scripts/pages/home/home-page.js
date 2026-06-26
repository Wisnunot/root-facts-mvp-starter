import {
  generateCameraSection,
  generateInfoPanel,
  generateFooter,
} from "../../templates.js";
import CameraService from "../../services/camera.service.js";
import DetectionService from "../../services/detection.service.js";
import RootFactsService from "../../services/rootfacts.service.js";
import HomePresenter from "./home-presenter.js";

export default class HomePage {
  #presenter = null;

  async render() {
    return `
      <div class="main-content">
        ${generateCameraSection()}
        ${generateInfoPanel()}
      </div>
      ${generateFooter()}
    `;
  }

  async afterRender() {
    // Initialize lucide icons for the newly rendered content
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    const cameraService = new CameraService();
    const detectionService = new DetectionService();
    const rootFactsService = new RootFactsService();
    
    this.#presenter = new HomePresenter(this, cameraService, detectionService, rootFactsService);
    
    this._bindEvents();
    
    // Asynchronously initialize the models and cameras
    await this.#presenter.initialize();
  }

  bindPresenter(presenter) {
    this.#presenter = presenter;
  }

  _bindEvents() {
    const btnToggle = document.getElementById("btn-toggle");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        this.#presenter.handleToggleCamera();
      });
    }

    const cameraSelect = document.getElementById("camera-select");
    if (cameraSelect) {
      cameraSelect.addEventListener("change", () => {
        if (this.#presenter.isScanning) {
          this.#presenter.startScanning();
        }
      });
    }

    const fpsSlider = document.getElementById("fps-slider");
    if (fpsSlider) {
      fpsSlider.addEventListener("input", (e) => {
        this.#presenter.handleFPSChange(e.target.value);
      });
    }

    const toneSelect = document.getElementById("tone-select");
    if (toneSelect) {
      toneSelect.addEventListener("change", (e) => {
        this.#presenter.handleToneChange(e.target.value);
      });
    }

    const btnCopy = document.getElementById("btn-copy");
    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        this.#presenter.handleCopyFacts();
      });
    }
  }

  updateStatus(text, isActive) {
    const statusText = document.getElementById("status-text");
    const statusDot = document.getElementById("status-dot");
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      if (isActive) {
        statusDot.classList.add("active");
      } else {
        statusDot.classList.remove("active");
      }
    }
  }

  getCameraSelectElement() {
    return document.getElementById("camera-select");
  }

  getSelectedCamera() {
    const select = document.getElementById("camera-select");
    return select ? select.value : "default";
  }

  getFPSValue() {
    const slider = document.getElementById("fps-slider");
    return slider ? slider.value : 30;
  }

  getSelectedTone() {
    const select = document.getElementById("tone-select");
    return select ? select.value : "normal";
  }

  updateFPSLabel(fps) {
    const label = document.getElementById("fps-label");
    if (label) label.textContent = `${fps} FPS`;
  }

  updateDetectionUI(label, confidence) {
    const name = document.getElementById("detected-name");
    const confValue = document.getElementById("detected-confidence");
    const fill = document.getElementById("confidence-fill");

    if (name) name.textContent = label;
    if (confValue) confValue.textContent = `${Math.round(confidence)}%`;
    if (fill) fill.style.width = `${confidence}%`;
  }

  showScanningState() {
    const placeholder = document.getElementById("camera-placeholder");
    const overlay = document.getElementById("camera-overlay");
    const btnToggle = document.getElementById("btn-toggle");

    if (placeholder) placeholder.classList.add("hidden");
    if (overlay) overlay.classList.add("active");
    if (btnToggle) {
      btnToggle.classList.add("scanning");
      btnToggle.innerHTML = '<i data-lucide="square" width="24" height="24"></i>';
      if (typeof lucide !== "undefined") lucide.createIcons();
    }

    this.showSearchingIndicator();
  }

  showIdleState() {
    const placeholder = document.getElementById("camera-placeholder");
    const overlay = document.getElementById("camera-overlay");
    const btnToggle = document.getElementById("btn-toggle");

    if (placeholder) placeholder.classList.remove("hidden");
    if (overlay) overlay.classList.remove("active");
    if (btnToggle) {
      btnToggle.classList.remove("scanning");
      btnToggle.innerHTML = '<i data-lucide="scan-line" width="24" height="24"></i>';
      if (typeof lucide !== "undefined") lucide.createIcons();
    }

    const stateIdle = document.getElementById("state-idle");
    const stateLoading = document.getElementById("state-loading");
    const stateResult = document.getElementById("state-result");

    if (stateIdle) stateIdle.classList.remove("hidden");
    if (stateLoading) stateLoading.classList.add("hidden");
    if (stateResult) stateResult.classList.add("hidden");

    const factText = document.getElementById("fun-fact-text");
    if (factText) factText.textContent = "Fakta menarik akan muncul di sini...";
  }

  showResultState() {
    const stateIdle = document.getElementById("state-idle");
    const stateLoading = document.getElementById("state-loading");
    const stateResult = document.getElementById("state-result");

    if (stateIdle) stateIdle.classList.add("hidden");
    if (stateLoading) stateLoading.classList.add("hidden");
    if (stateResult) stateResult.classList.remove("hidden");
  }

  showSearchingIndicator() {
    const stateIdle = document.getElementById("state-idle");
    const stateLoading = document.getElementById("state-loading");
    const stateResult = document.getElementById("state-result");

    if (stateIdle) stateIdle.classList.add("hidden");
    if (stateLoading) stateLoading.classList.remove("hidden");
    if (stateResult) stateResult.classList.add("hidden");
  }

  showFunFactLoading() {
    const loading = document.getElementById("fun-fact-loading");
    const content = document.getElementById("fun-fact-content");

    if (loading) loading.classList.remove("hidden");
    if (content) content.classList.add("hidden");
  }

  showFunFactText(text) {
    const loading = document.getElementById("fun-fact-loading");
    const content = document.getElementById("fun-fact-content");
    const factText = document.getElementById("fun-fact-text");

    if (loading) loading.classList.add("hidden");
    if (content) content.classList.remove("hidden");
    if (factText) {
      factText.textContent = text;
      factText.classList.add("fadeIn");
      setTimeout(() => factText.classList.remove("fadeIn"), 500);
    }

    // Re-initialize lucide icons in copy button
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  getFunFactText() {
    const content = document.getElementById("fun-fact-text");
    return content ? content.textContent : "";
  }

  setCopyStatus(copied) {
    const btnCopy = document.getElementById("btn-copy");
    if (btnCopy) {
      if (copied) {
        btnCopy.classList.add("copied");
        btnCopy.innerHTML = '<i data-lucide="check" width="18" height="18"></i>';
      } else {
        btnCopy.classList.remove("copied");
        btnCopy.innerHTML = '<i data-lucide="copy" width="18" height="18"></i>';
      }
      if (typeof lucide !== "undefined") lucide.createIcons();
    }
  }
}
