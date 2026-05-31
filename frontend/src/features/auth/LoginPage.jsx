import AuthLayout from '../../shared/layouts/AuthLayout.jsx';
import Logo from '../../shared/components/navigation/Logo.jsx';

const loginBubbles = [
  {
    width: '20px',
    height: '20px',
    left: '7%',
    top: '76%',
    '--bubble-duration': '4.8s',
    '--bubble-delay': '-1.2s',
    '--bubble-drift': '18px',
    '--bubble-rise': '118px',
  },
  {
    width: '40px',
    height: '40px',
    left: '15%',
    top: '58%',
    '--bubble-duration': '6.8s',
    '--bubble-delay': '-3.4s',
    '--bubble-drift': '-18px',
    '--bubble-rise': '148px',
  },
  {
    width: '16px',
    height: '16px',
    left: '25%',
    top: '82%',
    '--bubble-duration': '4.4s',
    '--bubble-delay': '-2.1s',
    '--bubble-drift': '26px',
    '--bubble-rise': '104px',
  },
  {
    width: '48px',
    height: '48px',
    left: '37%',
    top: '67%',
    '--bubble-duration': '7.4s',
    '--bubble-delay': '-4.8s',
    '--bubble-drift': '-24px',
    '--bubble-rise': '156px',
  },
  {
    width: '24px',
    height: '24px',
    left: '50%',
    top: '74%',
    '--bubble-duration': '5.2s',
    '--bubble-delay': '-1.8s',
    '--bubble-drift': '14px',
    '--bubble-rise': '126px',
  },
  {
    width: '36px',
    height: '36px',
    left: '62%',
    top: '52%',
    '--bubble-duration': '6.1s',
    '--bubble-delay': '-3.9s',
    '--bubble-drift': '-22px',
    '--bubble-rise': '138px',
  },
  {
    width: '16px',
    height: '16px',
    left: '73%',
    top: '80%',
    '--bubble-duration': '4.2s',
    '--bubble-delay': '-0.8s',
    '--bubble-drift': '22px',
    '--bubble-rise': '96px',
  },
  {
    width: '56px',
    height: '56px',
    left: '82%',
    top: '62%',
    '--bubble-duration': '7.8s',
    '--bubble-delay': '-5.6s',
    '--bubble-drift': '-30px',
    '--bubble-rise': '160px',
  },
  {
    width: '24px',
    height: '24px',
    left: '91%',
    top: '72%',
    '--bubble-duration': '5.6s',
    '--bubble-delay': '-2.7s',
    '--bubble-drift': '-14px',
    '--bubble-rise': '122px',
  },
  {
    width: '20px',
    height: '20px',
    left: '43%',
    top: '88%',
    '--bubble-duration': '5s',
    '--bubble-delay': '-3.1s',
    '--bubble-drift': '30px',
    '--bubble-rise': '112px',
  },
  {
    width: '12px',
    height: '12px',
    left: '20%',
    top: '36%',
    '--bubble-duration': '4s',
    '--bubble-delay': '-1.6s',
    '--bubble-drift': '-12px',
    '--bubble-rise': '88px',
  },
  {
    width: '20px',
    height: '20px',
    left: '70%',
    top: '34%',
    '--bubble-duration': '5.8s',
    '--bubble-delay': '-4.2s',
    '--bubble-drift': '18px',
    '--bubble-rise': '102px',
  },
];

function BubbleLayer({ bubbles }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {bubbles.map((bubble, index) => (
        <span
          key={`${bubble.left}-${bubble.top}-${index}`}
          className="aquapulse-bubble"
          style={bubble}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <AuthLayout>
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_20px_48px_rgba(0,206,209,0.14)] lg:grid-cols-2">
        <section className="relative hidden min-h-[680px] items-center justify-center overflow-hidden bg-cyan-950 lg:flex">
          <img
            alt="AquaPulse water display"
            className="absolute inset-0 z-0 h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwa1CnH9Pzvtiza_g9WIXaq7O8teYe46CgqFFLM8l4Ms8-xZUYX7ZtkZ0pI1rtpVbCgVgVa6d3bfBychRf0vCHNPTyFvRUNePQAAOcEpmHY2BUE5mcUoVLsyeQYjDlkMBBcFQwKm3bVnwxgjAm3XNaAV5OyoL8DtiKV-WXE3DG5RnCmaGSOArlT_aqRdEqINJyN6JQRkF-RsRrpgCzifDOa_VIkJ5bVA0mvbCWFj5rn4B7xs-pwa1NMgz0iOZDqz3viFF11zHfoQ"
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-cyan-950/90 via-teal-700/55 to-cyan-300/20" />
          <div className="absolute left-10 top-16 z-[2] h-24 w-24 rounded-full border border-white/20 bg-white/10 blur-[1px]" />
          <div className="absolute bottom-24 right-14 z-[2] h-36 w-36 rounded-full border border-cyan-200/20 bg-cyan-200/10 blur-[1px]" />
          <div className="absolute -bottom-24 left-0 right-0 z-[11] h-48 rounded-[50%] bg-white" />
          <BubbleLayer bubbles={loginBubbles} />

          <div className="relative z-20 max-w-lg px-12 text-white">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
              Premier Entertainment
            </p>
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Welcome Back to <span className="text-cyan-300">AquaPulse</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/85">
              Manage the magic behind the scenes. Your dashboard for aquatic entertainment and guest experiences awaits.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-md">
                <span className="material-symbols-outlined text-cyan-300">verified</span>
                Premier Entertainment
              </span>
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-md">
                <span className="material-symbols-outlined text-cyan-300">water_drop</span>
                Experience the Magic
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[640px] items-center justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-12">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-100/80 to-transparent lg:hidden" />
          <div className="absolute -right-16 top-12 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-orange-200/25 blur-3xl" />

          <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-cyan-100/80 bg-white/85 p-8 shadow-[0_20px_48px_rgba(0,206,209,0.14)] backdrop-blur-xl sm:p-10">
            <div className="mb-10 text-center">
              <Logo className="justify-center" />
              <p className="mt-2 text-sm text-slate-600">Sign in to your management account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    mail
                  </span>
                  <input
                    className="w-full rounded-2xl border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="login-email"
                    placeholder="name@aquashow.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="block text-sm font-bold text-slate-600" htmlFor="login-password">
                    Password
                  </label>
                  <a className="text-sm font-bold text-cyan-700 transition hover:text-cyan-900" href="#">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    lock
                  </span>
                  <input
                    className="w-full rounded-2xl border border-transparent bg-cyan-50/70 py-4 pl-12 pr-12 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="login-password"
                    placeholder="••••••••"
                    type="password"
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    type="button"
                    aria-label="Password visibility placeholder"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 px-1 text-sm text-slate-600" htmlFor="remember-login">
                <input
                  className="peer sr-only"
                  id="remember-login"
                  type="checkbox"
                />
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-cyan-300 bg-white shadow-sm transition peer-checked:border-cyan-600 peer-checked:bg-gradient-to-br peer-checked:from-cyan-400 peer-checked:to-teal-700 peer-checked:[&>svg]:opacity-100 peer-hover:border-cyan-500 peer-hover:bg-cyan-50 peer-focus-visible:ring-4 peer-focus-visible:ring-cyan-200"
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-white opacity-0 transition" viewBox="0 0 12 12" fill="none">
                    <path d="M2.25 6.15 4.85 8.75 9.75 3.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Remember me</span>
              </label>

              <div className="space-y-4 pt-2">
                <button
                  className="w-full rounded-full bg-gradient-to-r from-[#ff6900] to-[#c2410c] py-4 font-bold text-white shadow-lg shadow-orange-700/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-orange-700/30 active:translate-y-0"
                  type="submit"
                >
                  Sign In
                </button>

                <div className="flex items-center py-2">
                  <div className="flex-grow border-t border-cyan-100" />
                  <span className="mx-4 flex-shrink text-sm text-slate-400">or</span>
                  <div className="flex-grow border-t border-cyan-100" />
                </div>

                <button
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-cyan-100 bg-white py-4 font-bold text-slate-700 transition hover:bg-cyan-50"
                  type="button"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm text-slate-600">
              Do not have an account?
              <a className="ml-1 font-bold text-cyan-700 underline-offset-4 transition hover:underline" href="#">
                Register
              </a>
            </p>
          </div>
        </section>
      </div>
    </AuthLayout>
  );
}
