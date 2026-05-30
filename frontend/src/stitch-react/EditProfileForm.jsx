export default function EditProfileForm() {
  return (
    <div className="bg-background text-on-surface">
      <style>{`body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: radial-gradient(circle at top right, #f7f9fb 0%, #AFEEEE 100%);
            min-height: 100vh;
        }
        .glass-nav {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .wave-bg {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: -1;
            overflow: hidden;
        }
        .bubble {
            position: absolute;
            background: rgba(0, 206, 209, 0.1);
            border-radius: 50%;
            animation: float 20s infinite ease-in-out;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-40px) translateX(20px); }
        }`}</style>
<div className="wave-bg">
<div className="bubble w-32 h-32 top-20 left-[10%]" style={{ animationDelay: "0s" }}></div>
<div className="bubble w-48 h-48 top-60 right-[5%]" style={{ animationDelay: "2s" }}></div>
<div className="bubble w-16 h-16 bottom-20 left-[20%]" style={{ animationDelay: "4s" }}></div>
<svg className="absolute bottom-0 w-full opacity-20" fill="none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
<path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="url(#wave-gradient)"></path>
<defs>
<linearGradient id="wave-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
<stop offset="0%" style={{ stopColor: "#00ced1", stopOpacity: "1" }}></stop>
<stop offset="100%" style={{ stopColor: "#00696b", stopOpacity: "1" }}></stop>
</linearGradient>
</defs>
</svg>
</div>

<header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm">
<nav className="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
<span className="font-display-lg text-headline-md text-primary tracking-tight">AquaPulse</span>
</div>
<div className="hidden md:flex items-center gap-8">
<a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Home</a>
<a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Shows</a>
<a className="font-button text-button text-on-surface-variant hover:text-primary transition-colors" href="#">Schedules</a>
<a className="font-button text-button text-primary border-b-2 border-primary pb-1" href="#">My Bookings</a>
</div>
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-primary/10 rounded-full transition-colors">notifications</button>
<img alt="User Profile" className="w-10 h-10 rounded-full border-2 border-primary-fixed shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC09SGIPi42LGge-3cHwvHhGpn7fCu5sBTQnDV3eikDxZk5XZU2q0cYINIGLzHxGqPZlK8_1Wuo8-o3F-tom2RNiCUCVg8_PLHwWvvQQu7v7Kxi0B70Cl3fTC3uSmj2szeQy7S7UTGVXnOVc8y2uJ94dnkis7PMpaJY4PqOhLjkMUhvRyeqanY38drBDJPp23W3B_ZpaerKqqMDeppZrQ-OyHy_9TuJgl35XTiMjGm5_2b8Bv5Y9HD3zUxVlTIa2U9FPi-NdVZDgA" />
</div>
</nav>
</header>
<main className="pt-32 pb-20 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto relative z-10">

<div className="bg-surface-container-lowest rounded-xl shadow-[0px_20px_48px_rgba(0,0,0,0.05)] overflow-hidden border border-white">

<div className="bg-gradient-to-r from-primary-container via-primary to-deep-aqua p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
<div>
<div className="flex items-center gap-3 mb-2">
<h1 className="font-headline-lg text-headline-lg text-on-primary">Edit Profile</h1>
<span className="bg-electric-cyan/20 text-electric-cyan px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-electric-cyan/30">
<span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "\"FILL\" 1" }}>verified</span>
                            Active Account
                        </span>
</div>
<p className="font-body-md text-body-md text-on-primary/80">Update your personal information for your AquaShow account.</p>
</div>
<div className="flex -space-x-2">
<div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-on-primary backdrop-blur-sm">
<span className="material-symbols-outlined text-sm">settings</span>
</div>
<div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-on-primary backdrop-blur-sm">
<span className="material-symbols-outlined text-sm">shield</span>
</div>
</div>
</div>
<div className="p-8 md:p-12">
<form className="space-y-12" onSubmit={(event) => event.preventDefault()}>

<div className="flex flex-col md:flex-row items-center gap-8 pb-10 border-b border-surface-container/50">
<div className="relative group">
<div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-container shadow-xl ring-4 ring-white">
<img alt="Profile Picture" className="w-full h-full object-cover bg-surface-container-high" id="avatar-preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAs3NVAK7aoUYuYTZX3AmIWjo37TVxp8y6qJgQ9aCIxerTaTrUNtCZg6IkvjGYTrm8NkWAmMk9EYSAS0zHX-Ybuchms5PmzM8GSFwWEwlI4Yo9RrGTNwDjP0uBNcrI0GEVscCdtCQdMPXEMe6JZqLjxpYxC0m-dniRVU5w8F3YNuK1ONb9aqNtSQ8JjTFMnaKVdluoElQViAQ2wGLue9tKyOx3JFBWEQNJawzk2cibhFjqAkAmwOrkKMOymHdXyYfPgbQ1y6XgQQ" />
</div>
<button className="absolute bottom-1 right-1 bg-primary text-on-primary p-2 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-white" type="button">
<span className="material-symbols-outlined text-sm">photo_camera</span>
</button>
</div>
<div className="text-center md:text-left">
<button className="px-6 py-2.5 bg-primary-container text-on-primary-container rounded-full font-button text-button hover:bg-primary-container/80 transition-colors mb-3 shadow-sm" type="button">Change Photo</button>
<p className="font-body-md text-body-md text-on-surface-variant/70">JPG, GIF or PNG. Max size of 800K</p>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-10">

<div className="space-y-3">
<label className="font-label-bold text-[13px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2 ml-1">
<span className="material-symbols-outlined text-primary text-[18px]">person</span>
                                First and Middle Name
                            </label>
<input className="w-full bg-surface-container-low border-0 rounded-2xl px-6 py-4.5 focus:ring-2 focus:ring-primary/20 focus:bg-white text-body-md placeholder-on-surface-variant/30 transition-all shadow-sm" defaultValue="Marina Blue" placeholder="Enter names" type="text" />
</div>

<div className="space-y-3">
<label className="font-label-bold text-[13px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2 ml-1">
<span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                                Last Name
                            </label>
<input className="w-full bg-surface-container-low border-0 rounded-2xl px-6 py-4.5 focus:ring-2 focus:ring-primary/20 focus:bg-white text-body-md transition-all shadow-sm" defaultValue="Waters" placeholder="Enter last name" type="text" />
</div>

<div className="space-y-3">
<label className="font-label-bold text-[13px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2 ml-1">
<span className="material-symbols-outlined text-primary text-[18px]">diversity_3</span>
                                Gender
                            </label>
<div className="relative">
<select className="w-full bg-surface-container-low border-0 rounded-2xl px-6 py-4.5 focus:ring-2 focus:ring-primary/20 focus:bg-white text-body-md transition-all appearance-none cursor-pointer shadow-sm" defaultValue="female">
<option value="female">Female</option>
<option value="male">Male</option>
<option value="other">Other</option>
</select>
<span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50">expand_more</span>
</div>
</div>

<div className="space-y-3">
<label className="font-label-bold text-[13px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2 ml-1">
<span className="material-symbols-outlined text-primary text-[18px]">call</span>
                                Phone Number
                            </label>
<input className="w-full bg-surface-container-low border-0 rounded-2xl px-6 py-4.5 focus:ring-2 focus:ring-primary/20 focus:bg-white text-body-md transition-all shadow-sm" defaultValue="+1 (555) 000-0000" placeholder="+1 (000) 000-0000" type="tel" />
</div>

<div className="space-y-3 md:col-span-2">
<label className="font-label-bold text-[13px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2 ml-1">
<span className="material-symbols-outlined text-on-surface-variant/60 text-[18px]">lock</span>
                                Email Address
                            </label>
<div className="relative">
<input className="w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-2xl px-6 py-4.5 text-on-surface-variant/60 cursor-not-allowed text-body-md shadow-inner" defaultValue="marina.waters@aquapulse.com" disabled type="email" />
<span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 bg-surface-variant/50 px-2 py-1 rounded">ReadOnly</span>
</div>
<p className="text-[12px] text-on-surface-variant/60 ml-4 italic">Email cannot be changed from this page. Contact support for assistance.</p>
</div>

<div className="space-y-3 md:col-span-2">
<label className="font-label-bold text-[13px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2 ml-1">
<span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                                Residential Address
                            </label>
<textarea className="w-full bg-surface-container-low border-0 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-primary/20 focus:bg-white text-body-md transition-all resize-none shadow-sm" defaultValue="789 Ocean Breeze Boulevard, Wave City, Aqua District 10101" placeholder="123 Coral Reef Drive, Atlantis City..." rows="3" />
</div>
</div>

<div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-surface-container/50">
<button className="font-button text-button text-on-surface-variant/60 hover:text-error transition-colors px-4 py-2 order-3 md:order-1" type="button">
                            Discard Changes
                        </button>
<div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto order-1 md:order-2">
<button className="px-10 py-4 rounded-full border-2 border-outline-variant text-on-surface-variant font-button text-button hover:bg-surface-container-low transition-all active:scale-95 text-center shadow-sm" type="button">
                                Cancel
                            </button>
<button className="px-12 py-4 rounded-full bg-gradient-to-r from-primary to-deep-aqua text-on-primary font-button text-button shadow-[0px_12px_24px_rgba(0,105,107,0.2)] hover:shadow-[0px_16px_32px_rgba(0,105,107,0.3)] transition-all active:scale-95 text-center" type="submit">
                                Save Changes
                            </button>
</div>
</div>
</form>
</div>
</div>
</main>

<footer className="bg-surface-container-low mt-20">
<div className="max-w-[1280px] mx-auto px-margin-desktop py-12 flex flex-col items-center gap-8">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>waves</span>
<span className="font-headline-md text-headline-md font-bold text-primary">AquaPulse</span>
</div>
<div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Park Rules</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Us</a>
</div>
<p className="font-body-md text-body-md text-on-surface-variant/60 text-center"> 2024 AquaPulse. Making every splash count.</p>
</div>
</footer>
    </div>
  );
}
