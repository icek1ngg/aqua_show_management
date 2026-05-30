export default function CreateBookingPage() {
  return (
    <div className="bg-surface font-body-md text-on-surface">
      <style>{`.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .underwater-shadow {
            box-shadow: 0px 12px 32px rgba(0, 105, 107, 0.1);
        }
        .glass-nav {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .wave-bg {
            background: linear-gradient(135deg, #00696b 0%, #00ced1 100%);
            position: relative;
            overflow: hidden;
        }
        .bubble {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            pointer-events: none;
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }`}</style>
<header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm">
  <div className="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
    <div className="font-display-lg text-headline-md text-primary tracking-tight flex items-center gap-2">
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
      AquaPulse
    </div>
    <nav className="hidden md:flex items-center gap-8">
      <a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Home</a>
      <a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Shows</a>
      <a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Schedules</a>
      <a className="font-button text-button text-primary border-b-2 border-primary pb-1" href="#">My Bookings</a>
    </nav>
    <div className="flex items-center gap-4">
      <button className="hidden md:block bg-primary text-on-primary px-6 py-2 rounded-full font-button hover:bg-primary-container hover:text-on-primary-container transition-all">Book Now</button>
      <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/20">
        <img alt="User Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8Ktsr2eh2zseRpqmcWc1jQ2IUGLAARYiIysbobKUntDOh1nfDEifzPo42cD1xCI3T5oWurk7H1oKkKP_l2LrvMSTbQqGTFw60SUPYoNNMIv3gfUV3GqpU11JvrHJJDZgeCC_B5r0q8iYCRft-Kxz2bcJz_sWISuXeYsix-dHPCFCu7EefAYCNtuwQt1sSeMzD1LYvsG6zg6WcWlfRAxuW6RJDQt2u2lZ8PPXPaVPdz65gIS2xSH4QbYVkuUlpX6vy3tt5-fusYw" />
      </div>
      <button className="md:hidden text-on-surface-variant">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </div>
  </div>
</header>
<main className="pt-20">

<section className="wave-bg py-12 md:py-20">
<div className="bubble w-16 h-16 top-10 left-[10%] opacity-20 animate-float"></div>
<div className="bubble w-24 h-24 bottom-10 right-[15%] opacity-10 animate-float" style={{ animationDelay: "-2s" }}></div>
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
<h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary mb-2">Create Booking</h1>
<p className="font-body-lg text-body-lg text-soft-turquoise max-w-2xl">Secure your front-row seat to an aquatic masterpiece. Reserve your spot for an unforgettable experience.</p>
</div>

<div className="absolute bottom-0 left-0 w-full leading-none">
<svg className="relative block w-full h-[40px]" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
<path className="fill-surface" d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.31,34.54,121.57,56.09,190.72,64.31,235.15,69.59,279,64.29,321.39,56.44Z"></path>
</svg>
</div>
</section>

<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

<div className="lg:col-span-8 space-y-gutter">

<article className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/30 underwater-shadow">
<div className="relative h-64 md:h-96">
<img alt="Symphony of Lights" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQJ-Fo4HDO72JbLax0CiFqctWCGXvU4YEfKNT6BKoii53LhvXYm3tK9deyNpu3SQhQuDwXH4brHWFob4XTMXC0igb1FTIelijgurjSK40wqc_V-h4hB2iXApJSw4tuIL9RRKwcdhGhhcgV9V5pOtwPQGvlVc5CRVwmmWl5xWGLSkDEXdqrpRF327LZc7RzHHIIOK5u5seDmxx49urrFLxksqEEDJ5_xPJn8EULd2-53B3FmPiCpcXrt3oMMoWR8T3lZdXTQe3xXQ" />
<div className="absolute top-4 left-4 flex gap-2">
<span className="bg-primary/90 text-on-primary px-3 py-1 rounded-full text-label-bold font-label-bold backdrop-blur-md">Water Show</span>
<span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-bold font-label-bold backdrop-blur-md flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    Popular
                                </span>
</div>
</div>
<div className="p-gutter">
<h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Symphony of Lights</h2>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                                Witness the world's most advanced synchronized water performance.
                                A breathtaking choreography of 50-foot water jets, 4K laser projections,
                                and an orchestral soundtrack that will leave you spellbound.
                            </p>
</div>
</article>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="bg-surface-container-low rounded-lg p-6 flex items-start gap-4 border border-outline-variant/20">
<div className="bg-primary-container p-3 rounded-full text-on-primary-container">
<span className="material-symbols-outlined">calendar_today</span>
</div>
<div>
<p className="text-on-surface-variant text-label-bold font-label-bold uppercase tracking-wider mb-1 text-[12px]">Date &amp; Time</p>
<p className="font-headline-md text-headline-md text-on-surface">Oct 24, 2024</p>
<p className="text-on-surface-variant font-body-md">08:00 PM - 09:30 PM</p>
</div>
</div>
<div className="bg-surface-container-low rounded-lg p-6 flex items-start gap-4 border border-outline-variant/20">
<div className="bg-primary-container p-3 rounded-full text-on-primary-container">
<span className="material-symbols-outlined">location_on</span>
</div>
<div>
<p className="text-on-surface-variant text-label-bold font-label-bold uppercase tracking-wider mb-1 text-[12px]">Venue</p>
<p className="font-headline-md text-headline-md text-on-surface">Aqua Plaza</p>
<div className="flex items-center gap-2 mt-1">
<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span className="text-primary font-label-bold text-sm">Available Now</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg p-gutter border border-outline-variant/30 underwater-shadow">
<div className="flex flex-col md:flex-row justify-between items-center gap-6">
<div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-1">General Admission</h3>
<p className="text-on-surface-variant">Includes standard seating and digital show guide.</p>
<p className="text-primary font-bold mt-2 text-headline-md">$45.00 <span className="text-body-md font-normal text-on-surface-variant">/ ticket</span></p>
</div>
<div className="flex flex-col items-center gap-2">
<div className="flex items-center bg-surface-container rounded-full p-2 border-2 border-primary-container/30">
<button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary transition-all shadow-sm" onClick={() => {}}>
<span className="material-symbols-outlined">remove</span>
</button>
<span className="w-12 text-center font-headline-md text-headline-md text-on-surface" id="qty-display">1</span>
<button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary transition-all shadow-sm" onClick={() => {}}>
<span className="material-symbols-outlined">add</span>
</button>
</div>
<p className="text-on-surface-variant text-xs italic">Max 10 tickets per booking</p>
</div>
</div>
</div>
</div>

<aside className="lg:col-span-4">
<div className="sticky top-28 space-y-6">
<div className="bg-surface-container-lowest rounded-lg p-gutter border border-outline-variant/30 underwater-shadow relative overflow-hidden">

<div className="absolute top-0 right-0 opacity-5 -mr-8 -mt-8 pointer-events-none">
<span className="material-symbols-outlined text-[140px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-6 relative z-10">Booking Summary</h3>
<div className="space-y-4 mb-8 relative z-10">
<div className="flex justify-between items-start">
<div>
<p className="font-label-bold text-on-surface">Symphony of Lights</p>
<p className="text-sm text-on-surface-variant">Oct 24, 08:00 PM</p>
</div>
<p className="font-label-bold text-on-surface">$45.00</p>
</div>
<div className="flex justify-between items-center py-4 border-y border-outline-variant/30">
<p className="text-on-surface-variant">Quantity</p>
<p className="font-label-bold text-on-surface" id="summary-qty">1</p>
</div>
<div className="flex justify-between items-center">
<p className="font-headline-md text-headline-md text-primary">Total Amount</p>
<p className="font-headline-md text-headline-md text-primary" id="summary-total">$45.00</p>
</div>
</div>
<div className="space-y-4 mb-8 relative z-10">
<div className="flex gap-3 p-4 bg-primary/5 rounded-lg text-primary text-sm">
<span className="material-symbols-outlined text-primary text-sm">info</span>
<p className="">Tickets are held for 15 minutes until payment is confirmed.</p>
</div>
<div className="flex gap-2 text-on-surface-variant text-sm px-1 items-center">
<span className="material-symbols-outlined text-primary-container text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
<p className="">Secure checkout powered by AquaPay</p>
</div>
</div>
<div className="space-y-4 relative z-10">
<button className="w-full bg-primary text-on-primary py-4 rounded-full font-button text-lg hover:bg-primary-container hover:text-on-primary-container transition-all shadow-lg shadow-primary/10" onClick={() => {}}>
                                    Confirm Booking
                                </button>
<a className="block text-center text-primary font-button hover:underline text-sm" href="#">Back to Schedules</a>
</div>
</div>

<div className="hidden bg-secondary-container rounded-lg p-6 border-2 border-secondary animate-bounce" id="success-alert">
<div className="flex items-start gap-4">
<div className="bg-secondary text-on-secondary p-2 rounded-full">
<span className="material-symbols-outlined">check_circle</span>
</div>
<div>
<p className="font-label-bold text-on-secondary-container">PENDING_PAYMENT</p>
<p className="text-sm text-on-secondary-container/80">Redirecting to payment gateway...</p>
</div>
</div>
</div>
</div>
</aside>
</div>
</div>
</main>

<footer className="bg-surface-container-low w-full">
  <div className="max-w-[1280px] mx-auto px-margin-desktop py-12 flex flex-col items-center gap-8">
    <div className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
      AquaPulse
    </div>
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
      <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
      <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
      <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Park Rules</a>
      <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Us</a>
    </div>
    <p className="font-body-md text-body-md text-on-surface-variant text-center">© 2024 AquaPulse. Making every splash count.</p>
  </div>
</footer>
    </div>
  );
}
