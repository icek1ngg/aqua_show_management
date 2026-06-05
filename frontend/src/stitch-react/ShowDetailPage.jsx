import { useEffect } from 'react';

import MainLayout from '../shared/layouts/MainLayout.jsx';

export default function ShowDetailPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "// Micro-interactions for glass panels\r\n        document.querySelectorAll('.glass-panel, .bg-surface-container-lowest').forEach(card => {\r\n            card.addEventListener('mouseenter', () => {\r\n                card.style.transform = 'translateY(-4px)';\r\n                card.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';\r\n            });\r\n            card.addEventListener('mouseleave', () => {\r\n                card.style.transform = 'translateY(0px)';\r\n            });\r\n        });\r\n\r\n        // Sticky Navbar background shift on scroll\r\n        window.addEventListener('scroll', () => {\r\n            const header = document.querySelector('header');\r\n            if (window.scrollY > 50) {\r\n                header.classList.add('shadow-md');\r\n                header.style.backgroundColor = 'rgba(241, 251, 251, 0.95)';\r\n            } else {\r\n                header.classList.remove('shadow-md');\r\n                header.style.backgroundColor = 'rgba(241, 251, 251, 0.8)';\r\n            }\r\n        });";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <MainLayout>
    <div className="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
      <style>{".glass-panel {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            -webkit-backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n        }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n            vertical-align: middle;\r\n        }\r\n        .text-button { font-size: 14px; font-weight: 600; text-transform: none; }\r\n        .font-button { font-family: 'Plus Jakarta Sans', sans-serif; }\r\n        .text-label-bold { font-size: 12px; font-weight: 700; }\r\n        .font-label-bold { font-family: 'Plus Jakarta Sans', sans-serif; }\r\n        \r\n        .hero-gradient {\r\n            background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);\r\n        }"}</style>
<main>

<section className="relative w-full h-[614px] min-h-[500px] overflow-hidden">
<div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" data-alt="A grand water fountain show at night featuring towering jets of turquoise water illuminated by brilliant cyan and teal lights. Laser beams in emerald green and sapphire blue pierce the night sky, creating a complex web of light. A crowd of silhouettes watches in awe from the edge of the lagoon, with the soft glow of distant park architecture in the background. The atmosphere is magical and high-energy." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuANv7I9nTUaKmdiA6IfaIaY0YwJUIWoqM0X6m_tgMmcJ71PacmGbCJL7U7jN8rhBXSUuV7fovx9LDsAc6N5PhTyiCp6LssLe6FgDdZmMcwFIlWNhrmPMXPWNaNGaENraIJuHz9U8O5qXFdHXwD12d0tWFF6pkX61XHVJWiPscKVSeVXPJHPLntIinpKKiq48E_jrrE2A6BF6g5CVGhbzwWhTMCs07mHdwovKDWCZJwE9QP5SidUIrVjslByRhoxaZve3By201M-MkjJ')" }}>
</div>
<div className="absolute inset-0 hero-gradient"></div>
<div className="absolute bottom-0 left-0 right-0 p-margin-desktop max-w-container-max mx-auto">
<div className="flex flex-col gap-unit-sm mb-unit-lg">
<nav className="flex items-center gap-unit-sm text-white/80 text-label-md font-label-md mb-2">
<a className="hover:text-electric-cyan transition-colors" href="/shows">Shows</a>
<span className="material-symbols-outlined text-[14px]">chevron_right</span>
<span className="text-white">Oceanic Dreams 4D</span>
</nav>
<div className="flex items-center gap-unit-md">
<span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-md font-label-bold uppercase tracking-wider">Active</span>
<div className="flex items-center gap-1 text-white/90 text-label-md font-label-md">
<span className="material-symbols-outlined text-[18px]">schedule</span>
                            60 mins
                        </div>
</div>
<h1 className="text-white font-headline-2xl text-headline-2xl md:text-[64px] leading-tight max-w-4xl">Oceanic Dreams 4D</h1>
</div>
</div>
</section>

<section className="max-w-container-max mx-auto px-margin-desktop py-unit-xl">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

<div className="lg:col-span-7 flex flex-col gap-unit-xl">
<div className="glass-panel p-unit-lg rounded-xl shadow-sm">
<h2 className="font-headline-md text-headline-md text-primary mb-unit-md">About the Show</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                            Dive into a multi-sensory journey through the hidden wonders of the deep sea. "Oceanic Dreams 4D" combines state-of-the-art water projection technology with synchronized laser choreography and immersive surround sound. Witness the legendary tales of ancient sea guardians brought to life in a breathtaking display of fluid art and luminous aquatic modernism.
                        </p>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-unit-md mt-unit-xl">
<div className="flex flex-col gap-1">
<span className="text-label-md font-label-md text-outline">Category</span>
<span className="font-body-md text-on-surface font-semibold">Interactive Arts</span>
</div>
<div className="flex flex-col gap-1">
<span className="text-label-md font-label-md text-outline">Show Type</span>
<span className="font-body-md text-on-surface font-semibold">4D Experience</span>
</div>
<div className="flex flex-col gap-1">
<span className="text-label-md font-label-md text-outline">Audience</span>
<span className="font-body-md text-on-surface font-semibold">All Ages</span>
</div>
</div>
</div>

<div className="grid grid-cols-2 gap-unit-md">
<div className="h-48 rounded-xl bg-cover bg-center overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-alt="A close-up of vibrant water projections showing a stylized luminous jellyfish floating through a dark blue liquid environment. The water droplets act as tiny pixels, creating a shimmering, ethereal effect. The colors are dominated by electric cyan and deep violet, with soft glows illuminating the spray. Minimalist and professional marine entertainment aesthetic." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQbql89nZUPmszl9ZbgAUtDWVEnxn50iMXG6Q-fggqDinTout4wWGHrpJr5H4BGpxiK-yq4ncIcWcoO9ML9Q0R2sz__gfHNhG5N7eHQj2-RhygpowXExJatAyXDkj60P3b0C10kDdgwu8i0eVrMLcvOTDiqs5wjAye-czOskMnaAYB0iqRYtcuhNjSoZbZ6JxAkO2x5VTnYAItv8v0RcHi5_WfBWivTbO03O6IzCUxRizRmMVfa7P2SkCyfsGg_ecunpJhgjPST6P0')" }}></div>
<div className="h-48 rounded-xl bg-cover bg-center overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-alt="High-angle shot of a grand lagoon venue during a light show. Bright orange and teal spotlights cross over a massive pool of water, reflecting perfectly on the surface. The architecture around the pool is sleek and modern, with soft ambient lighting. The atmosphere is sophisticated, upscale, and festive, capturing the essence of premium marine entertainment." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDy5lPXcFOXoG7Lj-m_Xk2nnox1JkGhYGVtUNpp-XPPJXt-LDCJzlJtV7G1tSBVTCy1zdTtn-otuj5cvtYDoSuTBdSLoF4rqHSVbuo5283rg8eeqqb-h7nNr-DZ4VwZ3uQ4ey82Fc0Y_yPf_vuh7V3d_o1ryz0Y0KLoE-_3Cm7eU8I_WZ1pOoCSTblC0EkwTCamIDo7k_cq5HaMpMOaACjX7yBe9_c5e67AUNn3Ts1KWD4CeKp8F13KYVDmUk_D20-2zIEzxf9Vjugc')" }}></div>
</div>
</div>

<div className="lg:col-span-5 flex flex-col gap-unit-lg">
<div className="flex justify-between items-center">
<h2 className="font-headline-md text-headline-md text-on-surface">Upcoming Times</h2>
<button className="text-primary font-label-bold text-label-md flex items-center gap-1 hover:underline">
                            View Calendar <span className="material-symbols-outlined text-[16px]">calendar_month</span>
</button>
</div>

<div className="flex flex-col gap-unit-md">

<div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-unit-md shadow-sm hover:shadow-md transition-all group">
<div className="flex justify-between items-start mb-unit-md">
<div className="flex flex-col">
<span className="font-headline-md text-primary">19:30 — 20:30</span>
<span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">location_on</span> Grand Lagoon
                                    </span>
</div>
<div className="text-right">
<span className="font-headline-md text-on-surface">$45.00</span>
<span className="block text-label-md font-label-md text-outline">per ticket</span>
</div>
</div>
<div className="flex items-center justify-between pt-unit-md border-t border-outline-variant/20">
<div className="flex flex-col">
<span className="text-label-md font-label-md text-outline">Available</span>
<span className="text-body-md font-semibold text-secondary">124 Tickets left</span>
</div>
<button className="bg-primary/50 text-on-primary px-6 py-2 rounded-full font-button text-button cursor-not-allowed opacity-80" disabled="">
                                    Book Now
                                </button>
</div>
</div>

<div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-unit-md shadow-sm hover:shadow-md transition-all group">
<div className="flex justify-between items-start mb-unit-md">
<div className="flex flex-col">
<span className="font-headline-md text-primary">21:00 — 22:00</span>
<span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">location_on</span> Grand Lagoon
                                    </span>
</div>
<div className="text-right">
<span className="font-headline-md text-on-surface">$55.00</span>
<span className="block text-label-md font-label-md text-outline">per ticket</span>
</div>
</div>
<div className="flex items-center justify-between pt-unit-md border-t border-outline-variant/20">
<div className="flex flex-col">
<span className="text-label-md font-label-md text-outline">Available</span>
<span className="text-body-md font-semibold text-secondary">42 Tickets left</span>
</div>
<button className="bg-primary/50 text-on-primary px-6 py-2 rounded-full font-button text-button cursor-not-allowed opacity-80" disabled="">
                                    Book Now
                                </button>
</div>
</div>

<div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-unit-md shadow-sm hover:shadow-md transition-all group opacity-60">
<div className="flex justify-between items-start mb-unit-md">
<div className="flex flex-col">
<span className="font-headline-md text-outline">22:30 — 23:30</span>
<span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">location_on</span> Grand Lagoon
                                    </span>
</div>
<div className="text-right">
<span className="font-headline-md text-on-surface">$45.00</span>
<span className="block text-label-md font-label-md text-outline">per ticket</span>
</div>
</div>
<div className="flex items-center justify-between pt-unit-md border-t border-outline-variant/20">
<div className="flex flex-col">
<span className="text-label-md font-label-md text-error font-bold italic">SOLD OUT</span>
</div>
<button className="bg-surface-variant text-on-surface-variant px-6 py-2 rounded-full font-button text-button cursor-not-allowed" disabled="">
                                    Sold Out
                                </button>
</div>
</div>
</div>

<div className="bg-secondary-container/30 rounded-xl p-unit-md flex gap-unit-md">
<span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
<div className="flex flex-col gap-1">
<span className="font-label-bold text-secondary">Visitor Information</span>
<p className="text-body-sm text-on-secondary-container">Please arrive 20 minutes before showtime. This performance features strobe lights and loud audio effects. Rain-or-shine event.</p>
</div>
</div>
</div>
</div>
</section>
</main>
    </div>
    </MainLayout>
  );
}
