import { getCameraErrorMessage } from '../utils/common.js';

export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.devices = [];
    this.fps = 30;
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  // Mengambil daftar seluruh perangkat input video (kamera) yang tersedia
  async loadCameras() {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      this.devices = allDevices.filter((device) => device.kind === 'videoinput');
      return this.devices;
    } catch (error) {
      console.error('Gagal memuat daftar kamera:', error);
      return [];
    }
  }

  // Membangun MediaStream constraints berdasarkan jenis kamera yang dipilih
  getConstraints(cameraType = 'default') {
    const facingMode = cameraType === 'front' ? 'user' : 'environment';

    return {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };
  }

  // Memulai kamera dengan constraints yang dipilih dan menampilkannya pada elemen video
  async startCamera(cameraType = 'default') {
    this.stopCamera();

    const constraints = this.getConstraints(cameraType);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      throw new Error(getCameraErrorMessage(error));
    }

    if (this.video) {
      this.video.srcObject = this.stream;
      try {
        await this.video.play();
      } catch {
        // play() bisa ter-reject jika dihentikan secara bersamaan, aman diabaikan
      }
    }

    return true;
  }

  // Menghentikan siaran kamera dan membersihkan seluruh sumber daya terkait
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // Mengatur FPS (frame per second) yang digunakan oleh loop deteksi
  setFPS(fps) {
    const parsed = Number(fps);
    this.fps = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
  }

  getFPS() {
    return this.fps;
  }

  // Memeriksa apakah kamera sedang aktif menyiarkan stream
  isActive() {
    return !!(this.stream && this.stream.active);
  }

  // Memeriksa apakah elemen video sudah memiliki cukup data untuk diproses
  isReady() {
    return !!(this.video && this.video.readyState >= 2 && this.isActive());
  }
}
