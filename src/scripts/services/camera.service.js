class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = null;
    this.fps = 30;
    this.frameInterval = 1000 / 30;
  }

  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
  }

  async loadCameras(cameraSelect) {
    if (!cameraSelect) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");

      cameraSelect.innerHTML = "";
      if (videoDevices.length === 0) {
        const option = document.createElement("option");
        option.value = "default";
        option.text = "Kamera Belakang (Default)";
        cameraSelect.appendChild(option);

        const optionFront = document.createElement("option");
        optionFront.value = "front";
        optionFront.text = "Kamera Depan";
        cameraSelect.appendChild(optionFront);
        return;
      }

      videoDevices.forEach((device, index) => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        
        let label = device.label || `Kamera ${index + 1}`;
        if (label.toLowerCase().includes("back") || label.toLowerCase().includes("rear") || label.toLowerCase().includes("environment")) {
          label = `Belakang - ${label}`;
        } else if (label.toLowerCase().includes("front") || label.toLowerCase().includes("user")) {
          label = `Depan - ${label}`;
        }
        
        option.text = label;
        cameraSelect.appendChild(option);
      });

      if (videoDevices.length > 0 && !videoDevices[0].label) {
        cameraSelect.innerHTML = "";
        const optionDefault = document.createElement("option");
        optionDefault.value = "default";
        optionDefault.text = "Kamera Belakang";
        cameraSelect.appendChild(optionDefault);

        const optionFront = document.createElement("option");
        optionFront.value = "front";
        optionFront.text = "Kamera Depan";
        cameraSelect.appendChild(optionFront);
      }
    } catch (error) {
      console.error("Gagal memuat daftar kamera:", error);
    }
  }

  async startCamera(videoId, canvasId, cameraSelectValue) {
    this.initializeElements(videoId, canvasId);
    this.stopCamera();

    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    };

    if (cameraSelectValue === "front") {
      constraints.video.facingMode = "user";
    } else if (cameraSelectValue === "default" || !cameraSelectValue) {
      constraints.video.facingMode = { ideal: "environment" };
    } else {
      constraints.video.deviceId = { exact: cameraSelectValue };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }
      return this.stream;
    } catch (error) {
      console.error("Gagal memulai kamera:", error);
      throw error;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  setFPS(fps) {
    this.fps = parseInt(fps, 10) || 30;
    this.frameInterval = 1000 / this.fps;
  }

  isActive() {
    return this.stream !== null && this.stream.active;
  }
}

export default CameraService;
