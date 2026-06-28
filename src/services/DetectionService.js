import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';
import { isWebGPUSupported, validateModelMetadata, logError } from '../utils/common.js';

const MODEL_URL = '/model/model.json';
const METADATA_URL = '/model/metadata.json';
const DEFAULT_IMAGE_SIZE = 224;

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.imageSize = DEFAULT_IMAGE_SIZE;
    this.backend = null;
  }

  // Memuat model TensorFlow.js dan metadata label secara bersamaan, lalu menyimpannya
  // Sekaligus menerapkan strategi Backend Adaptif (WebGPU dengan fallback ke WebGL)
  async loadModel(onProgress) {
    await this._setupBackend();

    const metadataResponse = await fetch(METADATA_URL);
    const metadata = await metadataResponse.json();

    if (!validateModelMetadata(metadata)) {
      throw new Error('Metadata model tidak valid');
    }

    this.labels = metadata.labels;
    this.imageSize = metadata.imageSize || DEFAULT_IMAGE_SIZE;

    this.model = await tf.loadLayersModel(MODEL_URL, {
      onProgress: (fraction) => {
        if (onProgress) onProgress(Math.round(fraction * 100));
      }
    });

    // Warm-up model agar prediksi pertama kali tidak lambat, dibungkus tf.tidy()
    // agar tensor sementara otomatis dibersihkan dari memori
    tf.tidy(() => {
      const dummy = tf.zeros([1, this.imageSize, this.imageSize, 3]);
      this.model.predict(dummy);
    });

    return true;
  }

  // Backend Adaptif: cek dukungan navigator.gpu lalu coba pakai WebGPU,
  // jika gagal/tidak tersedia maka otomatis fallback ke WebGL
  async _setupBackend() {
    if (isWebGPUSupported()) {
      try {
        await tf.setBackend('webgpu');
        await tf.ready();
        this.backend = 'webgpu';
        return;
      } catch (error) {
        logError('Backend WebGPU gagal diinisialisasi, fallback ke WebGL', error);
      }
    }

    await tf.setBackend('webgl');
    await tf.ready();
    this.backend = 'webgl';
  }

  // Melakukan prediksi pada elemen gambar/canvas yang diberikan
  // tf.tidy() memastikan seluruh tensor antara (resize, normalisasi, dst) didispose otomatis
  async predict(imageElement) {
    if (!this.model) {
      throw new Error('Model belum dimuat');
    }

    const data = tf.tidy(() => {
      const tensor = tf.browser
        .fromPixels(imageElement)
        .resizeBilinear([this.imageSize, this.imageSize])
        .toFloat()
        .div(255.0)
        .expandDims(0);

      const predictions = this.model.predict(tensor);
      return predictions.dataSync();
    });

    let maxIndex = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[maxIndex]) maxIndex = i;
    }

    return {
      className: this.labels[maxIndex] || 'Tidak diketahui',
      score: data[maxIndex],
      isValid: true
    };
  }

  // Memeriksa apakah model sudah selesai dimuat dan siap digunakan
  isLoaded() {
    return !!this.model;
  }
}
