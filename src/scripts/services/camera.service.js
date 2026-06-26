class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = null;
  }

  // TODO [Basic] inisiasi elemen video dan canvas
  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
  }

  // TODO [Basic] Tambahkan konfigurasi kamera untuk mendapatkan daftar perangkat input video
  // TODO [Basic] Dapatkan constraints kamera berdasarkan konfigurasi dan kamera yang dipilih
  async loadCameras(cameraSelect) {}

  // TODO [Basic] Memulai kamera dengan perangkat yang dipilih dan menampilkan pada elemen video
  async startCamera(videoId, canvasId, cameraSelect) {}

  // TODO [Basic] Menghentikan siaran kamera dan membersihkan sumber daya
  stopCamera() {}

  // TODO [Skilled] Implementasikan metode untuk mengatur FPS kamera
  setFPS(fps) {}

  // TODO [Basic] Periksa apakah kamera sedang aktif
  isActive() {}
}

export default CameraService;
