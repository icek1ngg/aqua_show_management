export default function ProfilePage() {
  return (
    <div className="bg-surface font-body-md text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <style>{`.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .bubble {
            position: absolute;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            pointer-events: none;
            animation: float-up 10s infinite linear;
        }
        @keyframes float-up {
            from { transform: translateY(100%) scale(0.5); opacity: 0; }
            50% { opacity: 0.5; }
            to { transform: translateY(-100vh) scale(1.2); opacity: 0; }
        }
        .wave-container {
            position: relative;
            overflow: hidden;
        }
        .wave-svg {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: auto;
        }`}</style>
<nav className="bg-surface/80 backdrop-blur-md sticky top-0 w-full z-50 shadow-sm">
  <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
    <div className="flex items-center gap-8">
      <span className="font-display-lg text-headline-md text-primary tracking-tight font-extrabold">AquaPulse</span>
      <div className="hidden md:flex gap-6">
        <a className="text-on-surface-variant hover:text-primary transition-colors font-button text-button" href="#">Home</a>
        <a className="text-on-surface-variant hover:text-primary transition-colors font-button text-button" href="#">Shows</a>
        <a className="text-on-surface-variant hover:text-primary transition-colors font-button text-button" href="#">Schedules</a>
        <a className="text-primary border-b-2 border-primary pb-1 font-button text-button" href="#">My Bookings</a>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button className="hidden md:block px-6 py-2 rounded-full border-2 border-primary text-primary font-button text-button hover:bg-primary hover:text-white transition-all">Book Now</button>
      <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary cursor-pointer hover:scale-105 transition-transform shadow-sm">
        <img alt="User Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBr1y6jT8rVNkVdiy8aMYObXvdvRyko9uO4Dlz5RNeuhycjQ0DbT_Gii4DoZSNhJ8fzz3fc1uky7EYTIVukTsWQ1lMjOG0NLWSobI9K8tEZhM2tmkt55Hipfh7jRFPvNsV1FKCPz5cLjRmjD0N_d6fD2WXkrrKzSk3CdC7Mb53gVjPueoFIiAJEoiCwB7Dg8JEjusemuC7MWfmkC5xv1zbTMQLL1NoTs4RPgoqG0-QcV07o36TcnAwUbaAvzveKsMYqzBsz_ph3SQ" />
      </div>
    </div>
  </div>
</nav>
<main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">

<header className="wave-container w-full h-[280px] md:h-[320px] rounded-xl bg-gradient-to-br from-primary to-primary-container shadow-lg flex flex-col justify-center px-10 relative overflow-hidden mb-12">

<div className="bubble w-4 h-4 left-[10%] bottom-0" style={{ animationDelay: "1s", left: "28.7306%", animationDuration: "9.11773s" }}></div>
<div className="bubble w-8 h-8 left-[30%] bottom-0" style={{ animationDelay: "3s", left: "19.2523%", animationDuration: "9.13128s" }}></div>
<div className="bubble w-6 h-6 left-[70%] bottom-0" style={{ animationDelay: "0s", left: "16.4682%", animationDuration: "8.22309s" }}></div>
<div className="bubble w-10 h-10 left-[85%] bottom-0" style={{ animationDelay: "5s", left: "30.5792%", animationDuration: "8.4089s" }}></div>
<div className="flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">
<div className="relative">
<div className="h-28 w-28 md:h-36 md:w-36 rounded-xl border-4 border-white shadow-xl overflow-hidden bg-surface-container-lowest">
<img alt="Profile Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlBL0LAOFq0pJGG9MfCYDo7c0I07OBklNd6GAvPmj4ad2UFkPC4SmabcizbHlOdqDgIoexUTWuRinzKrrqy_Viupr3hqIF7z1GYsfCDKqFEzihUQArCRJ1JHcSc0ovFMfSGzpD3_CJMPDB4ij-4OgxR7QDnknGxLMuP1JyVL8UfZqJ_zrr6b42rkBQc9Jyii9mW_Q7cc6JFwwJZAuKQ8FBqIhHfH4f7KoBB1z9qneb4XIUDJ-OCGFGrHAJtfZWJOGz4gxYJATAww" />
</div>
<button className="absolute -bottom-2 -right-2 bg-vin-orange text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all border-2 border-white">
<span className="material-symbols-outlined text-[18px]">edit</span>
</button>
</div>
<div className="text-center md:text-left mb-2">
<h1 className="text-headline-lg font-headline-lg text-white mb-2">My Profile</h1>
<p className="text-body-md font-body-md text-white/90 max-w-xl">Manage your AquaShow account, bookings, and ticket information.</p>
</div>
</div>

<svg className="wave-svg" fill="none" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
<path d="M0 120L48 110C96 100 192 80 288 75C384 70 480 80 576 85C672 90 768 90 864 80C960 70 1056 50 1152 45C1248 40 1344 50 1392 55L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="white" fillOpacity="0.1"></path>
<path d="M0 80L48 83.3C96 86.7 192 93.3 288 90C384 86.7 480 73.3 576 70C672 66.7 768 73.3 864 80C960 86.7 1056 93.3 1152 90C1248 86.7 1344 73.3 1392 66.7L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="white" fillOpacity="0.05"></path>
</svg>
</header>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

<div className="lg:col-span-4 space-y-gutter">

<section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_4px_20px_rgba(0,206,209,0.08)] border border-surface-container">
<h2 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-3">
<span className="material-symbols-outlined text-primary">account_circle</span>
                        Account Info
                    </h2>
<div className="space-y-6">
<div>
<label className="text-label-bold font-label-bold text-on-surface-variant block mb-1">Full Name</label>
<p className="text-body-md font-body-md text-charcoal-text bg-surface-container-low p-3 rounded-DEFAULT">Alex Julian Rivers</p>
</div>
<div>
<label className="text-label-bold font-label-bold text-on-surface-variant block mb-1">Email</label>
<div className="flex items-center gap-2 text-body-md font-body-md text-on-surface-variant bg-surface-container-high p-3 rounded-DEFAULT cursor-not-allowed">
<span className="material-symbols-outlined text-sm">lock</span>
                                alex.rivers@aquapulse.io
                            </div>
</div>
<div>
<label className="text-label-bold font-label-bold text-on-surface-variant block mb-1">Phone</label>
<p className="text-body-md font-body-md text-charcoal-text bg-surface-container-low p-3 rounded-DEFAULT">+1 555-234-8901</p>
</div>
<div className="grid grid-cols-2 gap-4">
<div>
<label className="text-label-bold font-label-bold text-on-surface-variant block mb-1">Role</label>
<span className="inline-block px-3 py-1 bg-primary-container/20 text-primary font-label-bold text-label-bold rounded-full">Customer</span>
</div>
<div>
<label className="text-label-bold font-label-bold text-on-surface-variant block mb-1">Status</label>
<span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-label-bold text-label-bold rounded-full">Active</span>
</div>
</div>
<div>
<label className="text-label-bold font-label-bold text-on-surface-variant block mb-1">Auth Provider</label>
<div className="flex items-center gap-2 text-body-md font-body-md text-charcoal-text">
<img alt="Google" className="w-4 h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa4XFFj31DPze6yjb4-TdB9xyNbJpMZOK9oCpZ9uUWE_WCzWoaRS-t9Bmgbu1Z9YQaltdbNXDOlcqziasn2xC-4GVk3Ey770z1M3Tv5_zVbjxQtglhXGXK6qW7b2UXAjtZmfPzKIPqwG2wXCmhDtxniIxqty_mCZSkFHZMx2fk3U8d_6s3nivD96mOrhrRrd0-tzCZucCg49ntaHQ0dCKbPYv3Cejw4tcaPH_uMBm2lSYsPLrP8u9Q2yxPqSOdtkHvY9bEOnUUEw" />
                                Google Account
                            </div>
</div>
</div>
<button className="w-full mt-8 py-3 bg-primary text-white rounded-full font-button text-button shadow-md hover:scale-[1.02] transition-all active:scale-95 flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-sm">edit_square</span>
                        Edit Profile
                    </button>
</section>

<section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_4px_20px_rgba(0,206,209,0.08)] border border-surface-container">
<h3 className="text-label-bold font-label-bold text-on-surface-variant uppercase tracking-wider mb-4">Quick Actions</h3>
<div className="flex flex-col gap-3">
<button className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-container/10 text-primary font-button text-button transition-colors text-left group">
<span className="material-symbols-outlined p-2 bg-primary-container/20 rounded-full group-hover:scale-110 transition-transform">confirmation_number</span>
                            Book New Ticket
                        </button>
<button className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-container/10 text-secondary font-button text-button transition-colors text-left group">
<span className="material-symbols-outlined p-2 bg-secondary-container/20 rounded-full group-hover:scale-110 transition-transform">event</span>
                            View Available Shows
                        </button>
<hr className="my-2 border-surface-container" />
<button className="flex items-center gap-3 p-3 rounded-xl hover:bg-error/10 text-error font-button text-button transition-colors text-left group">
<span className="material-symbols-outlined p-2 bg-error/10 rounded-full group-hover:scale-110 transition-transform">logout</span>
                            Logout
                        </button>
</div>
</section>
</div>

<div className="lg:col-span-8 space-y-gutter">

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container text-center hover:translate-y-[-4px] transition-transform duration-300">
<p className="text-label-bold font-label-bold text-on-surface-variant mb-1">Total Bookings</p>
<p className="text-display-lg font-headline-md text-primary">12</p>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container text-center hover:translate-y-[-4px] transition-transform duration-300">
<p className="text-label-bold font-label-bold text-on-surface-variant mb-1">Pending</p>
<p className="text-display-lg font-headline-md text-vin-orange">1</p>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container text-center hover:translate-y-[-4px] transition-transform duration-300">
<p className="text-label-bold font-label-bold text-on-surface-variant mb-1">Active</p>
<p className="text-display-lg font-headline-md text-deep-aqua">3</p>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container text-center hover:translate-y-[-4px] transition-transform duration-300">
<p className="text-label-bold font-label-bold text-on-surface-variant mb-1">Completed</p>
<p className="text-display-lg font-headline-md text-secondary">8</p>
</div>
</div>

<section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_4px_20px_rgba(0,206,209,0.08)] border border-surface-container">
<div className="flex justify-between items-center mb-8">
<h2 className="text-headline-md font-headline-md text-on-surface">Recent Bookings</h2>
<a className="text-primary font-button text-button hover:underline decoration-2 underline-offset-4" href="#">View All</a>
</div>
<div className="space-y-4">

<div className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-surface-container hover:border-primary-container hover:bg-primary-container/5 transition-all">
<div className="flex items-center gap-6 mb-4 md:mb-0">
<div className="h-16 w-16 rounded-xl overflow-hidden">
<img alt="Symphony of Lights" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCujaSo6RV1Zoca54QEd2IVZ0mAIhk-vMjIjrWZ7vuCp0P6wllTuqPk4C8vUmNCkvR3RIODJ1oFmeSH8MZ-G37u1qMR5SGvZxUPPJnMsqk3L4KrtxQarbpM4eTByeZzXqJBfd1vj5K372GpP8Ayu4fBjMoU297quKk5Ks1Zu3OJVF7JnLc7tv52VksRq713j_R4nTLp2eF5SXS-k8LDvGqMXUTAVexCDC4W2CRrf9wRyqfIIqm9G3VrZTqy0eU7D4yRB5CiNTWJug" />
</div>
<div>
<h4 className="font-headline-md text-body-lg text-charcoal-text group-hover:text-primary transition-colors">Symphony of Lights</h4>
<p className="text-body-md text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-sm">calendar_month</span>
                                        Oct 24, 2024 • 8:00 PM
                                    </p>
</div>
</div>
<div className="flex items-center justify-between md:justify-end gap-8">
<div className="text-right">
<p className="text-label-bold font-label-bold text-on-surface-variant">2 Tickets</p>
<p className="text-body-md font-bold text-primary">$120.00</p>
</div>
<span className="px-4 py-1.5 bg-green-100 text-green-700 font-label-bold text-label-bold rounded-full flex items-center gap-1">
<span className="material-symbols-outlined text-sm">check_circle</span>
                                    Paid
                                </span>
</div>
</div>

<div className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-surface-container hover:border-vin-orange/30 hover:bg-vin-orange/5 transition-all">
<div className="flex items-center gap-6 mb-4 md:mb-0">
<div className="h-16 w-16 rounded-xl overflow-hidden">
<img alt="Dolphin Tales" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLkcsyUKlIImgmce-9G2dAo8GcDQHC4tMU_HtQpL0TEZHFnZMA593upxVQv7NP_8xUJLFZ9UhPc2TkLmRBIwG4nADjfrcPCCV1OcprAX9PJYRROaEPTJIr9XSSsURgaOernS9YgRdb06XKur09aBAzonxwlnjCul3WOZ_hy89pXKbtzNbQMxBkKc-JLsrTQN5WL9Qd5ekbJS4-Q_1eRRxp5L5pm-iG_pY2SQwZkYFcKXI6Ead_uy9WTRTwJK2BTK1zLuqph8bxCQ" />
</div>
<div>
<h4 className="font-headline-md text-body-lg text-charcoal-text group-hover:text-vin-orange transition-colors">Dolphin Tales</h4>
<p className="text-body-md text-on-surface-variant flex items-center gap-2">
<span className="material-symbols-outlined text-sm">calendar_month</span>
                                        Oct 25, 2024 • 11:00 AM
                                    </p>
</div>
</div>
<div className="flex items-center justify-between md:justify-end gap-8">
<div className="text-right">
<p className="text-label-bold font-label-bold text-on-surface-variant">1 Ticket</p>
<p className="text-body-md font-bold text-vin-orange">$45.00</p>
</div>
<span className="px-4 py-1.5 bg-secondary-container/30 text-secondary font-label-bold text-label-bold rounded-full flex items-center gap-1">
<span className="material-symbols-outlined text-sm">schedule</span>
                                    Pending Payment
                                </span>
</div>
</div>
</div>
</section>

<div className="bg-gradient-to-r from-secondary-container to-secondary-fixed p-8 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6 group overflow-hidden relative">
<div className="relative z-10">
<h3 className="text-headline-md font-headline-md text-on-secondary-fixed mb-2">Upgrade to Platinum?</h3>
<p className="text-body-md font-body-md text-on-secondary-fixed/80 max-w-md">Get unlimited access to all shows, priority seating, and exclusive VIP lounge access for the whole family.</p>
</div>
<button className="relative z-10 px-8 py-3 bg-charcoal-text text-white rounded-full font-button text-button shadow-lg hover:scale-105 active:scale-95 transition-all">Learn More</button>

<div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
</div>
</div>
</div>
</main>

<footer className="bg-surface-container-low mt-20">
  <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col items-center gap-8">
    <div className="flex flex-col items-center gap-4">
      <span className="font-headline-md text-headline-md font-bold text-primary">AquaPulse</span>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Park Rules</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Us</a>
      </div>
    </div>
    <div className="w-full h-px bg-outline-variant"></div>
    <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
      <p className="font-body-md text-body-md text-on-surface-variant">© 2024 AquaPulse. Making every splash count.</p>
      <div className="flex gap-4">
        <button className="w-10 h-10 rounded-full border border-outline text-on-surface-variant flex items-center justify-center hover:bg-primary-container/10 transition-all">
          <span className="material-symbols-outlined text-[20px]">public</span>
        </button>
        <button className="w-10 h-10 rounded-full border border-outline text-on-surface-variant flex items-center justify-center hover:bg-primary-container/10 transition-all">
          <span className="material-symbols-outlined text-[20px]">share</span>
        </button>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}
