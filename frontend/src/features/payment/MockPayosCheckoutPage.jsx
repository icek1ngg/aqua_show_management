import { Link, useSearchParams } from 'react-router-dom';

import MainLayout from '../../shared/layouts/MainLayout.jsx';

function resultUrl(bookingId, status) {
  return `/payments/result?bookingId=${encodeURIComponent(bookingId || 'mock')}&status=${status}&mock=true`;
}

export default function MockPayosCheckoutPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') || 'mock';
  const orderCode = searchParams.get('orderCode') || 'ASMSMOCK88219';
  const amount = Number(searchParams.get('amount') || 156000);
  const transferContent = orderCode;

  return (
    <MainLayout>
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 px-4 py-12 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-cyan-100 bg-white p-8 shadow-[0_16px_40px_rgba(8,145,178,0.10)]">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="inline-flex rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-800">
                Mock PayOS
              </p>
              <h1 className="mt-5 text-4xl font-black text-slate-950">Payment sandbox</h1>
              <p className="mt-3 text-slate-600">
                Quét QR hoặc dùng thông tin chuyển khoản thử nghiệm, sau đó chọn kết quả thanh toán.
              </p>
            </div>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
              <span className="material-symbols-outlined !text-3xl">payments</span>
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="rounded-[1.25rem] border border-cyan-100 bg-cyan-50 p-5 text-center">
                <div className="mx-auto grid aspect-square w-full max-w-[320px] grid-cols-8 gap-1 rounded-2xl border border-cyan-100 bg-white p-4">
                  {Array.from({ length: 64 }).map((_, index) => (
                    <span
                      className={[
                        'rounded-sm',
                        index % 3 === 0 || index % 7 === 0 || [0, 1, 8, 9, 54, 55, 62, 63].includes(index)
                          ? 'bg-slate-950'
                          : 'bg-cyan-50',
                      ].join(' ')}
                      key={index}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm font-bold text-slate-600">Mock QR - chỉ minh họa, không chuyển khoản thật</p>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-7">
              <div className="grid grid-cols-1 gap-4 rounded-2xl bg-cyan-50 p-5 text-sm font-semibold text-slate-600 md:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Booking ID</p>
                  <p className="mt-2 break-all font-black text-slate-900">{bookingId}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Order code</p>
                  <p className="mt-2 font-black text-slate-900">{orderCode}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Bank</p>
                  <p className="mt-2 font-black text-slate-900">Mock provider</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Account number</p>
                  <p className="mt-2 font-black text-slate-900">No real account in mock mode</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Amount</p>
                  <p className="mt-2 font-black text-cyan-700">{amount.toLocaleString('vi-VN')} VND</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Transfer content</p>
                  <p className="mt-2 font-black text-slate-900">{transferContent}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold leading-6 text-[#a43c12]">
                Ở hệ thống thật, frontend không tự xác nhận chuyển khoản. payOS nhận tiền, verify giao dịch, rồi gọi webhook backend
                <span className="font-black"> /api/payments/callback</span> để cập nhật booking và sinh vé QR.
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-4 font-black text-white hover:bg-emerald-700"
                  to={resultUrl(bookingId, 'success')}
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Simulate paid
                </Link>
                <Link
                  className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-4 font-black text-white hover:bg-red-700"
                  to={resultUrl(bookingId, 'failed')}
                >
                  <span className="material-symbols-outlined">cancel</span>
                  Simulate failed
                </Link>
                <Link
                  className="flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-4 font-black text-cyan-700 hover:bg-cyan-50"
                  to={resultUrl(bookingId, 'pending')}
                >
                  <span className="material-symbols-outlined">hourglass_empty</span>
                  Still pending
                </Link>
              </div>
            </div>
          </div>

          <Link className="mt-6 inline-flex items-center gap-2 font-bold text-cyan-700 hover:underline" to={`/bookings/${bookingId}/payment`}>
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to payment
          </Link>
        </section>
      </main>
    </MainLayout>
  );
}
