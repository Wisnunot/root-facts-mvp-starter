
import "@tensorflow/tfjs-backend-webgpu";

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
    this.performanceStats = {
      operations: 0,
      totalTime: 0,
      averageTime: 0,
    };
  }

  async loadModel(onProgress) {
  // Mock untuk testing lokal - hapus ini setelah model berhasil diload
  await new Promise(resolve => setTimeout(resolve, 1000));
  this.isModelLoaded = true;
  if (onProgress) onProgress(100);
  console.log("Mock model loaded");
}

async generateFacts(vegetable, tone = "normal") {
  // Mock response
  return `Fakta menarik tentang ${vegetable}: Sayuran ini kaya akan nutrisi penting untuk kesehatan tubuh!`;
}

  async predict(imageElement) {
    if (!this.model) {
      throw new Error("Model belum dimuat.");
    }

    const startTime = performance.now();

    const predictionTensor = tf.tidy(() => {
      const tfImage = tf.browser.fromPixels(imageElement);
      
      const [height, width] = tfImage.shape;
      const size = Math.min(height, width);
      const y = Math.floor((height - size) / 2);
      const x = Math.floor((width - size) / 2);
      const cropped = tfImage.slice([y, x, 0], [size, size, 3]);

      const resized = tf.image.resizeBilinear(cropped, [224, 224]);
      const batched = resized.expandDims(0);
      
      const normalized = batched.toFloat().div(127.5).sub(1.0);

      return this.model.predict(normalized);
    });

    const scores = await predictionTensor.data();
    predictionTensor.dispose();

    let maxIndex = 0;
    let maxScore = -1;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        maxIndex = i;
      }
    }

    const predictionTime = performance.now() - startTime;
    this.updateStats(predictionTime);

    return {
      label: this.labels[maxIndex],
      confidence: scores[maxIndex] * 100,
      predictionTime,
    };
  }

  updateStats(time) {
    this.performanceStats.operations += 1;
    this.performanceStats.totalTime += time;
    this.performanceStats.averageTime =
      this.performanceStats.totalTime / this.performanceStats.operations;
  }
}

export default DetectionService;
