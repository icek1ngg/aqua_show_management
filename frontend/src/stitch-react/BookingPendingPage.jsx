export default function BookingPendingPage() {
  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col">
      <style>{`.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bg-glass {
            backdrop-filter: blur(12px);
            background-color: rgba(255, 255, 255, 0.8);
        }
        .wave-bg {
            background: linear-gradient(180deg, #f7f9fb 0%, #AFEEEE 100%);
            position: relative;
            overflow: hidden;
        }
        .bubble {
            position: absolute;
            background: rgba(0, 206, 209, 0.1);
            border-radius: 50%;
            pointer-events: none;
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }`}</style>
<header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-xl h-20 shadow-[0px_4px_20px_rgba(0,206,209,0.08)]">
<div className="flex justify-between items-center px-margin-desktop h-full max-w-container-max mx-auto">
<div className="font-display-lg text-display-lg-mobile text-primary">AquaPark Manager</div>
<div className="hidden md:flex items-center gap-6">
<span className="text-on-surface-variant font-label-bold">Order ID: #AQ-882190</span>
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-primary">help</span>
</div>
</div>
</div>
</header>
<main className="flex-grow pt-32 pb-20 wave-bg relative">

<div className="bubble w-20 h-20 top-20 left-[10%] animate-float" style={{ animationDelay: "0s" }}></div>
<div className="bubble w-32 h-32 top-60 right-[15%] animate-float" style={{ animationDelay: "2s" }}></div>
<div className="bubble w-16 h-16 bottom-40 left-[20%] animate-float" style={{ animationDelay: "4s" }}></div>
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-gutter relative z-10">

<div className="lg:col-span-7 flex flex-col justify-center space-y-8">
<div className="flex flex-col items-start space-y-4">
<div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center text-primary-container">
<span className="material-symbols-outlined !text-5xl animate-pulse">hourglass_empty</span>
</div>
<div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-bold shadow-sm">
<span className="material-symbols-outlined text-sm mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        PENDING_PAYMENT
                    </div>
<h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight">
                        Hold tight! Your booking is almost ready.
                    </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                        We've successfully created your reservation for Symphony of Lights. To guarantee your seats, please complete your payment before the timer expires.
                    </p>
</div>

<div className="bg-glass p-8 rounded-lg border border-primary/10 shadow-[0px_4px_20px_rgba(0,206,209,0.08)] flex flex-col md:flex-row items-center gap-8">
<div className="text-center">
<div className="font-display-lg text-primary tracking-widest" id="countdown">13:21</div>
<div className="font-label-bold text-on-surface-variant/60 uppercase text-[10px]">Minutes Remaining</div>
</div>
<div className="h-px md:h-16 w-full md:w-px bg-outline-variant"></div>
<div className="flex-1">
<p className="text-tertiary font-label-bold flex items-center gap-2">
<span className="material-symbols-outlined">warning</span>
                            Ticket Release Warning
                        </p>
<p className="text-body-md text-on-surface-variant mt-1">
                            Unpaid bookings are automatically released and tickets are returned to the pool after 15 minutes.
                        </p>
</div>
</div>

<div className="hidden lg:flex flex-col sm:flex-row items-center gap-4">
<button className="bg-gradient-to-r from-primary to-deep-aqua text-white px-8 py-4 rounded-full font-button shadow-lg hover:scale-105 transition-transform duration-200">
                        Continue to Payment
                    </button>
<button className="bg-white border-2 border-primary text-primary px-8 py-4 rounded-full font-button hover:bg-primary/5 transition-colors">
                        View Booking Detail
                    </button>
</div>
<a className="hidden lg:inline-flex items-center text-primary font-label-bold hover:underline gap-2 mt-4" href="#">
<span className="material-symbols-outlined">arrow_back</span>
                    Back to Home
                </a>
</div>

<div className="lg:col-span-5">
<div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0px_20px_48px_rgba(0,0,0,0.05)] border border-white">

<div className="h-48 w-full relative overflow-hidden">
<img className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" data-alt="A spectacular night show at a modern water park featuring colorful laser lights illuminating massive water fountains and synchronized mist. The Symphony of Lights performance creates a vibrant electric-cyan and violet atmosphere under a dark starry sky. The scene is high-energy and magical, reflecting a premium entertainment experience with crystal clear reflections on the water surface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUmOFDxfp1ajdCR_O_aNnBxoQW3_u9WMM17Kwe97LkjaLHN5KJ2N_vFKUHL6AZjvVZXtetw4139nIp60BEiaP-APZkoQEnBtM3ysqtwT6Lq0H1SBHw_poDS2Kl35kmV7ltWau4w3z2G7r98RflsVGSRceCx2YkW61nvRJ71zEzvMFUXQ9enPSVXjZWjvwS_TNgIZLS7PPXsSTs0LeU2eSFJXqoNrs7w4n5ErcAkgTYULV5F891qLia5q_mLesnJks4-sYQyPZZqA" />
<div className="absolute top-4 right-4 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-label-bold text-xs">
                            $45.00
                        </div>
</div>

<div className="p-8 space-y-6">
<div className="flex justify-between items-start">
<div>
<h2 className="font-headline-md text-primary">Booking Summary</h2>
<p className="text-on-surface-variant font-label-bold text-sm">Order #AQ-882190</p>
</div>
<span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
</div>
<div className="space-y-4 pt-4 border-t border-surface-container-high">
<div className="flex justify-between">
<span className="text-on-surface-variant">Show Name</span>
<span className="font-label-bold">Symphony of Lights</span>
</div>
<div className="flex justify-between">
<span className="text-on-surface-variant">Date &amp; Time</span>
<span className="font-label-bold">Oct 24, 2024 • 08:30 PM</span>
</div>
<div className="flex justify-between">
<span className="text-on-surface-variant">Venue</span>
<span className="font-label-bold">Aqua Plaza</span>
</div>
<div className="flex justify-between">
<span className="text-on-surface-variant">Quantity</span>
<span className="font-label-bold">2 Adult Tickets</span>
</div>
</div>
<div className="pt-6 border-t-2 border-dashed border-outline-variant flex justify-between items-center">
<span className="font-headline-md">Total Amount</span>
<span className="font-display-lg text-primary text-3xl">$45.00</span>
</div>
</div>
</div>

<div className="lg:hidden mt-8 flex flex-col gap-4">
<button className="bg-gradient-to-r from-primary to-deep-aqua text-white w-full py-4 rounded-full font-button shadow-lg">
                        Continue to Payment
                    </button>
<button className="bg-white border-2 border-primary text-primary w-full py-4 rounded-full font-button">
                        View Booking Detail
                    </button>
<a className="text-center text-primary font-label-bold py-2" href="#">Back to Home</a>
</div>
</div>
</div>

<div className="absolute bottom-0 left-0 w-full leading-[0] transform rotate-180">
<svg className="w-full h-auto fill-surface-container" viewBox="0 0 1440 320">
<path d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,181.3C672,149,768,107,864,112C960,117,1056,171,1152,181.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
</svg>
</div>
</main>
<footer className="bg-surface-container dark:bg-surface-container-high mt-auto">
<div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop py-10 max-w-container-max mx-auto w-full">
<div className="font-headline-md text-headline-md text-primary mb-4 md:mb-0">AquaPark Manager</div>
<div className="flex flex-wrap justify-center gap-6">
<a className="text-on-surface-variant hover:text-deep-aqua transition-all font-body-md text-body-md" href="#">Privacy Policy</a>
<a className="text-on-surface-variant hover:text-deep-aqua transition-all font-body-md text-body-md" href="#">Terms of Service</a>
<a className="text-on-surface-variant hover:text-deep-aqua transition-all font-body-md text-body-md" href="#">Support</a>
<a className="text-on-surface-variant hover:text-deep-aqua transition-all font-body-md text-body-md" href="#">Contact Us</a>
</div>
<p className="text-on-surface-variant dark:text-outline-variant font-body-md text-body-md mt-6 md:mt-0 opacity-80">
                © 2024 AquaPark Entertainment Group. All rights reserved.
            </p>
</div>
</footer>
    </div>
  );
}
