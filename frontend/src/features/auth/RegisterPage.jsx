import AuthLayout from '../../shared/layouts/AuthLayout.jsx';
import Logo from '../../shared/components/navigation/Logo.jsx';

export default function RegisterPage() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <AuthLayout>
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_20px_48px_rgba(0,206,209,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden min-h-[760px] items-center overflow-hidden bg-cyan-950 lg:flex">
          <img
            alt="Immersive AquaPulse water show"
            className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-overlay"
            src="https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/95 via-teal-700/60 to-cyan-300/20" />
          <div className="absolute left-12 top-16 h-24 w-24 rounded-full border border-white/20 bg-white/10" />
          <div className="absolute right-10 top-1/3 h-16 w-16 rounded-full border border-cyan-100/20 bg-cyan-100/10" />
          <div className="absolute bottom-28 left-16 h-36 w-36 rounded-full border border-white/15 bg-white/10" />
          <div className="absolute -bottom-24 left-0 right-0 h-48 rounded-[50%] bg-white" />

          <div className="relative z-10 max-w-lg px-12 text-white">
            <Logo variant="footer" className="mb-8" />

            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
              Join the experience
            </p>
            <h2 className="text-5xl font-black leading-tight tracking-tight">
              Create Your <span className="text-cyan-300">AquaPulse</span> Account
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/85">
              Experience synchronized water and light like never before. Join the pulse of premium water park
              entertainment.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <span className="flex w-fit items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-bold backdrop-blur-md transition hover:scale-[1.02]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-300 text-slate-950">
                  <span className="material-symbols-outlined">star</span>
                </span>
                Access Exclusive Shows
              </span>
              <span className="flex w-fit items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-bold backdrop-blur-md transition hover:scale-[1.02]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300 text-slate-950">
                  <span className="material-symbols-outlined">schedule</span>
                </span>
                Priority Booking
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[760px] items-center justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-12">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-100/80 to-transparent lg:hidden" />
          <div className="absolute -right-16 top-16 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-orange-200/25 blur-3xl" />

          <div className="relative z-10 w-full max-w-[540px] rounded-[2rem] border border-cyan-100/80 bg-white/85 p-8 shadow-[0_20px_48px_rgba(0,206,209,0.14)] backdrop-blur-xl sm:p-10 lg:p-12">
            <header className="mb-10 text-center sm:text-left">
              <Logo className="justify-center sm:justify-start" />
              <h2 className="text-3xl font-black tracking-tight text-cyan-800">Get Started</h2>
              <p className="mt-2 text-sm text-slate-600">Enter your details to create an AquaPulse account.</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-name">
                  Full Name
                </label>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                    person
                  </span>
                  <input
                    className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="register-name"
                    placeholder="John Doe"
                    type="text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-email">
                    Email Address
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      mail
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-email"
                      placeholder="john@example.com"
                      type="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-phone">
                    Phone Number
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      call
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-phone"
                      placeholder="0123456789"
                      type="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-password">
                    Password
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      lock
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-password"
                      placeholder="••••••••"
                      type="password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-confirm-password">
                    Confirm Password
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      verified_user
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-confirm-password"
                      placeholder="••••••••"
                      type="password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-cyan-50/60 p-4">
                <input
                  className="mt-0.5 h-5 w-5 cursor-pointer rounded border-cyan-200 text-cyan-700 focus:ring-cyan-200"
                  id="register-terms"
                  type="checkbox"
                />
                <label className="text-sm leading-6 text-slate-600" htmlFor="register-terms">
                  I agree to the{' '}
                  <a className="font-bold text-cyan-700 underline-offset-4 transition hover:underline" href="#">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a className="font-bold text-cyan-700 underline-offset-4 transition hover:underline" href="#">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6900] to-[#c2410c] py-4 font-bold text-white shadow-lg shadow-orange-700/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-orange-700/30 active:translate-y-0"
                type="submit"
              >
                Create Account
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-slate-600">
              Already have an account?
              <a className="ml-1 font-bold text-cyan-700 underline-offset-4 transition hover:underline" href="#">
                Sign In
              </a>
            </p>
          </div>
        </section>
      </div>
    </AuthLayout>
  );
}
