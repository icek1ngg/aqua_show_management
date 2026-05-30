export default function RegisterPage() {
  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <style>{`.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .underwater-shadow {
            box-shadow: 0px 20px 48px rgba(0, 0, 0, 0.1);
        }

        /* New Dynamic Bubble Styles */
        .dynamic-bubble {
            position: absolute;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(0, 255, 255, 0.2));
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            backdrop-filter: blur(1px);
            z-index: 5;
            bottom: -50px;
            animation: float-up var(--duration) linear infinite;
        }

        @keyframes float-up {
            0% {
                transform: translateY(0) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: var(--max-opacity);
            }
            100% {
                transform: translateY(-110vh) translateX(var(--sway));
                opacity: 0;
            }
        }

        .wave-container {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230099ff' fill-opacity='1' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
            mask-size: cover;
            mask-repeat: no-repeat;
            mask-position: bottom;
        }`}</style>
<main className="flex flex-col md:flex-row min-h-screen w-full">

<section className="relative w-full md:w-[45%] lg:w-[40%] bg-primary overflow-hidden flex flex-col justify-center p-margin-mobile md:p-16 text-white min-h-[400px] md:min-h-screen" id="hero-panel">

<div className="absolute inset-0 z-0">
<img alt="Immersive water show" className="w-full h-full object-cover opacity-60 mix-blend-overlay" src="https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA" />
<div className="absolute inset-0 bg-gradient-to-br from-primary via-deep-aqua/40 to-transparent"></div>
</div>

<div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden" id="bubble-container"><div className="dynamic-bubble" style={{ width: "13px", height: "13px", left: "70.584%", "--duration": "12.345008147442247s", "--sway": "-36.08547100259399px", "--max-opacity": "0.50", animationDelay: "8.04347s" }}></div><div className="dynamic-bubble" style={{ width: "19px", height: "19px", left: "33.5765%", "--duration": "13.064274322096239s", "--sway": "-17.95216978791163px", "--max-opacity": "0.50", animationDelay: "9.50181s" }}></div><div className="dynamic-bubble" style={{ width: "14px", height: "14px", left: "61.0009%", "--duration": "12.423491202737583s", "--sway": "26.763998409775866px", "--max-opacity": "0.45", animationDelay: "7.45153s" }}></div><div className="dynamic-bubble" style={{ width: "18px", height: "18px", left: "75.4034%", "--duration": "10.526332080802087s", "--sway": "43.87447560399555px", "--max-opacity": "0.53", animationDelay: "0.417533s" }}></div><div className="dynamic-bubble" style={{ width: "16px", height: "16px", left: "52.9931%", "--duration": "12.660956245210254s", "--sway": "11.884618812836102px", "--max-opacity": "0.39", animationDelay: "0.77111s" }}></div><div className="dynamic-bubble" style={{ width: "17px", height: "17px", left: "48.5591%", "--duration": "14.791410203890688s", "--sway": "45.79321834251074px", "--max-opacity": "0.26", animationDelay: "7.3357s" }}></div><div className="dynamic-bubble" style={{ width: "23px", height: "23px", left: "23.7084%", "--duration": "6.630377387506989s", "--sway": "-2.4776090555572168px", "--max-opacity": "0.54", animationDelay: "3.22463s" }}></div><div className="dynamic-bubble" style={{ width: "11px", height: "11px", left: "56.985%", "--duration": "14.260807205935436s", "--sway": "16.533588921229537px", "--max-opacity": "0.23", animationDelay: "6.08483s" }}></div><div className="dynamic-bubble" style={{ width: "18px", height: "18px", left: "44.8561%", "--duration": "10.206488618038945s", "--sway": "-29.15106155196272px", "--max-opacity": "0.55", animationDelay: "3.31377s" }}></div><div className="dynamic-bubble" style={{ width: "29px", height: "29px", left: "99.0453%", "--duration": "13.98037747355634s", "--sway": "-1.3694448298378035px", "--max-opacity": "0.44", animationDelay: "3.65023s" }}></div><div className="dynamic-bubble" style={{ width: "29px", height: "29px", left: "63.3539%", "--duration": "13.34062703743344s", "--sway": "-24.091621560218147px", "--max-opacity": "0.23", animationDelay: "9.06799s" }}></div><div className="dynamic-bubble" style={{ width: "22px", height: "22px", left: "12.7101%", "--duration": "13.149995281939086s", "--sway": "13.847618337372268px", "--max-opacity": "0.53", animationDelay: "3.2595s" }}></div><div className="dynamic-bubble" style={{ width: "16px", height: "16px", left: "69.3627%", "--duration": "13.187479250143083s", "--sway": "-43.255470015727425px", "--max-opacity": "0.47", animationDelay: "3.28925s" }}></div><div className="dynamic-bubble" style={{ width: "27px", height: "27px", left: "9.73098%", "--duration": "10.103652264460493s", "--sway": "18.960977638219788px", "--max-opacity": "0.42", animationDelay: "2.72138s" }}></div><div className="dynamic-bubble" style={{ width: "29px", height: "29px", left: "42.1361%", "--duration": "13.157115704250224s", "--sway": "24.62208438736853px", "--max-opacity": "0.24", animationDelay: "2.70232s" }}></div><div className="dynamic-bubble" style={{ width: "29px", height: "29px", left: "88.5064%", "--duration": "12.555258270475946s", "--sway": "-0.4629506101547207px", "--max-opacity": "0.53", animationDelay: "6.82981s" }}></div><div className="dynamic-bubble" style={{ width: "26px", height: "26px", left: "29.9333%", "--duration": "6.114832915123146s", "--sway": "0.8096742437208562px", "--max-opacity": "0.24", animationDelay: "9.29901s" }}></div><div className="dynamic-bubble" style={{ width: "12px", height: "12px", left: "21.4636%", "--duration": "12.73160159124974s", "--sway": "-37.29876119185257px", "--max-opacity": "0.30", animationDelay: "2.7352s" }}></div><div className="dynamic-bubble" style={{ width: "23px", height: "23px", left: "53.0958%", "--duration": "13.149949860674802s", "--sway": "48.33587164241186px", "--max-opacity": "0.20", animationDelay: "8.27593s" }}></div><div className="dynamic-bubble" style={{ width: "20px", height: "20px", left: "64.3953%", "--duration": "14.450740151496127s", "--sway": "-27.793343100263122px", "--max-opacity": "0.42", animationDelay: "3.2372s" }}></div><div className="dynamic-bubble" style={{ width: "17px", height: "17px", left: "9.34834%", "--duration": "11.563744944446526s", "--sway": "-4.945827487979116px", "--max-opacity": "0.38", animationDelay: "3.51068s" }}></div><div className="dynamic-bubble" style={{ width: "25px", height: "25px", left: "40.8762%", "--duration": "14.648155865926505s", "--sway": "-30.387791318268242px", "--max-opacity": "0.49", animationDelay: "1.87304s" }}></div><div className="dynamic-bubble" style={{ width: "21px", height: "21px", left: "95.7463%", "--duration": "9.472341726268885s", "--sway": "21.433028776620006px", "--max-opacity": "0.27", animationDelay: "2.7429s" }}></div><div className="dynamic-bubble" style={{ width: "28px", height: "28px", left: "31.029%", "--duration": "12.937239209104364s", "--sway": "16.99092568628261px", "--max-opacity": "0.24", animationDelay: "6.22987s" }}></div><div className="dynamic-bubble" style={{ width: "20px", height: "20px", left: "66.7258%", "--duration": "8.54153069585217s", "--sway": "-20.94803050727667px", "--max-opacity": "0.60", animationDelay: "8.7015s" }}></div><div className="dynamic-bubble" style={{ width: "24px", height: "24px", left: "35.1054%", "--duration": "12.955429191964924s", "--sway": "-35.357766378339015px", "--max-opacity": "0.33", animationDelay: "2.32783s" }}></div><div className="dynamic-bubble" style={{ width: "22px", height: "22px", left: "81.3877%", "--duration": "9.991176574963808s", "--sway": "-40.59737066301939px", "--max-opacity": "0.38", animationDelay: "4.52239s" }}></div><div className="dynamic-bubble" style={{ width: "20px", height: "20px", left: "65.2525%", "--duration": "13.78244536044688s", "--sway": "-3.8371466024487404px", "--max-opacity": "0.42", animationDelay: "9.14379s" }}></div><div className="dynamic-bubble" style={{ width: "18px", height: "18px", left: "66.9739%", "--duration": "11.221873628777821s", "--sway": "47.08958616678483px", "--max-opacity": "0.35", animationDelay: "4.90178s" }}></div><div className="dynamic-bubble" style={{ width: "21px", height: "21px", left: "91.2418%", "--duration": "9.363550832278754s", "--sway": "31.650243314046577px", "--max-opacity": "0.34", animationDelay: "8.16776s" }}></div><div className="dynamic-bubble" style={{ width: "14px", height: "14px", left: "80.0766%", "--duration": "13.374408424175439s", "--sway": "5.605078128543454px", "--max-opacity": "0.38", animationDelay: "7.50833s" }}></div><div className="dynamic-bubble" style={{ width: "19px", height: "19px", left: "11.4809%", "--duration": "13.319561941494605s", "--sway": "-18.2618382646583px", "--max-opacity": "0.33", animationDelay: "8.10442s" }}></div><div className="dynamic-bubble" style={{ width: "10px", height: "10px", left: "93.3073%", "--duration": "13.193807854719221s", "--sway": "-17.62825056134684px", "--max-opacity": "0.50", animationDelay: "3.80033s" }}></div><div className="dynamic-bubble" style={{ width: "18px", height: "18px", left: "4.85312%", "--duration": "9.168581445532459s", "--sway": "-11.18327091715345px", "--max-opacity": "0.34", animationDelay: "0.195674s" }}></div><div className="dynamic-bubble" style={{ width: "15px", height: "15px", left: "69.8785%", "--duration": "13.194361232737755s", "--sway": "27.83044362989297px", "--max-opacity": "0.48", animationDelay: "3.32805s" }}></div><div className="dynamic-bubble" style={{ width: "19px", height: "19px", left: "49.3128%", "--duration": "10.318611514994977s", "--sway": "-29.319134137025404px", "--max-opacity": "0.23", animationDelay: "4.27657s" }}></div></div>

<div className="relative z-10 space-y-8">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-4xl" data-weight="fill">waves</span>
<h2 className="font-display-lg text-headline-md tracking-tight">AquaPulse</h2>
</div>
<div className="space-y-4">
<h1 className="font-display-lg text-display-lg-mobile md:text-display-lg leading-tight">Create Your AquaShow Account</h1>
<p className="font-body-lg text-white/80 max-w-md">Experience the magic of synchronized water and light like never before. Join the pulse of entertainment.</p>
</div>
<div className="flex flex-col gap-4 pt-4">
<div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 w-fit transform hover:scale-105 transition-all">
<div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-on-secondary-container">star</span>
</div>
<span className="font-label-bold text-label-bold">Access Exclusive Shows</span>
</div>
<div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 w-fit transform hover:scale-105 transition-all">
<div className="w-10 h-10 rounded-full bg-electric-cyan flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary-fixed">schedule</span>
</div>
<span className="font-label-bold text-label-bold">Priority Booking</span>
</div>
</div>
</div>

<div className="absolute bottom-0 left-0 w-full h-24 bg-background wave-container md:hidden"></div>
<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-[15]"><svg className="relative block w-full h-[60px] md:h-[100px]" data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg"><path d="M321.39,26.44c58-5.79,114.16-10.13,172-15.86,82.39-8.72,168.19-9.73,250.45-0.39C823.78,16,906.67,32,985.66,42.83c70.05,9.48,146.53,16.09,214.34,3V120H0V0C49.1,6,103.24,14.8,156.48,18.24,217.66,22.61,263.81,32.11,321.39,26.44Z" fill="#ffffff"></path></svg></div></section>

<section className="flex-1 flex flex-col items-center justify-center p-margin-mobile md:p-12 lg:p-24 bg-surface">
<div className="w-full max-w-[540px] bg-white dark:bg-surface-container-lowest p-8 md:p-12 rounded-lg shadow-[0px_4px_20px_rgba(0,206,209,0.08)]">
<header className="mb-10">
<h2 className="font-headline-lg text-headline-lg text-on-background">Get Started</h2>
<p className="font-body-md text-on-surface-variant mt-2">Enter your details to create an account.</p>
</header>
<form className="space-y-6" onSubmit={(event) => event.preventDefault()}>

<div className="space-y-2">
<label className="font-label-bold text-label-bold text-on-surface-variant block" htmlFor="name">Full Name</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
<input className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md transition-all" id="name" placeholder="John Doe" type="text" />
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div className="space-y-2">
<label className="font-label-bold text-label-bold text-on-surface-variant block" htmlFor="email">Email Address</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
<input className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md transition-all" id="email" placeholder="john@example.com" type="email" />
</div>
</div>

<div className="space-y-2">
<label className="font-label-bold text-label-bold text-on-surface-variant block" htmlFor="phone">Phone Number</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">call</span>
<input className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md transition-all" id="phone" placeholder="0123456789" type="tel" />
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="space-y-2">
<label className="font-label-bold text-label-bold text-on-surface-variant block" htmlFor="password">Password</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
<input className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md transition-all" id="password" placeholder="••••••••" type="password" />
</div>
</div>
<div className="space-y-2">
<label className="font-label-bold text-label-bold text-on-surface-variant block" htmlFor="confirm-password">Confirm Password</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">verified_user</span>
<input className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-md transition-all" id="confirm-password" placeholder="••••••••" type="password" />
</div>
</div>
</div>

<div className="flex items-center gap-3 py-2">
<input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" id="terms" type="checkbox" />
<label className="font-body-md text-on-surface-variant text-sm" htmlFor="terms">
                            I agree to the <a className="text-primary hover:underline font-label-bold" href="#">Terms and Conditions</a> and <a className="text-primary hover:underline font-label-bold" href="#">Privacy Policy</a>.
                        </label>
</div>

<div className="space-y-4">
<button className="w-full bg-tertiary-container hover:bg-tertiary text-on-tertiary-container hover:text-on-tertiary font-button text-button py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2" type="submit">
                            Create Account
                            <span className="material-symbols-outlined">arrow_forward</span>
</button>
</div>
<footer className="text-center pt-6">
<p className="font-body-md text-on-surface-variant">
                            Already have an account?
                            <a className="text-primary font-label-bold hover:underline" href="#">Sign In</a>
</p>
</footer>
</form>
</div>
</section>
</main>
    </div>
  );
}
