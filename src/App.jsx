import { useRef, useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG, isValidDetection } from './utils/config';
import { logError, createDelay } from './utils/common';

function App() {
  const { state, actions } = useAppState();
  const detectionIntervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastDetectedRef = useRef(null);
  const isMountedRef = useRef(true);
  const servicesRef = useRef(state.services);
  // Mengunci loop deteksi selagi siklus analyze -> generate fact -> cooldown
  // berjalan, agar tidak ada deteksi baru yang menimpa hasil yang sedang diproses
  const isCycleActiveRef = useRef(false);
  // Menyimpan status "isRunning" terbaru agar callback async di dalam siklus
  // bisa berhenti dengan aman kalau user menekan stop di tengah proses
  const isRunningRef = useRef(false);
  const [currentTone, setCurrentTone] = useState('normal');
  const [isCopied, setIsCopied] = useState(false);

  // Selalu simpan referensi terbaru dari services & status running agar bisa
  // diakses dalam callback/interval tanpa harus menambah banyak dependency
  useEffect(() => {
    servicesRef.current = state.services;
  }, [state.services]);

  useEffect(() => {
    isRunningRef.current = state.isRunning;
  }, [state.isRunning]);

  const stopDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Siklus lengkap: tunggu jeda analisa -> tampilkan hasil deteksi ->
  // generate fun fact -> cooldown, lalu baru lepas kunci agar bisa
  // mendeteksi sayuran berikutnya
  const runFactCycle = useCallback(
    async (result) => {
      const { generator } = servicesRef.current;

      try {
        await createDelay(APP_CONFIG.analyzingDelay);
        if (!isMountedRef.current || !isRunningRef.current) return;

        actions.setDetectionResult({ className: result.className, score: result.score });
        actions.setAppState('result');
        actions.setFunFactData(null);

        try {
          if (generator && generator.isReady()) {
            const fact = await generator.generateFacts(result.className);
            if (isMountedRef.current && isRunningRef.current) {
              actions.setFunFactData(fact || 'error');
            }
          } else if (isMountedRef.current && isRunningRef.current) {
            actions.setFunFactData('error');
          }
        } catch (error) {
          logError('Gagal membuat fun fact', error);
          if (isMountedRef.current && isRunningRef.current) {
            actions.setFunFactData('error');
          }
        }

        // Cooldown: beri waktu pengguna membaca hasil sebelum deteksi
        // berikutnya diizinkan berjalan lagi
        await createDelay(APP_CONFIG.resultCooldownDelay);
        if (isMountedRef.current && isRunningRef.current) {
          lastDetectedRef.current = null;
        }
      } finally {
        isCycleActiveRef.current = false;
      }
    },
    [actions]
  );

  // Fungsi untuk memulai loop deteksi: menggambar frame video ke canvas,
  // lalu menjalankan prediksi pada interval yang menghormati FPS Limit.
  // Begitu satu siklus analyze->generate fact dimulai, loop ini dikunci
  // (isCycleActiveRef) sampai cooldown selesai, supaya tidak ada deteksi baru
  // yang menimpa hasil yang sedang diproses (race condition).
  const runDetectionTick = useCallback(async () => {
    const { camera, detector } = servicesRef.current;
    if (!camera || !detector || isProcessingRef.current) return;
    if (isCycleActiveRef.current) return;
    if (!camera.isReady() || !detector.isLoaded()) return;

    isProcessingRef.current = true;

    try {
      const { video, canvas } = camera;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = await detector.predict(canvas);
      const confidence = Math.round(result.score * 100);
      const valid = isValidDetection({ ...result, confidence });

      if (valid && result.className !== lastDetectedRef.current && !isCycleActiveRef.current) {
        lastDetectedRef.current = result.className;
        isCycleActiveRef.current = true;
        actions.setAppState('analyzing');

        // Jalankan seluruh siklus secara berurutan (bukan setTimeout terpisah)
        // agar tidak ada dua siklus yang overlap satu sama lain
        runFactCycle(result);
      }
    } catch (error) {
      logError('Deteksi gagal', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [actions, runFactCycle]);

  const startDetectionLoop = useCallback(() => {
    stopDetectionLoop();
    const camera = servicesRef.current.camera;
    const fps = camera ? camera.getFPS() : 30;
    const intervalMs = Math.max(1000 / fps, 50);
    detectionIntervalRef.current = setInterval(runDetectionTick, intervalMs);
  }, [runDetectionTick, stopDetectionLoop]);

  // Inisialisasi layanan deteksi, kamera, dan generator fakta saat aplikasi dimuat
  useEffect(() => {
    isMountedRef.current = true;
    const camera = new CameraService();
    const detector = new DetectionService();
    const generator = new RootFactsService();

    actions.setServices({ camera, detector, generator });

    (async () => {
      try {
        actions.setModelStatus('Menunggu Model Visi... 0%');
        await detector.loadModel((progress) => {
          if (isMountedRef.current) {
            actions.setModelStatus(`Menunggu Model Visi... ${progress}%`);
          }
        });

        actions.setModelStatus('Menunggu Model Bahasa... 0%');
        await generator.loadModel((progress) => {
          if (isMountedRef.current) {
            actions.setModelStatus(`Menunggu Model Bahasa... ${progress}%`);
          }
        });

        if (isMountedRef.current) {
          actions.setModelStatus('Model AI Siap');
        }
      } catch (error) {
        logError('Gagal memuat model AI', error);
        if (isMountedRef.current) {
          actions.setModelStatus('Gagal Memuat Model');
          actions.setError('Gagal memuat model AI. Coba muat ulang halaman.');
        }
      }
    })();

    // Bersihkan sumber daya saat komponen ditinggalkan
    return () => {
      isMountedRef.current = false;
      stopDetectionLoop();
      camera.stopCamera();
    };
  }, []);

  // Fungsi untuk memulai dan menghentikan kamera
  const handleToggleCamera = useCallback(
    async (cameraType) => {
      const { camera } = servicesRef.current;
      if (!camera) return;

      if (state.isRunning) {
        stopDetectionLoop();
        camera.stopCamera();
        actions.setRunning(false);
        actions.resetResults();
        lastDetectedRef.current = null;
      } else {
        try {
          actions.setError(null);
          await camera.startCamera(cameraType);
          actions.setRunning(true);
          actions.resetResults();
          lastDetectedRef.current = null;
          startDetectionLoop();
        } catch (error) {
          logError('Gagal memulai kamera', error);
          actions.setError(error.message || 'Gagal memulai kamera');
        }
      }
    },
    [state.isRunning, actions, startDetectionLoop, stopDetectionLoop]
  );

  // Fungsi untuk mengubah nada (tone/persona) fakta yang dihasilkan
  const handleToneChange = useCallback((tone) => {
    setCurrentTone(tone);
    if (servicesRef.current.generator) {
      servicesRef.current.generator.setTone(tone);
    }
  }, []);

  // Fungsi untuk menyalin fakta ke clipboard
  const handleCopyFact = useCallback(async () => {
    if (!state.funFactData || state.funFactData === 'error') return;

    try {
      await navigator.clipboard.writeText(state.funFactData);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (error) {
      logError('Gagal menyalin ke clipboard', error);
    }
  }, [state.funFactData]);

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
          isCopied={isCopied}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js & Transformers.js</p>
      </footer>

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
