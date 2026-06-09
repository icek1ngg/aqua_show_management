import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { normalizeBookingPaymentStatus } from '../../shared/utils/paymentStatus.js';

const resultStates = Object.freeze({
  VERIFYING_PAYMENT: 'VERIFYING_PAYMENT',
  PAYMENT_SUCCESS_TICKETS_PROCESSING: 'PAYMENT_SUCCESS_TICKETS_PROCESSING',
  PAYMENT_SUCCESS_TICKETS_READY: 'PAYMENT_SUCCESS_TICKETS_READY',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  ERROR: 'ERROR',
});

const pollIntervalMs = 1500;
const ticketTimeoutMs = 30000;

function resolveResultState(booking) {
  const bookingStatus = String(booking?.status || '').trim().toUpperCase();
  const { status } = normalizeBookingPaymentStatus(booking, booking?.payment);
  if (bookingStatus === 'PAID') {
    return Number(booking?.tickets?.total || 0) > 0
      ? resultStates.PAYMENT_SUCCESS_TICKETS_READY
      : resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING;
  }
  if (status === 'FAILED') {
    return resultStates.PAYMENT_FAILED;
  }
  if (status === 'EXPIRED') {
    return resultStates.PAYMENT_EXPIRED;
  }
  return resultStates.PAYMENT_PENDING;
}

function StateCard({ icon, title, message, tone = 'cyan', children }) {
  const tones = {
    cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <section className={`rounded-[2rem] border p-8 text-center shadow-xl sm:p-10 ${tones[tone]}`}>
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/80 shadow-sm">
        <span className="material-symbols-outlined !text-5xl" aria-hidden="true">{icon}</span>
      </span>
      <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">{message}</p>
      {children}
    </section>
  );
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = searchParams.get('bookingId');
  const [resultState, setResultState] = useState(resultStates.VERIFYING_PAYMENT);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [ticketsTimedOut, setTicketsTimedOut] = useState(false);
  const pollingStartedAtRef = useRef(Date.now());
  const pollTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    window.clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
  }, []);

  const checkBooking = useCallback(async () => {
    stopPolling();
    if (!bookingId) {
      setError('Booking ID is missing.');
      setResultState(resultStates.ERROR);
      return;
    }

    try {
      const detail = await getBookingDetail(bookingId);
      if (!mountedRef.current) {
        return;
      }

      const nextState = resolveResultState(detail);
      setBooking(detail);
      setResultState(nextState);
      setError('');

      if (nextState === resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING) {
        if (Date.now() - pollingStartedAtRef.current >= ticketTimeoutMs) {
          setTicketsTimedOut(true);
          return;
        }
        pollTimerRef.current = window.setTimeout(checkBooking, pollIntervalMs);
      } else if (nextState === resultStates.PAYMENT_PENDING) {
        pollTimerRef.current = window.setTimeout(checkBooking, pollIntervalMs);
      }
    } catch (loadError) {
      if (!mountedRef.current) {
        return;
      }
      if (loadError?.response?.status === 401) {
        navigate('/login', { replace: true, state: { from: location } });
        return;
      }
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to verify payment.');
      setResultState(resultStates.ERROR);
    }
  }, [bookingId, location, navigate, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    pollingStartedAtRef.current = Date.now();
    setResultState(resultStates.VERIFYING_PAYMENT);
    checkBooking();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [checkBooking, stopPolling]);

  const checkAgain = () => {
    pollingStartedAtRef.current = Date.now();
    setTicketsTimedOut(false);
    setResultState(resultStates.VERIFYING_PAYMENT);
    checkBooking();
  };

  const ticketCount = Number(booking?.tickets?.total || 0);
  const successState = [
    resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING,
    resultStates.PAYMENT_SUCCESS_TICKETS_READY,
  ].includes(resultState);

  return (
    <MainLayout>
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {resultState === resultStates.VERIFYING_PAYMENT ? (
            <StateCard
              icon="progress_activity"
              title="Đang xác minh thanh toán..."
              message="Vui lòng chờ trong giây lát. Hệ thống đang kiểm tra trạng thái booking từ máy chủ."
            >
              <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-700" />
            </StateCard>
          ) : null}

          {successState ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="payment-success-title">
              <section className="w-full max-w-lg rounded-[2rem] border border-emerald-200 bg-white p-7 text-center shadow-2xl sm:p-9">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <span className="material-symbols-outlined !text-5xl" aria-hidden="true">verified</span>
                </span>
                <h1 id="payment-success-title" className="mt-5 text-3xl font-black text-slate-950">Thanh toán thành công!</h1>
                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  Cảm ơn bạn. Thanh toán của bạn đã được xác nhận.
                </p>

                {resultState === resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING && !ticketsTimedOut ? (
                  <p className="mt-5 rounded-2xl bg-cyan-50 px-5 py-4 font-semibold leading-7 text-cyan-800">
                    Vé QR của bạn đang được chuẩn bị, vui lòng chờ trong giây lát...
                  </p>
                ) : null}

                {ticketsTimedOut ? (
                  <p className="mt-5 rounded-2xl bg-yellow-50 px-5 py-4 font-semibold leading-7 text-[#a43c12]">
                    Thanh toán đã thành công, nhưng vé QR đang được xử lý lâu hơn bình thường.
                  </p>
                ) : null}

                <div className="mt-7 flex flex-col gap-3">
                  {!ticketsTimedOut ? (
                    <button
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={ticketCount === 0}
                      onClick={() => navigate(`/bookings/${bookingId}`)}
                      type="button"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">{ticketCount > 0 ? 'qr_code_2' : 'hourglass_empty'}</span>
                      {ticketCount > 0 ? 'View My Ticket' : 'Preparing ticket...'}
                    </button>
                  ) : (
                    <>
                      <button className="min-h-12 rounded-full bg-cyan-700 px-6 py-3 font-black text-white hover:bg-cyan-800" onClick={checkAgain} type="button">
                        Check Again
                      </button>
                      <button className="min-h-12 rounded-full border border-cyan-200 bg-white px-6 py-3 font-black text-cyan-700 hover:bg-cyan-50" onClick={() => navigate('/bookings/my')} type="button">
                        Go to My Bookings
                      </button>
                    </>
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {resultState === resultStates.PAYMENT_PENDING ? (
            <StateCard icon="hourglass_empty" title="Thanh toán đang được xử lý" message="PayOS chưa xác nhận thanh toán. Trang này sẽ tự động kiểm tra lại từ máy chủ." />
          ) : null}

          {resultState === resultStates.PAYMENT_FAILED ? (
            <StateCard icon="error" title="Thanh toán thất bại" message="Thanh toán chưa được hoàn tất. Vui lòng kiểm tra booking của bạn." tone="red" />
          ) : null}

          {resultState === resultStates.PAYMENT_EXPIRED ? (
            <StateCard icon="timer_off" title="Thanh toán đã hết hạn" message="Booking này không thể thanh toán lại. Vui lòng tạo booking mới." tone="slate" />
          ) : null}

          {resultState === resultStates.ERROR ? (
            <StateCard icon="cloud_off" title="Không thể xác minh thanh toán" message={error || 'Đã xảy ra lỗi khi tải trạng thái booking.'} tone="red">
              <button className="mt-6 rounded-full bg-cyan-700 px-6 py-3 font-black text-white hover:bg-cyan-800" onClick={checkAgain} type="button">
                Check Again
              </button>
            </StateCard>
          ) : null}

          {!successState && resultState !== resultStates.VERIFYING_PAYMENT ? (
            <div className="mt-6 flex justify-center">
              <Link className="rounded-full border border-cyan-200 bg-white px-6 py-3 font-black text-cyan-700 hover:bg-cyan-50" to="/bookings/my">
                Go to My Bookings
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </MainLayout>
  );
}
