import { pipeline } from "@huggingface/transformers";

class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = "wasm";
    this.currentTone = "normal";
  }

  async loadModel(onProgress) {
    if (typeof navigator !== "undefined" && "gpu" in navigator) {
      console.log("WebGPU detected. Attempting to use WebGPU for Transformers.js...");
      this.currentBackend = "webgpu";
    } else {
      console.log("WebGPU not detected. Using WASM for Transformers.js...");
      this.currentBackend = "wasm";
    }

    try {
      const modelId = "onnx-community/LaMini-Flan-T5-78M";
      console.log(`Loading Transformers.js model (${modelId}) on backend: ${this.currentBackend}...`);
      
      this.generator = await pipeline("text2text-generation", modelId, {
        device: this.currentBackend,
      });

      this.isModelLoaded = true;
      console.log("Transformers.js model loaded successfully.");
      if (onProgress) {
        onProgress(100);
      }
    } catch (error) {
      console.error("Gagal memuat model Transformers.js:", error);
      throw error;
    }
  }

  setTone(tone) {
    this.currentTone = tone || "normal";
  }

  async generateFacts(vegetable, tone = "normal") {
    if (!this.generator) {
      throw new Error("Model GenAI belum dimuat.");
    }

    this.isGenerating = true;

    const cleanVegetable = vegetable.replace(/[^a-zA-Z0-9\s-]/g, "").trim().substring(0, 50);
    if (!cleanVegetable) {
      throw new Error("Nama sayuran tidak valid.");
    }

    let prompt = "";
    const activeTone = tone || this.currentTone;
    
    if (activeTone === "funny") {
      prompt = `Tulis sebuah fakta unik yang sangat lucu, kocak, dan singkat tentang sayur ${cleanVegetable} dalam bahasa Indonesia. Maksimal 2 kalimat saja.`;
    } else if (activeTone === "professional") {
      prompt = `Tulis sebuah fakta sejarah menarik dan singkat tentang asal-usul sayur ${cleanVegetable} dalam bahasa Indonesia. Maksimal 2 kalimat saja.`;
    } else if (activeTone === "casual") {
      prompt = `Tulis fakta menarik tentang khasiat atau manfaat kesehatan sayur ${cleanVegetable} dalam bahasa Indonesia. Maksimal 2 kalimat saja.`;
    } else {
      prompt = `Tulis sebuah fakta unik, menarik, dan singkat tentang sayur ${cleanVegetable} dalam bahasa Indonesia. Maksimal 2 kalimat saja.`;
    }

    try {
      const result = await this.generator(prompt, {
        temperature: 0.7,
        max_new_tokens: 100,
        top_p: 0.9,
        do_sample: true,
      });

      this.isGenerating = false;
      let text = result[0]?.generated_text || "Gagal menghasilkan fakta unik.";
      text = text.replace(/^fakta unik:\s*/i, "");
      return text.trim();
    } catch (error) {
      this.isGenerating = false;
      console.error("Gagal menghasilkan fakta:", error);
      throw error;
    }
  }

  isReady() {
    return this.isModelLoaded;
  }
}

export default RootFactsService;
