import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getBookingDetail } from '../../services/bookingService.js';
import { reconcilePayment } from '../../services/paymentService.js';
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
  if (status === 'PAID') {
    return bookingStatus === 'PAID' && Number(booking?.tickets?.total || 0) > 0
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

function isReconciliationPaid(reconciliation) {
  const paymentStatus = String(reconciliation?.paymentStatus || '').trim().toUpperCase();
  const bookingStatus = String(reconciliation?.bookingStatus || '').trim().toUpperCase();
  return paymentStatus === 'SUCCESS' || bookingStatus === 'PAID';
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
  const [successPopupDismissed, setSuccessPopupDismissed] = useState(false);
  const pollingStartedAtRef = useRef(Date.now());
  const pollTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const reconciledBookingIdRef = useRef(null);
  const reconciliationConfirmedPaymentRef = useRef(false);

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

    if (reconciledBookingIdRef.current !== bookingId) {
      reconciledBookingIdRef.current = bookingId;
      reconciliationConfirmedPaymentRef.current = false;
      try {
        const reconciliation = await reconcilePayment(bookingId);
        reconciliationConfirmedPaymentRef.current = isReconciliationPaid(reconciliation);
        if (mountedRef.current && reconciliationConfirmedPaymentRef.current) {
          setBooking((current) => ({
            ...current,
            id: current?.id || bookingId,
            status: 'PAID',
            payment: {
              ...current?.payment,
              status: 'SUCCESS',
              paidAt: reconciliation?.paidAt || current?.payment?.paidAt,
            },
          }));
          setResultState(resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING);
          setError('');
        }
      } catch {
        // The callback may already have completed or PayOS may be temporarily unavailable.
      }
    }

    try {
      const detail = await getBookingDetail(bookingId);
      if (!mountedRef.current) {
        return;
      }

      let nextState = resolveResultState(detail);
      let displayDetail = detail;
      if (reconciliationConfirmedPaymentRef.current && nextState === resultStates.PAYMENT_PENDING) {
        displayDetail = {
          ...detail,
          status: 'PAID',
          payment: {
            ...detail?.payment,
            status: 'SUCCESS',
          },
        };
        nextState = resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING;
      }
      if ([resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING, resultStates.PAYMENT_SUCCESS_TICKETS_READY].includes(nextState)) {
        reconciliationConfirmedPaymentRef.current = true;
      }
      setBooking(displayDetail);
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
      const shouldRetry = reconciliationConfirmedPaymentRef.current
        || !loadError?.response
        || Number(loadError.response.status) >= 500;
      if (shouldRetry) {
        if (!reconciliationConfirmedPaymentRef.current) {
          setResultState(resultStates.PAYMENT_PENDING);
        }
        setError('');
        pollTimerRef.current = window.setTimeout(checkBooking, pollIntervalMs);
        return;
      }
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to verify payment.');
      setResultState(resultStates.ERROR);
    }
  }, [bookingId, location, navigate, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    pollingStartedAtRef.current = Date.now();
    setSuccessPopupDismissed(false);
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
              title="Verifying payment..."
              message="Please wait while we check your booking status."
            >
              <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-700" />
            </StateCard>
          ) : null}

          {successState && !successPopupDismissed ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/15 p-4 backdrop-blur-[2px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="payment-success-title" aria-describedby="payment-success-message">
              <section className="relative max-h-[92vh] w-full max-w-[30rem] overflow-y-auto rounded-[2rem] border border-white/70 bg-white/95 p-6 text-center shadow-[0_24px_70px_rgba(0,206,209,0.28)] backdrop-blur-xl sm:p-10">
                <span className="pointer-events-none absolute -right-5 -top-6 h-24 w-24 rounded-full bg-primary-container/15" aria-hidden="true" />
                <span className="pointer-events-none absolute -left-3 top-24 h-10 w-10 rounded-full bg-primary-fixed/30" aria-hidden="true" />
                <span className="pointer-events-none absolute bottom-28 right-7 h-6 w-6 rounded-full bg-soft-turquoise/45" aria-hidden="true" />

                <div className="relative">
                  <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-[0_14px_35px_rgba(5,150,105,0.22)] ring-8 ring-emerald-50">
                    <span className="material-symbols-outlined !text-6xl" aria-hidden="true">verified</span>
                  </span>
                  <span className="mt-7 inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Payment confirmed
                  </span>
                  <h1 id="payment-success-title" className="mt-4 text-3xl font-black tracking-tight text-on-surface sm:text-4xl">Payment successful!</h1>

                  <div id="payment-success-message" className="mt-6 rounded-3xl border border-primary-container/20 bg-surface-container-low px-5 py-4">
                    {resultState === resultStates.PAYMENT_SUCCESS_TICKETS_PROCESSING && !ticketsTimedOut ? (
                      <p className="font-semibold leading-7 text-on-surface-variant">
                        Payment was successful. Your tickets are being prepared.
                      </p>
                    ) : null}

                    {resultState === resultStates.PAYMENT_SUCCESS_TICKETS_READY ? (
                      <p className="font-semibold leading-7 text-emerald-800">
                        Your {booking?.tickets?.total || ''} ticket{Number(booking?.tickets?.total || 0) === 1 ? '' : 's'} {Number(booking?.tickets?.total || 0) === 1 ? 'is' : 'are'} ready.
                      </p>
                    ) : null}

                    {ticketsTimedOut ? (
                      <p className="font-semibold leading-7 text-[#a43c12]">
                        Payment was successful, but your QR tickets are taking longer than expected to prepare.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-7 flex flex-col gap-3">
                    <button
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-4 text-base font-black text-white shadow-[0_12px_28px_rgba(0,105,107,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(0,105,107,0.3)] focus:outline-none focus:ring-4 focus:ring-primary-fixed/60"
                      onClick={() => navigate(`/my-tickets?bookingId=${encodeURIComponent(booking?.id || bookingId)}`, { replace: true })}
                      type="button"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">qr_code_2</span>
                      View My Tickets
                    </button>
                    <button
                      autoFocus
                      className="min-h-14 rounded-full border-2 border-primary/25 bg-white/70 px-6 py-4 font-black text-primary transition hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-4 focus:ring-primary-fixed/60"
                      onClick={() => setSuccessPopupDismissed(true)}
                      type="button"
                    >
                      Close
                    </button>
                    {ticketsTimedOut ? (
                      <button className="min-h-12 font-black text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary" onClick={checkAgain} type="button">
                        Check Again
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {resultState === resultStates.PAYMENT_PENDING ? (
            <StateCard icon="hourglass_empty" title="Payment is processing" message="PayOS has not confirmed the payment yet. This page will keep checking the backend." />
          ) : null}

          {resultState === resultStates.PAYMENT_FAILED ? (
            <StateCard icon="error" title="Payment failed" message="The payment was not completed. Please review your booking." tone="red" />
          ) : null}

          {resultState === resultStates.PAYMENT_EXPIRED ? (
            <StateCard icon="timer_off" title="Payment expired" message="This booking can no longer be paid. Please create a new booking." tone="slate" />
          ) : null}

          {resultState === resultStates.ERROR ? (
            <StateCard icon="cloud_off" title="Unable to verify payment" message={error || 'An error occurred while loading the booking status.'} tone="red">
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
