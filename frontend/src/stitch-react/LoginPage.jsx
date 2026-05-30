export default function LoginPage() {
  return (
    <div className="bg-background text-on-surface min-h-screen">
      <style>{`body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
        }
        .underwater-shadow {
            box-shadow: 0px 20px 48px rgba(0, 206, 209, 0.12);
        }
        .bubble {
            position: absolute;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            pointer-events: none;
            animation: rise 10s infinite ease-in;
        }
        @keyframes rise {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(-20vh) scale(1.5); opacity: 0; }
        }
        .wave-svg {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: auto;
            fill: #f7f9fb;
        }`}</style>
<main className="flex min-h-screen overflow-hidden">

<section className="hidden md:flex relative w-1/2 overflow-hidden items-center justify-center">
<img alt="AquaShow Display" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwa1CnH9Pzvtiza_g9WIXaq7O8teYe46CgqFFLM8l4Ms8-xZUYX7ZtkZ0pI1rtpVbCgVgVa6d3bfBychRf0vCHNPTyFvRUNePQAAOcEpmHY2BUE5mcUoVLsyeQYjDlkMBBcFQwKm3bVnwxgjAm3XNaAV5OyoL8DtiKV-WXE3DG5RnCmaGSOArlT_aqRdEqINJyN6JQRkF-RsRrpgCzifDOa_VIkJ5bVA0mvbCWFj5rn4B7xs-pwa1NMgz0iOZDqz3viFF11zHfoQ" />

<div className="absolute inset-0 bg-gradient-to-tr from-primary/80 via-primary-container/40 to-transparent"></div>

<div className="absolute inset-0" id="bubble-container"></div>
<div className="relative z-10 px-margin-desktop text-white max-w-lg">
<h1 className="font-display-lg text-display-lg mb-6 leading-tight">Welcome Back to <span className="text-electric-cyan">AquaShow</span></h1>
<p className="font-body-lg text-body-lg mb-8 opacity-90">Manage the magic behind the scenes. Your dashboard for premier aquatic entertainment and guest experiences awaits.</p>
<div className="flex flex-wrap gap-4">
<div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
<span className="material-symbols-outlined text-electric-cyan">verified</span>
<span className="font-label-bold text-sm">Premier Entertainment</span>
</div>
<div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
<span className="material-symbols-outlined text-electric-cyan">water_drop</span>
<span className="font-label-bold text-sm">Experience the Magic</span>
</div>
</div>
</div>

<svg className="wave-svg" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
<path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
</svg>
</section>

<section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background relative">

<div className="md:hidden absolute inset-0 -z-10">
<img alt="Mobile Hero" className="w-full h-1/3 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwa1CnH9Pzvtiza_g9WIXaq7O8teYe46CgqFFLM8l4Ms8-xZUYX7ZtkZ0pI1rtpVbCgVgVa6d3bfBychRf0vCHNPTyFvRUNePQAAOcEpmHY2BUE5mcUoVLsyeQYjDlkMBBcFQwKm3bVnwxgjAm3XNaAV5OyoL8DtiKV-WXE3DG5RnCmaGSOArlT_aqRdEqINJyN6JQRkF-RsRrpgCzifDOa_VIkJ5bVA0mvbCWFj5rn4B7xs-pwa1NMgz0iOZDqz3viFF11zHfoQ" />
<div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-background"></div>
</div>
<div className="w-full max-w-md bg-surface-container-lowest p-8 md:p-12 rounded-3xl underwater-shadow border border-outline-variant/30 animate-in fade-in slide-in-from-bottom-4 duration-700">
<div className="text-center mb-10">
<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container text-on-primary-container mb-4">
<span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary">AquaPulse</h2>
<p className="font-body-md text-on-surface-variant mt-2">Sign in to your management account</p>
</div>
<form className="space-y-6" onSubmit={(event) => event.preventDefault()}>

<div className="space-y-2">
<label className="block font-label-bold text-sm text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
<div className="relative">
<span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">mail</span>
<input className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all outline-none text-on-surface" id="email" placeholder="name@aquashow.com" type="email" />
</div>
</div>

<div className="space-y-2">
<div className="flex justify-between items-center px-1">
<label className="block font-label-bold text-sm text-on-surface-variant" htmlFor="password">Password</label>
<a className="text-sm font-label-bold text-deep-aqua hover:text-primary transition-colors" href="#">Forgot password?</a>
</div>
<div className="relative">
<span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">lock</span>
<input className="w-full pl-12 pr-12 py-4 bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all outline-none text-on-surface" id="password" placeholder="••••••••" type="password" />
<button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" onClick={() => {}} type="button">
<span className="material-symbols-outlined" id="eye-icon">visibility</span>
</button>
</div>
</div>

<div className="flex items-center gap-3 px-1">
<div className="relative flex items-center">
<input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer" id="remember" type="checkbox" />
</div>
<label className="text-sm font-body-md text-on-surface-variant cursor-pointer" htmlFor="remember">Remember me for 30 days</label>
</div>

<div className="pt-2 space-y-4">
<button className="w-full bg-vin-orange hover:bg-tertiary text-white font-button py-4 rounded-full shadow-lg shadow-vin-orange/20 hover:shadow-vin-orange/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300" type="submit">
                            Sign In
                        </button>
<div className="relative flex items-center py-2">
<div className="flex-grow border-t border-outline-variant"></div>
<span className="flex-shrink mx-4 text-sm text-outline font-body-md">or</span>
<div className="flex-grow border-t border-outline-variant"></div>
</div>
<button className="w-full flex items-center justify-center gap-3 bg-surface-container-highest hover:bg-surface-variant text-on-surface font-button py-4 rounded-full border border-outline-variant/30 transition-all" type="button">
<svg className="w-5 h-5" viewBox="0 0 24 24">
<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
</svg>
                            Continue with Google
                        </button>
</div>
</form>
<div className="mt-10 text-center">
<p className="font-body-md text-on-surface-variant">
                        Don't have an account?
                        <a className="font-label-bold text-primary hover:underline decoration-2 underline-offset-4 ml-1 transition-all" href="#">Register</a>
</p>
</div>
</div>
</section>
</main>
    </div>
  );
}
