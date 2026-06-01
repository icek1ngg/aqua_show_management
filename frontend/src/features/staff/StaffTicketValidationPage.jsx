import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

import { validateQr } from '../../services/ticketValidationService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';

const resultStyles = {
  SUCCESS: {
    icon: 'verified',
    title: 'Valid ticket',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  ALREADY_USED: {
    icon: 'history',
    title: 'Already used',
    className: 'border-yellow-200 bg-yellow-50 text-[#a43c12]',
  },
  EXPIRED: {
    icon: 'timer_off',
    title: 'Expired ticket',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  },
  INVALID_QR: {
    icon: 'qr_code_scanner',
    title: 'Invalid QR',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  BOOKING_NOT_PAID: {
    icon: 'block',
    title: 'Booking not paid',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
};

function formatDateTime(value) {
  return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Unavailable';
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
    inversionAttempts: 'dontInvert',
  });

  return code?.data || '';
}

function ResultPanel({ result }) {
  if (!result) {
    return (
      <section className="rounded-[1.5rem] border border-dashed border-cyan-200 bg-white p-10 text-center">
        <span className="material-symbols-outlined text-6xl text-cyan-200">qr_code_scanner</span>
        <h2 className="mt-4 text-2xl font-black text-slate-950">Ready to validate</h2>
        <p className="mt-2 text-slate-500">Scan or paste a ticket QR payload to check in guests.</p>
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
          <p className="mt-2 font-semibold">{result.message}</p>
        </div>
        <span className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] shadow-sm">{result.result}</span>
      </div>

      <div className={`mt-6 grid grid-cols-1 gap-4 ${result.capturedImage ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="rounded-2xl bg-white/80 p-4 text-slate-700 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Ticket</p>
          <p className="mt-2 break-all font-black">{result.ticket?.qrCode || 'Not found'}</p>
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
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Bản chụp QR thực tế</p>
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

export default function StaffTicketValidationPage() {
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedPayload, setScannedPayload] = useState('');
  
  const [autoCapture, setAutoCapture] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [flashActive, setFlashActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanTimerRef = useRef(null);
  const validatingRef = useRef(false);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

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
  };

  useEffect(() => () => stopCamera(), []);

  const resumeScanning = () => {
    setCapturedImage(null);
    validatingRef.current = false;
  };

  const applyValidation = async (payload, capturedImg = null) => {
    const trimmedQr = payload.trim();
    if (!trimmedQr) {
      setError('QR code is required.');
      return;
    }

    validatingRef.current = true;
    setLoading(true);
    setError('');
    setScannedPayload(trimmedQr);
    
    if (capturedImg) {
      setCapturedImage(capturedImg);
    } else if (!cameraActive) {
      setCapturedImage(null);
    }

    try {
      const validation = await validateQr(trimmedQr);
      const validationWithImage = { ...validation, capturedImage: capturedImg };
      setResult(validationWithImage);
      setHistory((current) => [validationWithImage, ...current].slice(0, 8));
      setQrCode('');
    } catch (validationError) {
      setError(validationError.response?.data?.message || validationError.message || 'Unable to validate QR.');
    } finally {
      setLoading(false);
      if (!autoCapture || !capturedImg) {
        window.setTimeout(() => {
          validatingRef.current = false;
        }, 1200);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await applyValidation(qrCode);
  };

  const startCamera = async () => {
    setCameraError('');
    setError('');
    setCapturedImage(null);
    setFlashActive(false);

    try {
      if ('BarcodeDetector' in window) {
        const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
        if (supportedFormats.includes('qr_code')) {
          detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || validatingRef.current || loading || (autoCapture && capturedImage)) {
          return;
        }

        if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          return;
        }

        try {
          const rawValue = detectorRef.current
            ? await scanWithBarcodeDetector(detectorRef.current, videoRef.current)
            : scanWithCanvas(videoRef.current, canvasRef.current);

          if (rawValue) {
            let capturedDataUrl = null;
            if (autoCapture && videoRef.current && canvasRef.current) {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const context = canvas.getContext('2d');
              if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setCapturedImage(capturedDataUrl);
                setFlashActive(true);
                setTimeout(() => setFlashActive(false), 250);
              }
            }
            await applyValidation(rawValue, capturedDataUrl);
          }
        } catch (scanError) {
          setCameraError(scanError.message || 'Unable to scan QR from camera.');
        }
      }, 700);
    } catch (cameraStartError) {
      setCameraError(cameraStartError.message || 'Camera permission was denied.');
      stopCamera();
    }
  };

  return (
    <MainLayout>
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <p className="inline-flex rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-800">UC-13 Staff</p>
            <h1 className="mt-4 text-4xl font-black text-slate-950 md:text-5xl">Validate QR ticket</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Check guest QR status and record every scan attempt.</p>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <section className="space-y-6 lg:col-span-7">
              <section className="overflow-hidden rounded-[1.5rem] border border-cyan-100 bg-white shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
                <div className="flex flex-col gap-4 border-b border-cyan-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Camera scanner</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">Scan ticket QR</h2>
                    
                    <div className="mt-3 flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoCapture}
                          onChange={(e) => setAutoCapture(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-700"></div>
                        <span className="ms-2.5 text-xs font-bold text-slate-600">Chế độ chụp & Khóa hình khi rõ</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 py-3 text-sm font-black text-white hover:bg-cyan-800 disabled:bg-slate-300 transition"
                      disabled={cameraActive}
                      onClick={startCamera}
                      type="button"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                      Start scan
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700 hover:bg-cyan-50 disabled:text-slate-300 transition"
                      disabled={!cameraActive}
                      onClick={stopCamera}
                      type="button"
                    >
                      <span className="material-symbols-outlined">videocam_off</span>
                      Stop
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
                          Hình ảnh đã bắt (Captured)
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={resumeScanning}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 font-black text-white hover:bg-cyan-600 transition shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
                      >
                        <span className="material-symbols-outlined">restart_alt</span>
                        Tiếp tục quét (Scan Next)
                      </button>
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
                  {loading ? (
                    <div className="absolute inset-x-0 bottom-0 bg-cyan-700/95 px-5 py-3 text-center text-sm font-black text-white z-20">Validating scanned QR...</div>
                  ) : null}
                </div>
                {scannedPayload ? (
                  <div className="border-t border-cyan-100 bg-cyan-50 px-5 py-3 text-xs font-semibold text-slate-600">
                    Last scanned: <span className="font-mono text-slate-900">{scannedPayload}</span>
                  </div>
                ) : null}
                {cameraError ? <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">{cameraError}</p> : null}
              </section>

              <form className="rounded-[1.5rem] border border-cyan-100 bg-white p-6 shadow-[0_16px_40px_rgba(8,145,178,0.10)]" onSubmit={handleSubmit}>
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-600">QR payload</span>
                  <textarea
                    className="min-h-36 w-full rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 font-mono text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    onChange={(event) => setQrCode(event.target.value)}
                    placeholder="ASMS:booking-id:ticket-index:signature"
                    value={qrCode}
                  />
                </label>
                {error ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-700 px-6 py-3 font-black text-white hover:bg-cyan-800 disabled:bg-slate-300 transition" disabled={loading} type="submit">
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                    {loading ? 'Validating...' : 'Validate ticket'}
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-6 py-3 font-black text-cyan-700 hover:bg-cyan-50 transition" onClick={() => setQrCode('ASMS:MOCK:VALID')} type="button">
                    <span className="material-symbols-outlined">science</span>
                    Demo valid
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
                          className="rounded-2xl border border-cyan-100 p-4 hover:border-cyan-300 hover:bg-cyan-50/20 transition cursor-pointer flex gap-4"
                          key={item.checkInLogId}
                          onClick={() => setResult(item)}
                        >
                          {item.capturedImage && (
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-950 shadow-sm">
                              <img src={item.capturedImage} className="h-full w-full object-cover" alt="Thumb" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`rounded-full px-3 py-0.5 text-xs font-black ${style.className}`}>{item.result}</span>
                              <span className="text-[10px] font-bold text-slate-400">{formatDateTime(item.checkedInAt)}</span>
                            </div>
                            <p className="mt-1.5 truncate text-sm font-black text-slate-800">{item.show?.title || item.message}</p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 font-mono">{item.ticket?.qrCode || 'Unknown QR'}</p>
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
    </MainLayout>
  );
}
