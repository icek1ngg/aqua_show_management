export default function BookingHistoryPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <style>{`body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
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
        /* Custom scrollbar for better look */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #00696b; border-radius: 10px; }`}</style>
<nav className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm">
<div className="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
<div className="font-display-lg text-headline-md text-primary tracking-tight">AquaPulse</div>
<div className="hidden md:flex space-x-8">
<a className="text-on-surface-variant hover:text-primary transition-colors font-button text-button" href="#">Home</a>
<a className="text-on-surface-variant hover:text-primary transition-colors font-button text-button" href="#">Shows</a>
<a className="text-on-surface-variant hover:text-primary transition-colors font-button text-button" href="#">Schedules</a>
<a className="text-primary border-b-2 border-primary pb-1 font-button text-button" href="#">My Bookings</a>
</div>
<div className="flex items-center space-x-4">
<button className="px-6 py-2 rounded-full bg-primary text-white font-button text-button">Book Now</button>
<div className="flex items-center space-x-2 pl-4">
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold overflow-hidden">
<span className="material-symbols-outlined">account_circle</span>
</div>
<span className="font-button text-button hidden lg:block">Profile</span>
</div>
</div>
</div>
</nav>
<main className="flex-grow pt-16">

<header className="wave-bg pt-16 pb-20 px-margin-desktop overflow-visible">
<div className="max-w-container-max mx-auto relative z-10">
<h1 className="font-display-lg text-display-lg text-white mb-2">My Bookings</h1>
<p className="font-body-lg text-body-lg text-white/90 max-w-2xl">Track your AquaShow reservations, payment status, and upcoming show plans.</p>
</div>

<div className="bubble w-32 h-32 -top-10 -right-10"></div>
<div className="bubble w-20 h-20 bottom-10 right-40 opacity-50"></div>

<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
<svg className="relative block w-full h-12 fill-surface" preserveAspectRatio="none" viewBox="0 0 1200 120">
<path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C47.45,21.9,111.45,34.09,165.1,43.35,224.78,53.64,263.38,58.62,321.39,56.44Z"></path>
</svg>
</div>
</header>
<div className="max-w-container-max mx-auto px-margin-desktop -mt-12 relative z-20 pb-24">

<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
<div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/30 flex items-center space-x-4 transition-all hover:shadow-md">
<div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined">confirmation_number</span>
</div>
<div>
<p className="font-label-bold text-label-bold text-on-surface-variant">Total Bookings</p>
<h3 className="font-headline-md text-headline-md">12</h3>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/30 flex items-center space-x-4 transition-all hover:shadow-md">
<div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">pending_actions</span>
</div>
<div>
<p className="font-label-bold text-label-bold text-on-surface-variant">Pending Payments</p>
<h3 className="font-headline-md text-headline-md">1</h3>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/30 flex items-center space-x-4 transition-all hover:shadow-md">
<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700">
<span className="material-symbols-outlined">check_circle</span>
</div>
<div>
<p className="font-label-bold text-label-bold text-on-surface-variant">Paid</p>
<h3 className="font-headline-md text-headline-md">8</h3>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/30 flex items-center space-x-4 transition-all hover:shadow-md">
<div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center text-error">
<span className="material-symbols-outlined">cancel</span>
</div>
<div>
<p className="font-label-bold text-label-bold text-on-surface-variant">Expired/Failed</p>
<h3 className="font-headline-md text-headline-md">3</h3>
</div>
</div>
</section>

<section className="bg-surface-container-low p-6 rounded-lg mb-8 shadow-sm">
<div className="flex flex-col lg:flex-row gap-6 items-end">
<div className="flex-1 w-full">
<label className="block font-label-bold text-label-bold text-on-surface-variant mb-2 ml-1">Search Bookings</label>
<div className="relative">
<input className="w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant/50 bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Search by show name or booking ID" type="text" />
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
</div>
</div>
<div className="w-full lg:w-auto">
<label className="block font-label-bold text-label-bold text-on-surface-variant mb-2 ml-1">Status</label>
<div className="flex bg-surface-container-lowest p-1 rounded-full border border-outline-variant/50">
<button className="px-6 py-2 rounded-full bg-primary text-white font-label-bold text-label-bold shadow-sm transition-all">All</button>
<button className="px-6 py-2 rounded-full text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold">Pending</button>
<button className="px-6 py-2 rounded-full text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold">Paid</button>
<button className="px-6 py-2 rounded-full text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold">Past</button>
</div>
</div>
<div className="w-full lg:w-48">
<label className="block font-label-bold text-label-bold text-on-surface-variant mb-2 ml-1">Sort By</label>
<select className="w-full px-4 py-3 rounded-full border border-outline-variant/50 bg-surface-container-lowest focus:ring-2 focus:ring-primary font-label-bold text-label-bold cursor-pointer">
<option>Newest First</option>
<option>Oldest First</option>
<option>Price: High to Low</option>
</select>
</div>
</div>
</section>

<div className="space-y-6">

<div className="group bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6 hover:shadow-md hover:border-primary/30 transition-all">
<div className="w-full md:w-56 h-36 rounded-lg overflow-hidden shrink-0">
<img alt="Midnight Aqua Symphony" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA" />
</div>
<div className="flex-1 flex flex-col justify-between">
<div className="space-y-2">
<div className="flex flex-wrap justify-between items-start gap-4">
<div>
<span className="text-primary font-label-bold text-[12px] uppercase tracking-wider">#AQ-882190</span>
<h4 className="font-headline-md text-headline-md text-on-surface">Midnight Aqua Symphony</h4>
</div>
<div className="flex flex-col items-end">
<span className="px-4 py-1 rounded-full bg-secondary-container/30 text-secondary font-label-bold text-[12px] flex items-center border border-secondary/20">
<span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse"></span>
                                        PENDING PAYMENT
                                    </span>
<p className="text-tertiary font-label-bold text-[12px] mt-2">Expires in <span className="countdown">9:44</span></p>
</div>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Date &amp; Time</p>
<p className="font-body-md text-body-md text-on-surface">Oct 24, 2024 • 20:00</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Venue</p>
<p className="font-body-md text-body-md text-on-surface">Main Plaza Pool</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Tickets</p>
<p className="font-body-md text-body-md text-on-surface">4 Tickets</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Total Amount</p>
<p className="font-label-bold text-headline-md text-primary">$156.00</p>
</div>
</div>
</div>
<div className="flex justify-end space-x-3 pt-4 border-t border-outline-variant/10 mt-4">
<button className="px-6 py-2 rounded-full border border-outline-variant text-on-surface-variant font-button text-button hover:bg-surface-container transition-all">View Detail</button>
<button className="px-8 py-2 rounded-full bg-primary text-white font-button text-button shadow-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all">Continue Payment</button>
</div>
</div>
</div>

<div className="group bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6 hover:shadow-md hover:border-primary/30 transition-all">
<div className="w-full md:w-56 h-36 rounded-lg overflow-hidden shrink-0">
<img alt="Oceanic Dreams 4D" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA" />
</div>
<div className="flex-1 flex flex-col justify-between">
<div className="space-y-2">
<div className="flex flex-wrap justify-between items-start gap-4">
<div>
<span className="text-primary font-label-bold text-[12px] uppercase tracking-wider">#AQ-882145</span>
<h4 className="font-headline-md text-headline-md text-on-surface">Oceanic Dreams 4D</h4>
</div>
<div className="flex flex-col items-end">
<span className="px-4 py-1 rounded-full bg-green-50 text-green-700 font-label-bold text-[12px] flex items-center border border-green-200">
<span className="material-symbols-outlined text-[16px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        PAID
                                    </span>
<div className="mt-2 flex items-center text-primary font-label-bold text-[12px]">
<span className="material-symbols-outlined text-[16px] mr-1">qr_code_2</span>
                                        QR Ticket Ready
                                    </div>
</div>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Date &amp; Time</p>
<p className="font-body-md text-body-md text-on-surface">Oct 20, 2024 • 18:30</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Venue</p>
<p className="font-body-md text-body-md text-on-surface">Grand Amphitheatre</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Tickets</p>
<p className="font-body-md text-body-md text-on-surface">2 Tickets</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Total Amount</p>
<p className="font-label-bold text-headline-md text-primary">$85.00</p>
</div>
</div>
</div>
<div className="flex justify-end space-x-3 pt-4 border-t border-outline-variant/10 mt-4">
<button className="px-6 py-2 rounded-full border border-primary text-primary font-button text-button hover:bg-primary/5 transition-all">View Detail</button>
<button className="px-8 py-2 rounded-full bg-secondary-container text-on-secondary-container font-button text-button shadow-sm hover:scale-[1.02] active:scale-95 transition-all">Download Receipt</button>
</div>
</div>
</div>

<div className="group bg-surface-container-low/50 p-6 rounded-lg border border-outline-variant/30 flex flex-col md:flex-row gap-6 opacity-70 hover:opacity-100 transition-all">
<div className="w-full md:w-56 h-36 rounded-lg overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
<img alt="Tropical Waves Gala" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA" />
</div>
<div className="flex-1 flex flex-col justify-between">
<div className="space-y-2">
<div className="flex flex-wrap justify-between items-start gap-4">
<div>
<span className="text-outline font-label-bold text-[12px] uppercase tracking-wider">#AQ-879022</span>
<h4 className="font-headline-md text-headline-md text-on-surface-variant">Tropical Waves Gala</h4>
</div>
<div className="flex flex-col items-end">
<span className="px-4 py-1 rounded-full bg-surface-dim text-on-surface-variant font-label-bold text-[12px] border border-outline-variant/30">
                                        EXPIRED
                                    </span>
</div>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Date &amp; Time</p>
<p className="font-body-md text-body-md text-on-surface-variant">Oct 12, 2024 • 19:00</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Venue</p>
<p className="font-body-md text-body-md text-on-surface-variant">Blue Lagoon Deck</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Tickets</p>
<p className="font-body-md text-body-md text-on-surface-variant">5 Tickets</p>
</div>
<div>
<p className="text-on-surface-variant text-[11px] font-label-bold uppercase tracking-tight">Total Amount</p>
<p className="font-label-bold text-headline-md text-on-surface-variant">$210.00</p>
</div>
</div>
</div>
<div className="flex justify-end pt-4 border-t border-outline-variant/10 mt-4">
<button className="px-8 py-2 rounded-full border border-primary text-primary font-button text-button hover:bg-primary/5 transition-all">Book Again</button>
</div>
</div>
</div>
</div>

<div className="flex justify-center items-center space-x-2 mt-12">
<button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all">
<span className="material-symbols-outlined">chevron_left</span>
</button>
<button className="w-10 h-10 rounded-full bg-primary text-white font-label-bold text-label-bold shadow-sm">1</button>
<button className="w-10 h-10 rounded-full text-on-surface-variant hover:bg-primary/5 font-label-bold text-label-bold transition-all">2</button>
<button className="w-10 h-10 rounded-full text-on-surface-variant hover:bg-primary/5 font-label-bold text-label-bold transition-all">3</button>
<button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</main>

<footer className="w-full bg-surface-container-low mt-auto">
<div className="max-w-[1280px] mx-auto px-margin-desktop py-12 flex flex-col items-center gap-8">
<div className="font-headline-md text-headline-md font-bold text-primary">AquaPulse</div>
<div className="flex flex-wrap justify-center gap-6 font-body-md text-body-md text-primary">
<a className="hover:underline" href="#">Terms of Service</a>
<a className="hover:underline" href="#">Privacy Policy</a>
<a className="hover:underline" href="#">Park Rules</a>
<a className="hover:underline" href="#">Contact Us</a>
</div>
<div className="font-body-md text-body-md text-on-surface-variant">
© 2024 AquaPulse. Making every splash count.
</div>
</div>
</footer>
    </div>
  );
}
