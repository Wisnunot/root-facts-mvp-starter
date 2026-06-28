import { pipeline } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';
import { isWebGPUSupported, logError } from '../utils/common.js';

// Model text2text-generation kecil (77M parameter) yang ringan untuk dijalankan
// langsung di browser, sekaligus cukup baik mengikuti instruksi singkat
const MODEL_ID = 'Xenova/LaMini-Flan-T5-77M';

// Seluruh prompt ditulis dalam Bahasa Inggris karena keterbatasan konteks
// bahasa model kecil ini terhadap Bahasa Indonesia
const TONE_PROMPTS = {
  normal:
    'Tell me one short and interesting fun fact about {vegetable}. Keep it under 40 words.',
  funny:
    'Tell me one funny and humorous fun fact about {vegetable}, written in a lighthearted joking style. Keep it under 40 words.',
  historical:
    'Tell me one historical fact or origin story about {vegetable}, written in a storytelling historical style. Keep it under 40 words.',
  professional:
    'Provide one accurate fun fact about {vegetable}, written in a formal and professional tone. Keep it under 40 words.',
  casual:
    'Share one chill and casual fun fact about {vegetable}, like you are talking to a close friend. Keep it under 40 words.'
};

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  // Memuat model dan menginisialisasi pipeline text2text-generation
  // Backend Adaptif: coba WebGPU dulu (dtype q4), fallback otomatis ke WASM jika gagal
  async loadModel(onProgress) {
    const handleProgress = (info) => {
      if (onProgress && info?.status === 'progress' && typeof info.progress === 'number') {
        onProgress(Math.round(info.progress));
      }
    };

    const device = isWebGPUSupported() ? 'webgpu' : 'wasm';

    try {
      this.generator = await pipeline('text2text-generation', MODEL_ID, {
        device,
        dtype: 'q4',
        progress_callback: handleProgress
      });
      this.currentBackend = device;
    } catch (error) {
      logError(`Gagal memuat model dengan backend ${device}, fallback ke WASM`, error);
      this.generator = await pipeline('text2text-generation', MODEL_ID, {
        device: 'wasm',
        dtype: 'q4',
        progress_callback: handleProgress
      });
      this.currentBackend = 'wasm';
    }

    this.isModelLoaded = true;
    return true;
  }

  // Fitur Persona Dinamis: mengatur gaya bahasa (tone) yang akan digunakan
  // saat menyusun prompt fun fact selanjutnya
  setTone(tone) {
    const isValidTone = TONE_CONFIG.availableTones.some((item) => item.value === tone);
    this.currentTone = isValidTone ? tone : TONE_CONFIG.defaultTone;
  }

  // Menghasilkan fun fact berdasarkan nama sayuran yang terdeteksi
  // Parameter generasi (temperature, max_new_tokens, top_p, do_sample) diatur
  // agar performa tetap responsif di perangkat pengguna
  async generateFacts(vegetableName) {
    if (!this.generator) {
      throw new Error('Generator AI belum siap');
    }

    this.isGenerating = true;

    try {
      const template = TONE_PROMPTS[this.currentTone] || TONE_PROMPTS.normal;
      const prompt = template.replace('{vegetable}', vegetableName);

      const output = await this.generator(prompt, {
        max_new_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      });

      const result = Array.isArray(output) ? output[0] : output;
      return (result?.generated_text || '').trim();
    } finally {
      this.isGenerating = false;
    }
  }

  // Memeriksa apakah generator sudah dimuat dan siap digunakan
  isReady() {
    return this.isModelLoaded && !!this.generator;
  }
}
