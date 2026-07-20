import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

import { validateQr } from '../../services/ticketValidationService.js';
import StaffLayout from '../../shared/layouts/StaffLayout.jsx';

const resultStyles = {
  SUCCESS: {
    icon: 'verified',
    title: 'Valid ticket',
    message: 'Entry allowed.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  ALREADY_USED: {
    icon: 'history',
    title: 'Ticket already used',
    message: 'Entry denied. This ticket has already been checked in.',
    className: 'border-yellow-200 bg-yellow-50 text-[#a43c12]',
  },
  EXPIRED: {
    icon: 'timer_off',
    title: 'Ticket expired',
    message: 'Entry denied. This ticket is no longer valid.',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  INVALID_QR: {
    icon: 'qr_code_scanner',
    title: 'Invalid QR code',
    message: 'Entry denied. This QR code is invalid or cannot be found.',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  BOOKING_NOT_PAID: {
    icon: 'block',
    title: 'Booking not paid',
    message: 'Entry denied. This booking has not been paid.',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  TICKET_NOT_FOUND: {
    icon: 'search_off',
    title: 'Invalid QR code',
    message: 'Entry denied. This QR code is invalid or cannot be found.',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  INVALID_STATUS: {
    icon: 'block',
    title: 'Invalid ticket status',
    message: 'Entry denied. This ticket cannot be used for check-in.',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  ERROR: {
    icon: 'cloud_off',
    title: 'Unable to verify ticket',
    message: 'Please try scanning again.',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
};

const scannerStates = Object.freeze({
  IDLE: 'IDLE',
  STARTING_CAMERA: 'STARTING_CAMERA',
  SCANNING: 'SCANNING',
  PROCESSING: 'PROCESSING',
  RESULT: 'RESULT',
  COOLDOWN: 'COOLDOWN',
  ERROR: 'ERROR',
});

const scanIntervalMs = 180;
const sameQrCooldownMs = 4000;
const minimumProcessingMs = 1200;

function formatDateTime(value) {
  return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Unavailable';
}

function formatTicketReference(ticket) {
  return ticket?.id ? `Ticket ${String(ticket.id).slice(0, 8).toUpperCase()}` : 'Ticket not found';
}

async function scanWithBarcodeDetector(detector, video) {
  const codes = await detector.detect(video);
  return codes[0]?.rawValue || '';
}

function scanWithCanvas(video, canvas) {
  if (!canvas || !video.videoWidth || !video.videoHeight) {
    return '';
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return '';
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  return code?.data || '';
}

function normalizeQrPayload(rawPayload) {
  const trimmed = String(rawPayload || '').trim();
  if (!trimmed) {
    return { value: '', error: 'QR code is required.' };
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const candidate = parsed?.qrCode || parsed?.ticketCode || parsed?.code || parsed?.payload || parsed?.data;
      if (typeof candidate === 'string' && candidate.trim()) {
        return { value: candidate.trim(), error: '' };
      }
      return { value: '', error: 'QR JSON does not contain a ticket code.' };
    } catch {
      return { value: '', error: 'Invalid QR format. Paste the ticket code manually.' };
    }
  }

  return { value: trimmed, error: '' };
}

function playTone(frequency, durationMs) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return;
  }

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    window.setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, durationMs);
  } catch {
    // Some browsers block audio feedback until a user gesture unlocks audio.
  }
}

function runValidationFeedback(resultCode) {
  const isSuccess = resultCode === 'SUCCESS';
  if (navigator.vibrate) {
    navigator.vibrate(isSuccess ? 80 : [80, 40, 80]);
  }
  playTone(isSuccess ? 880 : 220, isSuccess ? 120 : 180);
}

function runDetectionFeedback() {
  if (navigator.vibrate) {
    navigator.vibrate(35);
  }
  playTone(660, 70);
}

function getScannerStatus(scannerState, result) {
  switch (scannerState) {
    case scannerStates.STARTING_CAMERA:
      return 'Camera starting...';
    case scannerStates.SCANNING:
      return 'Scanning...';
    case scannerStates.PROCESSING:
      return 'QR detected. Validating...';
    case scannerStates.COOLDOWN:
      return 'Preparing the next scan...';
    case scannerStates.RESULT:
      if (result?.result === 'SUCCESS') {
        return 'Ticket valid - Allow entry';
      }
      if (result?.result === 'ALREADY_USED') {
        return 'Ticket already used';
      }
      return 'Invalid ticket - Deny entry';
    case scannerStates.ERROR:
      return 'Scanner error';
    default:
      return 'Camera stopped';
  }
}

function waitForVideoReady(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('Camera opened but video did not become ready.'));
    }, 10000);
    const handleReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('canplay', handleReady);
    };

    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('canplay', handleReady);
  });
}

function ResultPanel({ result }) {
  if (!result) {
    return (
      <section className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white p-10 text-center">
        <span className="material-symbols-outlined text-6xl text-cyan-200">qr_code_scanner</span>
        <h2 className="mt-4 text-2xl font-black text-slate-950">Ready to validate</h2>
        <p className="mt-2 text-slate-500">Use the camera or manual input to validate a ticket.</p>
      </section>
    );
  }

  const style = resultStyles[result.result] || resultStyles.INVALID_QR;

  return (
    <section className={`rounded-[1.5rem] border p-6 shadow-sm transition duration-300 ${style.className}`}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-sm">
            <span className="material-symbols-outlined !text-3xl">{style.icon}</span>
          </span>
          <h2 className="mt-4 text-3xl font-black">{style.title}</h2>
          <p className="mt-2 font-semibold">{style.message}</p>
        </div>
        <span className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] shadow-sm">{result.result}</span>
      </div>

      <div className={`mt-6 grid grid-cols-1 gap-4 ${result.capturedImage ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="rounded-2xl bg-white/80 p-4 text-slate-700 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Ticket</p>
          <p className="mt-2 font-black">{formatTicketReference(result.ticket)}</p>
          <p className="mt-2 text-sm font-semibold">Status: {result.ticket?.status || 'N/A'}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 text-slate-700 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Show</p>
          <p className="mt-2 font-black">{result.show?.title || 'Unavailable'}</p>
          <p className="mt-2 text-sm font-semibold">{result.show?.venueName || 'No venue'}</p>
          <p className="mt-1 text-sm font-semibold">{formatDateTime(result.show?.startTime)}</p>
        </div>
        {result.capturedImage && (
          <div className="rounded-2xl bg-white/80 p-4 text-slate-700 shadow-sm md:col-span-1">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Captured QR</p>
            <div className="relative mt-2 overflow-hidden rounded-xl border border-white bg-slate-950 group">
              <img
                src={result.capturedImage}
                alt="Captured QR Code"
                className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors duration-350" />
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                Captured
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ResultModal({ result, onScanNext }) {
  if (!result) {
    return null;
  }

  const style = resultStyles[result.result] || resultStyles.INVALID_QR;
  const isSuccess = result.result === 'SUCCESS';
  const isWarning = result.result === 'ALREADY_USED';
  const tone = isSuccess
    ? {
        accent: 'text-emerald-700',
        icon: 'bg-emerald-100 text-emerald-700 ring-emerald-50',
        badge: 'bg-emerald-100 text-emerald-700',
        border: 'border-emerald-200/70',
        glow: 'shadow-[0_24px_70px_rgba(5,150,105,0.24)]',
      }
    : isWarning
      ? {
          accent: 'text-[#a43c12]',
          icon: 'bg-yellow-100 text-[#a43c12] ring-yellow-50',
          badge: 'bg-yellow-100 text-[#a43c12]',
          border: 'border-yellow-200/70',
          glow: 'shadow-[0_24px_70px_rgba(234,179,8,0.2)]',
        }
      : {
          accent: 'text-red-700',
          icon: 'bg-red-100 text-red-700 ring-red-50',
          badge: 'bg-red-100 text-red-700',
          border: 'border-red-200/70',
          glow: 'shadow-[0_24px_70px_rgba(220,38,38,0.2)]',
        };
  const resultBadge = isSuccess ? 'VALIDATED' : isWarning ? 'USED' : 'REJECTED';
  const resultTime = result.checkedInAt || result.attemptedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/15 p-4 backdrop-blur-[2px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="scan-result-title" aria-describedby="scan-result-message">
      <section className={`relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border bg-white/95 p-6 backdrop-blur-xl sm:p-9 ${tone.border} ${tone.glow}`}>
        <span className="pointer-events-none absolute -right-6 -top-7 h-28 w-28 rounded-full bg-primary-container/15" aria-hidden="true" />
        <span className="pointer-events-none absolute -left-4 top-28 h-12 w-12 rounded-full bg-primary-fixed/25" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-24 right-8 h-7 w-7 rounded-full bg-soft-turquoise/45" aria-hidden="true" />

        <div className="relative text-center">
          <span className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full shadow-sm ring-8 ${tone.icon}`}>
            <span className="material-symbols-outlined !text-6xl" aria-hidden="true">{style.icon}</span>
          </span>
          <span className={`mt-7 inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${tone.badge}`}>
            {resultBadge}
          </span>
          <h2 id="scan-result-title" className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${tone.accent}`}>{style.title}</h2>
          <p id="scan-result-message" className="mx-auto mt-3 max-w-md text-base font-semibold leading-7 text-on-surface-variant">{style.message}</p>

          <dl className="mt-7 grid grid-cols-1 gap-3 rounded-3xl border border-outline-variant/30 bg-surface-container-low/90 p-5 text-left text-on-surface sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Show</dt>
              <dd className="mt-1 font-black">{result.show?.title || 'N/A'}</dd>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Venue</dt>
              <dd className="mt-1 font-black">{result.show?.venueName || 'N/A'}</dd>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Booking status</dt>
              <dd className="mt-1 font-black">{result.booking?.status || 'N/A'}</dd>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Ticket status</dt>
              <dd className="mt-1 font-black">{result.ticket?.status || 'N/A'}</dd>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 sm:col-span-2">
              <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{isSuccess ? 'Check-in time' : 'Attempt time'}</dt>
              <dd className="mt-1 font-black">{formatDateTime(resultTime)}</dd>
            </div>
          </dl>

          <button
            autoFocus
            className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-4 text-lg font-black text-white shadow-[0_12px_28px_rgba(0,105,107,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(0,105,107,0.3)] focus:outline-none focus:ring-4 focus:ring-primary-fixed/60"
            onClick={onScanNext}
            type="button"
          >
            <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
            Scan Next
          </button>
        </div>
      </section>
    </div>
  );
}

function ProcessingModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="scan-processing-title">
      <section className="w-full max-w-md rounded-[2rem] border border-cyan-200 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-700" />
        <h2 id="scan-processing-title" className="mt-5 text-3xl font-black text-slate-950">Checking ticket...</h2>
        <p className="mt-3 text-base font-semibold leading-7 text-slate-600">Please wait while we verify this QR code.</p>
      </section>
    </div>
  );
}

export default function StaffTicketValidationPage() {
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedPayload, setScannedPayload] = useState('');
  const [scannerState, setScannerState] = useState(scannerStates.IDLE);
  const [debugInfo, setDebugInfo] = useState({
    permission: 'unknown',
    readyState: 0,
    dimensions: '0x0',
    detector: 'jsQR',
    lastAttempt: '',
    lastRawValue: '',
    lastApiResult: '',
    lastError: '',
  });
  const [capturedImage, setCapturedImage] = useState(null);
  const [flashActive, setFlashActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scheduledFrameRef = useRef(null);
  const scanLoopActiveRef = useRef(false);
  const isDetectingRef = useRef(false);
  const isValidatingRef = useRef(false);
  const scannerStateRef = useRef(scannerStates.IDLE);
  const lastScanAttemptAtRef = useRef(0);
  const lastDetectedQrRef = useRef('');
  const lastDetectedAtRef = useRef(0);
  const processedQrCacheRef = useRef(new Map());
  const cooldownTimerRef = useRef(null);
  const scannerStatus = getScannerStatus(scannerState, result);
  const cameraStarting = scannerState === scannerStates.STARTING_CAMERA;
  const showQrDebug = import.meta.env.DEV || import.meta.env.VITE_SHOW_QR_DEBUG === 'true';

  const transitionScanner = (nextState) => {
    scannerStateRef.current = nextState;
    setScannerState(nextState);
  };

  const clearScannerTimers = () => {
    window.clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = null;
  };

  const cancelScheduledFrame = () => {
    const scheduled = scheduledFrameRef.current;
    const video = videoRef.current;
    if (!scheduled) {
      return;
    }
    if (scheduled.type === 'video' && video?.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(scheduled.id);
    } else {
      window.cancelAnimationFrame(scheduled.id);
    }
    scheduledFrameRef.current = null;
  };

  const stopCamera = () => {
    scanLoopActiveRef.current = false;
    isDetectingRef.current = false;
    isValidatingRef.current = false;
    clearScannerTimers();
    cancelScheduledFrame();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setCapturedImage(null);
    setFlashActive(false);
    lastScanAttemptAtRef.current = 0;
    transitionScanner(scannerStates.IDLE);
  };

  useEffect(() => () => stopCamera(), []);

  const resumeScanning = () => {
    clearScannerTimers();
    setResult(null);
    setScannedPayload('');
    setCapturedImage(null);
    setCameraError('');
    isDetectingRef.current = false;
    isValidatingRef.current = false;
    if (streamRef.current) {
      transitionScanner(scannerStates.COOLDOWN);
      cooldownTimerRef.current = window.setTimeout(() => {
        if (scanLoopActiveRef.current && streamRef.current) {
          transitionScanner(scannerStates.SCANNING);
        }
      }, 200);
    } else {
      transitionScanner(scannerStates.IDLE);
    }
  };

  const rememberProcessedQr = (payload, resultCode) => {
    processedQrCacheRef.current.set(payload, Date.now() + sameQrCooldownMs);
  };

  const applyValidation = async (payload, capturedImg = null, source = 'manual') => {
    if (isValidatingRef.current) {
      return;
    }

    const parsedQr = normalizeQrPayload(payload);
    if (parsedQr.error) {
      setError(parsedQr.error);
      setCameraError(parsedQr.error);
      setDebugInfo((current) => ({ ...current, lastError: parsedQr.error }));
      return;
    }

    const normalizedQr = parsedQr.value;
    const cachedUntil = processedQrCacheRef.current.get(normalizedQr);
    if (cachedUntil && cachedUntil > Date.now()) {
      setCameraError('This QR was just scanned.');
      setError('This QR was just scanned.');
      return;
    }
    processedQrCacheRef.current.delete(normalizedQr);

    isValidatingRef.current = true;
    const processingStartedAt = Date.now();
    transitionScanner(scannerStates.PROCESSING);
    setLoading(true);
    setError('');
    setCameraError('');
    setScannedPayload(normalizedQr);

    if (capturedImg) {
      setCapturedImage(capturedImg);
    } else if (source === 'manual') {
      setCapturedImage(null);
    }

    try {
      const validation = await validateQr(normalizedQr);
      const remainingDelay = minimumProcessingMs - (Date.now() - processingStartedAt);
      if (remainingDelay > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
      }
      const validationWithImage = { ...validation, capturedImage: capturedImg };
      rememberProcessedQr(normalizedQr, validation.result);
      setResult(validationWithImage);
      setHistory((current) => [validationWithImage, ...current].slice(0, 8));
      setQrCode('');
      setDebugInfo((current) => ({ ...current, lastApiResult: validation.result }));
      runValidationFeedback(validation.result);
      transitionScanner(scannerStates.RESULT);
    } catch (validationError) {
      const message = validationError.response?.data?.message || validationError.message || 'Unable to validate QR.';
      const remainingDelay = minimumProcessingMs - (Date.now() - processingStartedAt);
      if (remainingDelay > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
      }
      rememberProcessedQr(normalizedQr, 'ERROR');
      const errorResult = {
        result: 'ERROR',
        message: 'Please try scanning again.',
        attemptedAt: new Date().toISOString(),
        capturedImage: capturedImg,
      };
      setResult(errorResult);
      setHistory((current) => [errorResult, ...current].slice(0, 8));
      setError('');
      setCameraError('');
      setDebugInfo((current) => ({ ...current, lastError: message }));
      runValidationFeedback('ERROR');
      transitionScanner(scannerStates.RESULT);
    } finally {
      setLoading(false);
      isValidatingRef.current = false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await applyValidation(qrCode, null, 'manual');
  };

  const startCamera = async () => {
    if (scanLoopActiveRef.current || streamRef.current || scannerStateRef.current === scannerStates.STARTING_CAMERA) {
      return;
    }

    transitionScanner(scannerStates.STARTING_CAMERA);
    setCameraError('');
    setError('');
    setCapturedImage(null);
    setFlashActive(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }

      if (navigator.permissions?.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' });
          setDebugInfo((current) => ({ ...current, permission: permission.state }));
        } catch {
          setDebugInfo((current) => ({ ...current, permission: 'unavailable' }));
        }
      }

      detectorRef.current = null;
      if ('BarcodeDetector' in window) {
        const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
        if (supportedFormats.includes('qr_code')) {
          detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
        }
      }
      setDebugInfo((current) => ({ ...current, detector: detectorRef.current ? 'BarcodeDetector' : 'jsQR' }));

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        await waitForVideoReady(videoRef.current);
      }

      setCameraActive(true);
      scanLoopActiveRef.current = true;
      transitionScanner(scannerStates.SCANNING);

      const scheduleNextFrame = (scanFrame) => {
        if (!scanLoopActiveRef.current) {
          return;
        }
        const video = videoRef.current;
        if (video?.requestVideoFrameCallback) {
          scheduledFrameRef.current = { type: 'video', id: video.requestVideoFrameCallback(scanFrame) };
        } else {
          scheduledFrameRef.current = { type: 'animation', id: window.requestAnimationFrame(scanFrame) };
        }
      };

      const scanFrame = async () => {
        scheduledFrameRef.current = null;
        if (!scanLoopActiveRef.current) {
          return;
        }

        const video = videoRef.current;
        const now = Date.now();
        if (
          !video
          || scannerStateRef.current !== scannerStates.SCANNING
          || isDetectingRef.current
          || isValidatingRef.current
          || now - lastScanAttemptAtRef.current < scanIntervalMs
          || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
          || video.videoWidth === 0
          || video.videoHeight === 0
        ) {
          scheduleNextFrame(scanFrame);
          return;
        }

        lastScanAttemptAtRef.current = now;
        isDetectingRef.current = true;
        try {
          const attemptedAt = new Date();
          const rawValue = detectorRef.current
            ? await scanWithBarcodeDetector(detectorRef.current, video)
            : scanWithCanvas(video, canvasRef.current);
          setDebugInfo((current) => ({
            ...current,
            readyState: video.readyState,
            dimensions: `${video.videoWidth}x${video.videoHeight}`,
            lastAttempt: attemptedAt.toLocaleTimeString(),
            lastRawValue: rawValue || current.lastRawValue,
          }));

          if (rawValue) {
            const parsedQr = normalizeQrPayload(rawValue);
            const normalizedQr = parsedQr.value;
            const detectedAt = Date.now();
            const cachedUntil = normalizedQr ? processedQrCacheRef.current.get(normalizedQr) : 0;

            if (cachedUntil && cachedUntil > detectedAt) {
              if (normalizedQr !== lastDetectedQrRef.current || detectedAt - lastDetectedAtRef.current > sameQrCooldownMs) {
                setCameraError('This QR was just scanned.');
                lastDetectedQrRef.current = normalizedQr;
                lastDetectedAtRef.current = detectedAt;
              }
            } else if (normalizedQr) {
              if (scannerStateRef.current !== scannerStates.SCANNING || isValidatingRef.current) {
                return;
              }
              processedQrCacheRef.current.delete(normalizedQr);
              transitionScanner(scannerStates.PROCESSING);
              lastDetectedQrRef.current = normalizedQr;
              lastDetectedAtRef.current = detectedAt;
              setScannedPayload(normalizedQr);
              runDetectionFeedback();

              let capturedDataUrl = null;
              const canvas = canvasRef.current;
              if (canvas) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                if (context) {
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                  capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                  setCapturedImage(capturedDataUrl);
                  setFlashActive(true);
                  window.setTimeout(() => setFlashActive(false), 250);
                }
              }
              await applyValidation(normalizedQr, capturedDataUrl, 'camera');
            } else if (parsedQr.error) {
              setCameraError(parsedQr.error);
              setDebugInfo((current) => ({ ...current, lastError: parsedQr.error }));
            }
          }
        } catch (scanError) {
          const message = scanError.message || 'Unable to scan QR from camera.';
          setCameraError(message);
          setDebugInfo((current) => ({ ...current, lastError: message }));
        } finally {
          isDetectingRef.current = false;
          scheduleNextFrame(scanFrame);
        }
      };

      scheduleNextFrame(scanFrame);
    } catch (cameraStartError) {
      const message = cameraStartError.message || 'Camera permission was denied.';
      stopCamera();
      setCameraError(message);
      setDebugInfo((current) => ({ ...current, lastError: message }));
      transitionScanner(scannerStates.ERROR);
    }
  };

  return (
    <StaffLayout>
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-4xl font-black text-slate-950 md:text-5xl">QR Ticket Validation</h1>
            <p className="mt-3 text-slate-600">Scan a guest ticket or enter its QR code manually.</p>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <section className="space-y-6 lg:col-span-7">
              <section className="overflow-hidden rounded-[1.5rem] border border-cyan-100 bg-white shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                <div className="flex flex-col gap-4 border-b border-cyan-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Scan Ticket</h2>
                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{scannerStatus}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">Scanner pauses after every detection until you choose Scan Next.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 py-3 text-sm font-black text-white hover:bg-cyan-800 disabled:bg-slate-300 transition"
                      disabled={cameraActive || cameraStarting}
                      onClick={startCamera}
                      type="button"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                      Start Camera
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700 hover:bg-cyan-50 disabled:text-slate-300 transition"
                      disabled={!cameraActive}
                      onClick={stopCamera}
                      type="button"
                    >
                      <span className="material-symbols-outlined">videocam_off</span>
                      Stop Camera
                    </button>
                  </div>
                </div>
                <div className="relative bg-slate-950 overflow-hidden">
                  <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className={`absolute inset-0 bg-white transition-opacity duration-200 pointer-events-none z-20 ${flashActive ? 'opacity-95' : 'opacity-0'}`} />
                  
                  {capturedImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-white z-10 p-4 transition-all">
                      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-4 border-cyan-400 shadow-2xl bg-slate-900 aspect-video">
                        <img src={capturedImage} className="w-full h-full object-cover" alt="Captured Frame" />
                        <div className="absolute top-2 left-2 rounded-full bg-cyan-700 px-3 py-1 text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Captured frame
                        </div>
                      </div>
                      <p className="mt-5 rounded-full bg-slate-950/70 px-5 py-2 text-sm font-black">
                        {scannerState === scannerStates.PROCESSING ? 'Validating ticket...' : 'Scan paused'}
                      </p>
                    </div>
                  )}

                  {!cameraActive ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center text-white">
                      <span className="material-symbols-outlined !text-6xl text-cyan-200">qr_code_scanner</span>
                      <p className="mt-3 max-w-sm px-6 text-sm font-semibold text-cyan-50">Open the camera and place the AquaPulse ticket QR inside the frame.</p>
                    </div>
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-56 w-56 rounded-[1.5rem] border-4 border-cyan-300/90 shadow-[0_0_0_999px_rgba(2,6,23,0.28)]" />
                  </div>
                  {cameraActive ? (
                    <div className="absolute inset-x-0 bottom-0 z-20 bg-cyan-700/95 px-5 py-3 text-center text-sm font-black text-white">{scannerStatus}</div>
                  ) : null}
                </div>
                {showQrDebug && scannedPayload ? (
                  <div className="border-t border-cyan-100 bg-cyan-50 px-5 py-3 text-xs font-semibold text-slate-600">
                    Last scanned: <span className="font-mono text-slate-900">{scannedPayload}</span>
                  </div>
                ) : null}
                {cameraError ? <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">{cameraError}</p> : null}
                {showQrDebug ? (
                  <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 font-mono text-[11px] text-slate-600">
                    <p>
                      state={scannerState} locked={String(isDetectingRef.current || isValidatingRef.current)}
                      {' '}coolingDown={String(scannerState === scannerStates.COOLDOWN || processedQrCacheRef.current.size > 0)}
                    </p>
                    <p>permission={debugInfo.permission} readyState={debugInfo.readyState} size={debugInfo.dimensions}</p>
                    <p>detector={debugInfo.detector} lastAttempt={debugInfo.lastAttempt || 'none'}</p>
                    <p className="break-all">lastDetected={lastDetectedQrRef.current || debugInfo.lastRawValue || 'none'}</p>
                    <p className="break-all">lastApi={debugInfo.lastApiResult || 'none'}</p>
                    <p className="break-all">lastError={debugInfo.lastError || 'none'}</p>
                  </div>
                ) : null}
              </section>

              <form className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]" onSubmit={handleSubmit}>
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-600">Manual QR Input</span>
                  <textarea
                    className="min-h-36 w-full rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 font-mono text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    onChange={(event) => setQrCode(event.target.value)}
                    placeholder="Paste QR code"
                    value={qrCode}
                  />
                </label>
                {error ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-3 font-black text-white hover:bg-cyan-800 disabled:bg-slate-300 transition" disabled={loading} type="submit">
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                    {loading ? 'Validating...' : 'Validate'}
                  </button>
                </div>
              </form>

              <ResultPanel result={result} />
            </section>

            <aside className="lg:col-span-5">
              <section className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">Scan history</h2>
                <div className="mt-5 space-y-3">
                  {history.length === 0 ? (
                    <p className="rounded-2xl bg-cyan-50 p-5 text-sm font-semibold text-slate-500">No scans in this session.</p>
                  ) : (
                    history.map((item) => {
                      const style = resultStyles[item.result] || resultStyles.INVALID_QR;
                      return (
                        <article
                          className="flex gap-4 rounded-2xl border border-cyan-100 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/20"
                          key={item.checkInLogId || `${item.result}-${item.checkedInAt || item.attemptedAt}`}
                        >
                          {item.capturedImage && (
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-950 shadow-sm">
                              <img src={item.capturedImage} className="h-full w-full object-cover" alt="Thumb" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`rounded-full px-3 py-0.5 text-xs font-black ${style.className}`}>{item.result}</span>
                              <span className="text-[10px] font-bold text-slate-400">{formatDateTime(item.checkedInAt || item.attemptedAt)}</span>
                            </div>
                            <p className="mt-1.5 truncate text-sm font-black text-slate-800">{item.show?.title || style.title}</p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{formatTicketReference(item.ticket)}</p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
      {scannerState === scannerStates.PROCESSING ? <ProcessingModal /> : null}
      <ResultModal result={scannerState === scannerStates.RESULT ? result : null} onScanNext={resumeScanning} />
    </StaffLayout>
  );
}
