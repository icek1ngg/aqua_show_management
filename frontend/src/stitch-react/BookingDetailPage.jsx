export default function BookingDetailPage() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <style>{`body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .underwater-shadow {
            box-shadow: 0px 12px 32px rgba(0, 105, 107, 0.08);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(16px);
        }
        .wave-container {
            position: relative;
            background: linear-gradient(135deg, #00696b 0%, #008B8B 100%);
            overflow: hidden;
        }
        .bubble {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            pointer-events: none;
        }`}</style>
<nav className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm">
  <div className="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
    <div className="flex items-center gap-10">
      <span className="font-display-lg text-headline-md text-primary tracking-tight">AquaPulse</span>
      <div className="hidden md:flex gap-8 items-center">
        <a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Home</a>
        <a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Shows</a>
        <a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Schedules</a>
        <a className="font-button text-button text-primary border-b-2 border-primary pb-1" href="#">My Bookings</a>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <button className="hidden md:block font-button text-button text-primary">Book Now</button>
      <div className="h-10 w-10 rounded-full bg-surface-container-highest flex items-center justify-center cursor-pointer overflow-hidden">
        <span className="material-symbols-outlined text-on-surface">account_circle</span>
      </div>
    </div>
  </div>
</nav>

<main className="flex-grow">

<header className="wave-container py-16 px-gutter relative">
<div className="max-w-container-max mx-auto relative z-10">
<h1 className="font-display-lg text-display-lg-mobile text-white mb-3">Booking Detail</h1>
<p className="font-body-lg text-white/90 max-w-2xl">Review your AquaShow reservation, schedule, payment status, and booking information.</p>
</div>

<div className="bubble w-32 h-32 -bottom-8 -left-8 opacity-20"></div>
<div className="bubble w-24 h-24 top-4 right-1/4 opacity-10"></div>

<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
<svg className="relative block w-[calc(100%+1.3px)] h-[40px] fill-background" preserveAspectRatio="none" viewBox="0 0 1200 120">
<path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
</svg>
</div>
</header>
<div className="max-w-container-max mx-auto px-gutter py-margin-desktop" id="booking-container">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

<div className="lg:col-span-8 space-y-gutter">

<div className="bg-surface-container-lowest rounded-lg p-8 underwater-shadow border border-outline-variant/30">
<div className="flex flex-wrap justify-between items-start gap-4 mb-8">
<div>
<span className="font-label-bold text-on-surface-variant uppercase tracking-widest text-[11px]">Booking Reference</span>
<h2 className="font-headline-md text-charcoal-text mt-1">#AQ-882190</h2>
<div className="flex items-center gap-2 mt-3 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="calendar_today">calendar_today</span>
<span className="font-label-bold text-xs">Placed on Oct 20, 2024</span>
</div>
</div>
<div className="flex gap-3">
<span className="bg-primary text-white font-label-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">Paid</span>
<span className="bg-secondary-container text-on-secondary-container font-label-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">Success</span>
</div>
</div>
<div className="flex items-start gap-4 p-5 bg-surface-container-low rounded-lg border border-primary/10">
<span className="material-symbols-outlined text-primary mt-0.5" data-icon="verified">verified</span>
<p className="font-body-md text-on-surface-variant">Your reservation is confirmed! We look forward to seeing you at the show. Please arrive at least 15 minutes before the start time.</p>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg overflow-hidden underwater-shadow border border-outline-variant/30">
<div className="aspect-video lg:h-80 overflow-hidden relative group">
<img alt="Midnight Aqua Symphony" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA" />
<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
<div className="absolute bottom-6 left-8">
<span className="bg-vin-orange text-white font-headline-md px-5 py-2 rounded-lg shadow-xl">$39.00</span>
</div>
</div>
<div className="p-8">
<div className="flex items-center gap-3 mb-4">
<span className="bg-primary-container text-on-primary-container font-label-bold text-xs px-3 py-1 rounded-full">Water Show</span>
<span className="bg-surface-container-high text-on-surface-variant font-label-bold text-xs px-3 py-1 rounded-full">45 Minutes</span>
</div>
<h3 className="font-headline-lg text-charcoal-text mb-4">Midnight Aqua Symphony</h3>
<p className="font-body-md text-on-surface-variant mb-8 leading-relaxed max-w-3xl">A breathtaking fusion of choreographed fountains, lasers, and cinematic music. Experience the magic of liquid art under the moonlight.</p>
<div className="grid grid-cols-1 md:grid-cols-2 gap-gutter border-t border-surface-variant/30 pt-8">
<div className="flex items-start gap-4">
<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-primary text-xl" data-icon="location_on">location_on</span>
</div>
<div>
<span className="block font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">Venue</span>
<span className="font-body-lg font-bold text-charcoal-text">Main Plaza Pool</span>
</div>
</div>
<div className="flex items-start gap-4">
<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-primary text-xl" data-icon="schedule">schedule</span>
</div>
<div>
<span className="block font-label-bold text-xs text-on-surface-variant uppercase tracking-wider">Schedule</span>
<span className="font-body-lg font-bold text-charcoal-text">Oct 24, 2024</span>
<span className="block text-sm text-on-surface-variant mt-0.5">8:00 PM - 8:45 PM</span>
</div>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg p-8 underwater-shadow border border-outline-variant/30">
<h4 className="font-headline-md text-charcoal-text mb-10">Booking Journey</h4>
<div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4">

<div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-surface-container-highest z-0"></div>

<div className="flex md:flex-col items-center gap-4 z-10 w-full md:w-1/4">
<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0 border-4 border-surface-container-lowest">
<span className="material-symbols-outlined text-xl" data-icon="check">check</span>
</div>
<div className="md:text-center">
<span className="block font-label-bold text-charcoal-text text-sm">Booking Created</span>
<span className="text-[11px] text-on-surface-variant">Oct 20, 10:30 AM</span>
</div>
</div>
<div className="flex md:flex-col items-center gap-4 z-10 w-full md:w-1/4">
<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0 border-4 border-surface-container-lowest">
<span className="material-symbols-outlined text-xl" data-icon="check">check</span>
</div>
<div className="md:text-center">
<span className="block font-label-bold text-charcoal-text text-sm">Waiting for Payment</span>
<span className="text-[11px] text-on-surface-variant">Oct 20, 10:32 AM</span>
</div>
</div>
<div className="flex md:flex-col items-center gap-4 z-10 w-full md:w-1/4">
<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0 border-4 border-surface-container-lowest shadow-lg shadow-primary/20">
<span className="material-symbols-outlined text-xl" data-icon="payments">payments</span>
</div>
<div className="md:text-center">
<span className="block font-label-bold text-charcoal-text text-sm">Payment Completed</span>
<span className="text-[11px] text-on-surface-variant">Oct 20, 10:35 AM</span>
</div>
</div>
<div className="flex md:flex-col items-center gap-4 z-10 w-full md:w-1/4">
<div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0 border-4 border-surface-container-lowest">
<span className="material-symbols-outlined text-xl" data-icon="qr_code_2">qr_code_2</span>
</div>
<div className="md:text-center">
<span className="block font-label-bold text-charcoal-text text-sm">Ticket Ready</span>
<span className="text-[11px] text-on-surface-variant">Available Now</span>
</div>
</div>
</div>
</div>
</div>

<div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

<div className="bg-surface-container-lowest rounded-lg p-6 underwater-shadow border border-outline-variant/30">
<h4 className="font-headline-md text-charcoal-text mb-6">Order Summary</h4>
<div className="space-y-4">
<div className="flex justify-between items-center">
<span className="font-body-md text-on-surface-variant">4x Adult Tickets</span>
<span className="font-body-md font-bold text-charcoal-text">$156.00</span>
</div>
<div className="flex justify-between items-center text-sm">
<span className="text-on-surface-variant">Subtotal</span>
<span className="text-charcoal-text">$156.00</span>
</div>
<div className="flex justify-between items-center text-sm">
<span className="text-on-surface-variant">Processing Fee</span>
<span className="text-primary font-bold">FREE</span>
</div>
<div className="pt-6 border-t border-surface-variant/30 mt-6">
<div className="flex justify-between items-end">
<span className="font-label-bold text-on-surface-variant uppercase text-xs tracking-wider">Total Paid</span>
<span className="font-headline-md text-primary">$156.00</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg p-6 underwater-shadow border border-outline-variant/30">
<h4 className="font-label-bold text-on-surface-variant uppercase tracking-widest text-[11px] mb-4">Payment Information</h4>
<div className="space-y-4">
<div className="flex items-center justify-between">
<span className="text-xs text-on-surface-variant">Method</span>
<span className="font-bold text-xs text-charcoal-text">Credit / Debit Card</span>
</div>
<div className="flex items-center justify-between">
<span className="text-xs text-on-surface-variant">Gateway</span>
<span className="bg-surface-container-high px-2.5 py-0.5 rounded text-[10px] font-bold text-on-surface uppercase tracking-tight">PayOS</span>
</div>
<div className="flex items-center justify-between pt-2 border-t border-dashed border-surface-variant">
<span className="text-xs text-on-surface-variant">Transaction ID</span>
<span className="text-xs font-mono text-on-surface-variant">TRX-771290-ASMS</span>
</div>
</div>
</div>

<div className="flex flex-col gap-3">
<button className="w-full bg-primary text-white font-button py-4 rounded-full shadow-lg shadow-primary/20 hover:bg-deep-aqua transition-all active:scale-[0.98] flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-xl" data-icon="arrow_back">arrow_back</span>
                            Back to My Bookings
                        </button>
<button className="w-full bg-white text-primary border-2 border-primary/20 font-button py-4 rounded-full hover:bg-primary/5 hover:border-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-xl" data-icon="explore">explore</span>
                            Explore More Shows
                        </button>
</div>
</div>
</div>
</div>
</main>

<footer className="bg-surface-container-low">
  <div className="max-w-[1280px] mx-auto px-margin-desktop py-12 flex flex-col items-center gap-8">
    <div className="flex flex-col items-center gap-4">
      <span className="font-headline-md text-headline-md font-bold text-primary">AquaPulse</span>
      <p className="font-body-md text-body-md text-on-surface-variant">© 2024 AquaPulse. Making every splash count.</p>
    </div>
    <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2">
      <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Terms of Service</a>
      <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</a>
      <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Park Rules</a>
      <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Contact Us</a>
    </nav>
  </div>
</footer>
    </div>
  );
}
