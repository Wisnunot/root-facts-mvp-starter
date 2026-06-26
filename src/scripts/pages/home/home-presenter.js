export default class HomePresenter {
  constructor(view, cameraService, detectionService, rootFactsService) {
    this.view = view;
    this.cameraService = cameraService;
    this.detectionService = detectionService;
    this.rootFactsService = rootFactsService;

    this.isScanning = false;
    this.lastFrameTime = 0;
    this.lastDetectedLabel = "";
    
    // Bind this presenter to the view
    this.view.bindPresenter(this);
  }

  async initialize() {
    this.view.updateStatus("Memuat Model... 0%", false);
    let tfProgress = 0;
    let hfProgress = 0;

    const updateProgress = () => {
      const total = Math.round((tfProgress + hfProgress) / 2);
      this.view.updateStatus(`Menunggu Model... ${total}%`, false);
    };

    try {
      // Initialize both models concurrently
      await Promise.all([
        this.detectionService.loadModel((prog) => {
          tfProgress = prog;
          updateProgress();
        }),
        this.rootFactsService.loadModel((prog) => {
          hfProgress = prog;
          updateProgress();
        }),
      ]);

      this.view.updateStatus("Model Siap", true);

      // Enumerate and load camera options
      const cameraSelect = this.view.getCameraSelectElement();
      if (cameraSelect) {
        await this.cameraService.loadCameras(cameraSelect);
      }
    } catch (error) {
      console.error("Gagal menginisialisasi model:", error);
      this.view.updateStatus("Gagal Memuat Model", false);
    }
  }

  async handleToggleCamera() {
    if (this.isScanning) {
      this.stopScanning();
    } else {
      await this.startScanning();
    }
  }

  async startScanning() {
    try {
      this.isScanning = true;
      this.view.showScanningState();

      const selectedCamera = this.view.getSelectedCamera();
      await this.cameraService.startCamera("media-video", "media-canvas", selectedCamera);

      this.cameraService.setFPS(this.view.getFPSValue());
      this.rootFactsService.setTone(this.view.getSelectedTone());

      this.lastFrameTime = performance.now();
      this.runDetectionLoop();
    } catch (error) {
      console.error("Gagal memulai scanning:", error);
      this.isScanning = false;
      this.view.showIdleState();
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  }

  stopScanning() {
    this.isScanning = false;
    this.cameraService.stopCamera();
    this.view.showIdleState();
    this.lastDetectedLabel = "";
  }

  async runDetectionLoop() {
    if (!this.isScanning || !this.cameraService.isActive()) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= this.cameraService.frameInterval) {
      this.lastFrameTime = now;
      try {
        const videoElement = this.cameraService.video;
        if (videoElement && videoElement.readyState >= 2) {
          const result = await this.detectionService.predict(videoElement);

          if (this.isScanning) {
            this.view.updateDetectionUI(result.label, result.confidence);

            // If prediction confidence is above threshold
            if (result.confidence >= 70) {
              this.view.showResultState();

              // Trigger AI Gen facts only if detected vegetable changed
              if (result.label !== this.lastDetectedLabel) {
                this.lastDetectedLabel = result.label;
                await this.triggerFactsGeneration(result.label);
              }
            } else {
              this.view.showSearchingIndicator();
            }
          }
        }
      } catch (error) {
        console.error("Kesalahan dalam loop deteksi:", error);
      }
    }

    if (this.isScanning) {
      requestAnimationFrame(() => this.runDetectionLoop());
    }
  }

  async triggerFactsGeneration(vegetable) {
    this.view.showFunFactLoading();
    try {
      const tone = this.view.getSelectedTone();
      const fact = await this.rootFactsService.generateFacts(vegetable, tone);
      if (this.isScanning && vegetable === this.lastDetectedLabel) {
        this.view.showFunFactText(fact);
      }
    } catch (error) {
      console.error("Gagal membuat fakta unik:", error);
      if (this.isScanning && vegetable === this.lastDetectedLabel) {
        this.view.showFunFactText("Gagal membuat fakta unik untuk sayur ini. Silakan coba lagi.");
      }
    }
  }

  handleFPSChange(fps) {
    this.cameraService.setFPS(fps);
    this.view.updateFPSLabel(fps);
  }

  handleToneChange(tone) {
    this.rootFactsService.setTone(tone);
    if (this.lastDetectedLabel) {
      this.triggerFactsGeneration(this.lastDetectedLabel);
    }
  }

  async handleCopyFacts() {
    const text = this.view.getFunFactText();
    if (!text || text.includes("Fakta menarik akan muncul") || text.includes("Memuat fakta menarik")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.view.setCopyStatus(true);
      setTimeout(() => {
        this.view.setCopyStatus(false);
      }, 2000);
    } catch (err) {
      console.error("Gagal menyalin fakta:", err);
    }
  }
}
