export default function HomePage() {
  return (
    <div className="bg-light-aqua-gradient text-on-surface font-body-md min-h-screen">
      <style>{`.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .hover-lift {
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .hover-lift:hover {
            transform: translateY(-8px);
            box-shadow: 0px 20px 40px rgba(0, 105, 107, 0.1);
        }
        .bg-aqua-gradient {
            background: linear-gradient(135deg, #00ced1 0%, #00696b 100%);
        }
        .bg-coral-gradient {
            background: linear-gradient(135deg, #FF6900 0%, #a43c12 100%);
        }
        .bg-light-aqua-gradient {
            background: linear-gradient(180deg, #f7f9fb 0%, #e0fbfc 100%);
        }`}</style>
<nav className="bg-surface/70 backdrop-blur-xl font-button text-button fixed top-0 w-full z-50 border-b border-outline-variant/30">
<div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">
<div className="flex items-center gap-2">
<span className="font-display-lg text-headline-md text-primary tracking-tight flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-3xl">waves</span>
                AquaPulse
            </span>
</div>
<div className="hidden md:flex items-center gap-8">
<a className="text-primary font-bold relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-primary" href="#">Home</a>
<a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Shows</a>
<a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Schedules</a>
<a className="text-on-surface-variant hover:text-primary transition-colors" href="#">My Bookings</a>
</div>
<div className="flex items-center gap-4">
<button className="hidden md:flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
<span>Profile</span>
</button>
<button className="bg-primary text-on-primary px-7 py-3 rounded-full hover:shadow-lg active:scale-95 transition-all font-button">
                Book Now
            </button>
</div>
</div>
</nav>

<section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden">
<div className="absolute inset-0 z-0">
<img alt="Spectacular water fountain show" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMtU715udYhrKO5UD5Z7WcmQPqPLM3sfRoUqm0yo9QyXaYviVVdqfJqXGt-R8q7yRyVJLCg-7yNQpxuClsEjazci4FKUvmHD8-h7VkaJqEUvZ5LGrgQc6OPyIHDftuWq5GrkH069uG0kIWEZVuOUHlSyRsz1ONwEJ_UsC5FRcoEUREr1YT7NhxEjLc3llvHYb1puPSJd-SvHfPyVBIZ0PfNO2dLzosiECIC6e8l0yAD35mD5_rDkKbENd7IbpmBKPOWznJiquMbA" />
<div className="absolute inset-0 bg-gradient-to-r from-on-primary-fixed/70 via-on-primary-fixed/30 to-transparent"></div>
</div>
<div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto text-white pt-20">
<div className="max-w-2xl">
<h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-6 leading-tight">
                Dive Into <span className="text-electric-cyan">Magical</span> Water Shows
            </h1>
<p className="font-body-lg text-body-lg mb-10 text-surface-variant opacity-90 max-w-lg">
                Discover spectacular performances, book tickets online, and enjoy unforgettable moments at AquaPulse. Experience the harmony of light, water, and music.
            </p>
<div className="flex flex-wrap gap-4">
<button className="bg-primary text-on-primary px-10 py-4 rounded-full font-button hover:bg-primary-container hover:text-on-primary-container transition-all shadow-xl">
                    Book Tickets
                </button>
<button className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white px-10 py-4 rounded-full font-button hover:bg-white/20 transition-all">
                    Explore Shows
                </button>
</div>
</div>
</div>
</section>

<div className="relative z-20 -mt-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
<div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-end gap-6 border border-outline-variant/20">
<div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6">
<div className="space-y-2">
<label className="font-label-bold text-on-surface-variant flex items-center gap-2 px-1">
<span className="material-symbols-outlined text-primary" data-icon="water_drop">water_drop</span>
                    Select Show
                </label>
<select className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full px-6 py-3 focus:ring-2 focus:ring-primary-container appearance-none">
<option>Symphony of Lights</option>
<option>Aqua Ballet</option>
<option>Deep Sea Mystery</option>
<option>Tropical Splash Parade</option>
</select>
</div>
<div className="space-y-2">
<label className="font-label-bold text-on-surface-variant flex items-center gap-2 px-1">
<span className="material-symbols-outlined text-primary" data-icon="calendar_month">calendar_month</span>
                    Select Date
                </label>
<input className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full px-6 py-3 focus:ring-2 focus:ring-primary-container" type="date" />
</div>
<div className="space-y-2">
<label className="font-label-bold text-on-surface-variant flex items-center gap-2 px-1">
<span className="material-symbols-outlined text-primary" data-icon="group">group</span>
                    Guests
                </label>
<input className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full px-6 py-3 focus:ring-2 focus:ring-primary-container" min="1" placeholder="Number of guests" type="number" />
</div>
<div className="space-y-2">
<label className="font-label-bold text-on-surface-variant flex items-center gap-2 px-1">
<span className="material-symbols-outlined text-primary" data-icon="confirmation_number">confirmation_number</span>
                    Ticket Type
                </label>
<select className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full px-6 py-3 focus:ring-2 focus:ring-primary-container appearance-none">
<option>Standard Entry</option>
<option>VIP Experience</option>
<option>Family Pass</option>
</select>
</div>
</div>
<button className="w-full md:w-auto bg-primary text-on-primary px-10 py-4 rounded-full font-button hover:bg-primary/90 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md">
<span className="material-symbols-outlined" data-icon="search">search</span>
            Search Tickets
        </button>
</div>
</div>

<section className="py-16 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
<div className="flex justify-between items-end mb-12">
<div>
<span className="text-primary font-label-bold tracking-widest uppercase mb-2 block">Performances</span>
<h2 className="font-headline-lg text-headline-lg text-charcoal-text">Featured Water Shows</h2>
</div>
<button className="text-primary font-button flex items-center gap-1 hover:gap-2 transition-all group">
            View All <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">

<div className="bg-white rounded-3xl overflow-hidden hover-lift border border-outline-variant/20 group shadow-sm">
<div className="relative h-72 overflow-hidden">
<img alt="Symphony of Lights" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgtKbX141GIXV28czApt3tHguCUvPKSbRAnFdFAQzlJutKE1EC4vS7jnqAU4kbJta6FkkFLWOG1xo4RFS8AM1MXBGOQlPFZh-FlQEpmZlt5nYB6wUrwlpXP5TSpL1DI7WuOKTisPjwwu6BaEFAPWXD2NGxEfXQvUJmomtpfH0x7egW2U7kxW6h2RZFC6PIb1cpt9NbIPLdOpwlkZgjkBVzNlC3R9onv6_Esbk17K0of4PgvHxDHfAWZoVi41bvelTws71QLVrPMQ" />
<span className="absolute top-5 left-5 bg-vin-orange text-white px-4 py-1.5 rounded-full text-label-bold shadow-lg">Popular</span>
<div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full shadow-lg">
<span className="text-primary font-bold">from $29</span>
</div>
</div>
<div className="p-8">
<h3 className="font-headline-md text-headline-md mb-3">Symphony of Lights</h3>
<p className="text-on-surface-variant mb-8 line-clamp-2">A synchronized masterpiece of light, water, and sound that will leave you breathless.</p>
<button className="w-full py-3.5 rounded-full border-2 border-primary text-primary font-button hover:bg-primary hover:text-on-primary transition-all">
                    View Details
                </button>
</div>
</div>

<div className="bg-white rounded-3xl overflow-hidden hover-lift border border-outline-variant/20 group shadow-sm">
<div className="relative h-72 overflow-hidden">
<img alt="Deep Sea Mystery" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaDCEPuRXIz-tXX1TXYxFJLqc_NIsXu8w_yLI5ZUwrlr8wnEL8-kgSlFbHHypXmoS8BFV3Nt-uIqfoUBNP3vsNwRpxWltuGVcjFaEYr5i0Jxbq-UGbC8e5wY7oIaDMk2npEmreyGf9rBbp29WokyWvugQKmrBX2PoVJWFeSGUirssyqs6CAB1JREDZCBlv_mFFOq4aPXSDN7RXezaVkV4yhWwjPBXZkL6PwbhHkm0AYogBR_08bBqL0orR0zzGAHByqIypSnGUag" />
<span className="absolute top-5 left-5 bg-electric-cyan text-on-primary-fixed px-4 py-1.5 rounded-full text-label-bold shadow-lg">New</span>
<div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full shadow-lg">
<span className="text-primary font-bold">from $35</span>
</div>
</div>
<div className="p-8">
<h3 className="font-headline-md text-headline-md mb-3">Deep Sea Mystery</h3>
<p className="text-on-surface-variant mb-8 line-clamp-2">Journey into the abyss and discover the secrets of the ocean in this immersive play.</p>
<button className="w-full py-3.5 rounded-full border-2 border-primary text-primary font-button hover:bg-primary hover:text-on-primary transition-all">
                    View Details
                </button>
</div>
</div>

<div className="bg-white rounded-3xl overflow-hidden hover-lift border border-outline-variant/20 group shadow-sm">
<div className="relative h-72 overflow-hidden">
<img alt="Tropical Splash" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOdYlgXL4Nwf4AWcGFjApQwu1wTev59cOd_-GZKhZAWO4Iz_zf7Tn8_yeXyi9P-cEDz6PldhiUpJ7j_1kqfhSt3YHIgmEJCtryWfqAghSSeXxzgAUM-pXEtaZhoz6g-0FlaiKz-SMUTjlXf7-QNguIhszVSRUHyFOy4zzsc6qh5RCz4gEwyyuSD5_OrUqMRuq-If6WwHs7nBE7Nwij3GBrdW3JEC77ydu5Az0EctrAsKLg-FkB0ZzurXJq_eCzA4NIrDfQsrmB1A" />
<div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full shadow-lg">
<span className="text-primary font-bold">from $25</span>
</div>
</div>
<div className="p-8">
<h3 className="font-headline-md text-headline-md mb-3">Tropical Splash</h3>
<p className="text-on-surface-variant mb-8 line-clamp-2">A high-energy daytime parade with water cannons, music, and tropical rhythms.</p>
<button className="w-full py-3.5 rounded-full border-2 border-primary text-primary font-button hover:bg-primary hover:text-on-primary transition-all">
                    View Details
                </button>
</div>
</div>
</div>
</section>

<section className="py-16 bg-white/50">
<div className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
<div className="text-center mb-16">
<h2 className="font-headline-lg text-headline-lg text-charcoal-text mb-4">Upcoming Show Schedules</h2>
<div className="w-20 h-1 bg-primary-container mx-auto rounded-full mb-6"></div>
<p className="text-on-surface-variant max-w-xl mx-auto">Plan your visit ahead. Check the latest show timings and real-time availability for our main stages.</p>
</div>
<div className="space-y-6">

<div className="bg-white p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all border border-outline-variant/10">
<div className="flex items-center gap-6 w-full md:w-1/4">
<div className="bg-primary-container/10 p-4 rounded-2xl text-center min-w-[90px] border border-primary-container/20">
<p className="text-primary font-bold text-2xl">24</p>
<p className="text-on-surface-variant text-xs uppercase font-bold tracking-widest">Aug</p>
</div>
<div>
<p className="font-headline-md text-headline-md text-primary">19:30 PM</p>
<p className="text-on-surface-variant text-sm">Gate opens 30m early</p>
</div>
</div>
<div className="w-full md:w-1/3 text-center md:text-left">
<h4 className="font-bold text-xl text-charcoal-text">Symphony of Lights</h4>
<p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-1 text-sm mt-1">
<span className="material-symbols-outlined text-sm">location_on</span> Main Aquatic Theater
                    </p>
</div>
<div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
<span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> Available
                    </span>
<button className="bg-primary text-on-primary px-10 py-3.5 rounded-full font-button hover:bg-primary/90 transition-all shadow-md">
                        Book Now
                    </button>
</div>
</div>

<div className="bg-white p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all border border-outline-variant/10">
<div className="flex items-center gap-6 w-full md:w-1/4">
<div className="bg-primary-container/10 p-4 rounded-2xl text-center min-w-[90px] border border-primary-container/20">
<p className="text-primary font-bold text-2xl">24</p>
<p className="text-on-surface-variant text-xs uppercase font-bold tracking-widest">Aug</p>
</div>
<div>
<p className="font-headline-md text-headline-md text-primary">21:00 PM</p>
<p className="text-on-surface-variant text-sm">Late night performance</p>
</div>
</div>
<div className="w-full md:w-1/3 text-center md:text-left">
<h4 className="font-bold text-xl text-charcoal-text">Deep Sea Mystery</h4>
<p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-1 text-sm mt-1">
<span className="material-symbols-outlined text-sm">location_on</span> Grand Arena Pool
                    </p>
</div>
<div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
<span className="bg-vin-orange/5 text-vin-orange px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-vin-orange"></span> Almost Full
                    </span>
<button className="bg-primary text-on-primary px-10 py-3.5 rounded-full font-button hover:bg-primary/90 transition-all shadow-md">
                        Book Now
                    </button>
</div>
</div>
</div>
</div>
</section>

<section className="py-16 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
<div className="flex items-center gap-6 mb-12">
<h2 className="font-headline-lg text-headline-lg flex-shrink-0">Exclusive Promotions</h2>
<div className="h-px bg-outline-variant/30 flex-grow"></div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
<div className="bg-aqua-gradient rounded-3xl p-8 md:p-12 relative overflow-hidden text-white flex flex-col justify-center min-h-[400px] shadow-2xl">
<div className="relative z-10 space-y-6">
<span className="bg-white/20 backdrop-blur-md px-5 py-1.5 rounded-full text-sm font-bold border border-white/30 uppercase tracking-widest">Limited Time</span>
<h3 className="text-4xl md:text-5xl font-extrabold leading-tight">Summer Splash<br />Family Bundle</h3>
<p className="text-white/80 text-lg max-w-sm">Get 4 tickets for the price of 3 plus free snacks and drinks for the kids.</p>
<button className="mt-4 bg-secondary-fixed text-on-secondary-fixed px-10 py-4 rounded-full font-bold hover:shadow-xl active:scale-95 transition-all w-fit">
                    Grab Offer
                </button>
</div>

<div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
<div className="absolute right-10 top-10 w-40 h-40 bg-white/5 border border-white/10 rounded-full"></div>
<span className="material-symbols-outlined absolute right-8 bottom-8 text-[120px] opacity-10 leading-none select-none">waves</span>
</div>
<div className="bg-coral-gradient rounded-3xl p-8 md:p-12 relative overflow-hidden text-white flex flex-col justify-center min-h-[400px] shadow-2xl">
<div className="relative z-10 space-y-6">
<span className="bg-white/20 backdrop-blur-md px-5 py-1.5 rounded-full text-sm font-bold border border-white/30 uppercase tracking-widest">Members Only</span>
<h3 className="text-4xl md:text-5xl font-extrabold leading-tight">VIP Season Pass<br />Early Access</h3>
<p className="text-white/80 text-lg max-w-sm">Enjoy unlimited entries and priority seating for all premium shows this season.</p>
<button className="mt-4 bg-white text-primary px-10 py-4 rounded-full font-bold hover:shadow-xl active:scale-95 transition-all w-fit">
                    Explore Perks
                </button>
</div>

<div className="absolute -left-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
<span className="material-symbols-outlined absolute right-8 bottom-8 text-[120px] opacity-10 leading-none select-none">stars</span>
</div>
</div>
</section>

<section className="py-16 bg-surface-container-low/50">
<div className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
<div className="text-center mb-16">
<h2 className="font-headline-lg text-headline-lg mb-4">Why Book With AquaPulse?</h2>
<div className="w-24 h-1.5 bg-primary-container mx-auto rounded-full"></div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
<div className="text-center group">
<div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
<span className="material-symbols-outlined text-4xl" data-icon="bolt">bolt</span>
</div>
<h4 className="font-bold text-xl mb-3">Easy Booking</h4>
<p className="text-on-surface-variant text-sm px-4">Instant confirmation and secure ticket management in just 3 clicks.</p>
</div>
<div className="text-center group">
<div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
<span className="material-symbols-outlined text-4xl" data-icon="verified_user">verified_user</span>
</div>
<h4 className="font-bold text-xl mb-3">Secure Payment</h4>
<p className="text-on-surface-variant text-sm px-4">Your data is protected by industry-leading encryption standards.</p>
</div>
<div className="text-center group">
<div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
<span className="material-symbols-outlined text-4xl" data-icon="qr_code_2">qr_code_2</span>
</div>
<h4 className="font-bold text-xl mb-3">QR Entry</h4>
<p className="text-on-surface-variant text-sm px-4">Skip the queues with seamless digital entry directly from your phone.</p>
</div>
<div className="text-center group">
<div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
<span className="material-symbols-outlined text-4xl" data-icon="notifications_active">notifications_active</span>
</div>
<h4 className="font-bold text-xl mb-3">Real-time Updates</h4>
<p className="text-on-surface-variant text-sm px-4">Get live notifications about show timings and seat availability.</p>
</div>
</div>
</div>
</section>

<footer className="bg-on-primary-fixed-variant text-soft-turquoise font-body-md pt-20 pb-10">
<div className="w-full px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
<div className="col-span-1 md:col-span-1 space-y-6">
<span className="font-display-lg text-headline-lg text-electric-cyan flex items-center gap-2">
<span className="material-symbols-outlined text-3xl">waves</span>
                AquaPulse
            </span>
<p className="text-surface-variant opacity-80 leading-relaxed text-sm">
                Bringing the magic of water and light to families across the globe. Experience the next level of entertainment at AquaPulse.
            </p>
<div className="flex gap-4">
<a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors border border-white/10" href="#">
<span className="material-symbols-outlined text-lg">social_leaderboard</span>
</a>
<a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors border border-white/10" href="#">
<span className="material-symbols-outlined text-lg">camera_alt</span>
</a>
<a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors border border-white/10" href="#">
<span className="material-symbols-outlined text-lg">play_circle</span>
</a>
</div>
</div>
<div>
<h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Explore</h5>
<ul className="space-y-4 text-surface-variant text-sm">
<li><a className="hover:text-electric-cyan transition-colors" href="#">All Shows</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Park Map</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Dining &amp; Shops</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Attractions</a></li>
</ul>
</div>
<div>
<h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Planning</h5>
<ul className="space-y-4 text-surface-variant text-sm">
<li><a className="hover:text-electric-cyan transition-colors" href="#">Daily Schedules</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Promotions</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Safety Guide</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Careers</a></li>
</ul>
</div>
<div>
<h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Support</h5>
<ul className="space-y-4 text-surface-variant text-sm">
<li><a className="hover:text-electric-cyan transition-colors" href="#">Support Center</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Contact Us</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">FAQs</a></li>
<li><a className="hover:text-electric-cyan transition-colors" href="#">Terms &amp; Conditions</a></li>
</ul>
</div>
</div>
<div className="w-full px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-60">
<p>© 2024 AquaPulse Entertainment. All rights reserved.</p>
<div className="flex gap-8">
<a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
<a className="hover:text-white transition-colors" href="#">Cookie Settings</a>
</div>
</div>
</footer>
    </div>
  );
}
