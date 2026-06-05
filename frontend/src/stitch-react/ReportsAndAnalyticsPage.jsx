import { useEffect } from 'react';

export default function ReportsAndAnalyticsPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "// Micro-interactions for charts and UI\r\n        document.querySelectorAll('.glass-card').forEach(card => {\r\n            card.addEventListener('mouseenter', () => {\r\n                card.style.transform = 'translateY(-4px)';\r\n                card.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';\r\n            });\r\n            card.addEventListener('mouseleave', () => {\r\n                card.style.transform = 'translateY(0px)';\r\n            });\r\n        });";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="bg-background text-on-background">
      <style>{"body {\r\n            font-family: 'Plus Jakarta Sans', sans-serif;\r\n            background-color: #f1fbfb;\r\n        }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n        }\r\n        .chart-gradient-teal {\r\n            background: linear-gradient(180deg, #00ced1 0%, #00696b 100%);\r\n        }\r\n        .sidebar-active-indicator {\r\n            box-shadow: 4px 0px 10px rgba(0, 105, 107, 0.2);\r\n        }"}</style>
<aside className="fixed left-0 top-0 h-full w-sidebar-width bg-on-secondary-fixed shadow-lg flex flex-col h-full py-unit-lg z-50">
<div className="px-unit-lg mb-unit-xl">
<h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
<p className="font-body-md text-body-sm text-on-secondary-fixed-variant opacity-70">Management System</p>
</div>
<nav className="flex-1 space-y-unit-xs">

<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/dashboard">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-body-md">Dashboard</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/shows">
<span className="material-symbols-outlined">theater_comedy</span>
<span className="font-body-md">Shows</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/venues">
<span className="material-symbols-outlined">water_drop</span>
<span className="font-body-md">Venues</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/schedules">
<span className="material-symbols-outlined">calendar_month</span>
<span className="font-body-md">Schedules</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/bookings">
<span className="material-symbols-outlined">event_seat</span>
<span className="font-body-md">Bookings</span>
</a>

<a className="flex items-center gap-unit-md text-primary-fixed border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 px-unit-lg py-unit-md" href="/manager/reports">
<span className="material-symbols-outlined">analytics</span>
<span className="font-body-md font-bold">Reports</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/users">
<span className="material-symbols-outlined">group</span>
<span className="font-body-md">Users</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/roles">
<span className="material-symbols-outlined">admin_panel_settings</span>
<span className="font-body-md">Roles</span>
</a>
</nav>
<div className="px-unit-lg mt-auto">
<button className="w-full py-unit-md bg-primary-container text-on-primary-container rounded-lg font-label-lg hover:brightness-110 transition-all">
                Quick Schedule
            </button>
<div className="flex items-center gap-unit-md mt-unit-lg pt-unit-md border-t border-on-secondary-fixed-variant/20">
<img alt="AquaShow Admin Profile" className="w-10 h-10 rounded-full object-cover" data-alt="A professional headshot of a marine park manager in a clean white uniform, smiling warmly against a soft-focus background of a sunlit tropical aquatic center. The lighting is bright and airy, matching a high-end corporate aesthetic with subtle blue and teal undertones. High-quality professional photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCbYJkp0pNvXTXiIisy-nc67tIW4TicjBPRQe8wj9xkEan3uNeHKuI2ZOA40wlTSntzQ3VMWmvf8hXpSl3jDvPYePrt-X3YyP8Ng6TjIHWsPTbfgzE-RFx1imI38S57RBgESwLXUZDxthN5wQT-YqHr8kxlnlnuUwgxoorfbaYRySRoNPQf1HU2V64TKlDF-pnPC_cpRW7nzrtxm8qngYBL_CMDRqv0ynzJDduJFF4XspN66qjboaF9OoCxYdrpCPyOUBE-8M8uuEx"/>
<div>
<p className="font-label-lg text-primary-fixed">Alex Rivers</p>
<p className="text-[10px] text-on-secondary-fixed-variant uppercase tracking-widest">Admin Manager</p>
</div>
</div>
</div>
</aside>

<main className="ml-sidebar-width flex flex-col min-h-screen">

<header className="flex justify-between items-center px-unit-lg py-unit-sm sticky top-0 z-40 bg-surface/70 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
<div className="flex items-center gap-unit-lg">
<h2 className="font-headline-md text-headline-md font-extrabold text-primary">Reports &amp; Analytics</h2>
<div className="relative hidden lg:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full w-64 focus:ring-2 focus:ring-primary/20 text-body-sm" placeholder="Search reports..." type="text"/>
</div>
</div>
<div className="flex items-center gap-unit-md">
<button className="p-2 text-on-surface-variant hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95">
<span className="material-symbols-outlined">notifications</span>
</button>
<button className="p-2 text-on-surface-variant hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95">
<span className="material-symbols-outlined">help_outline</span>
</button>
<button className="p-2 text-on-surface-variant hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95">
<span className="material-symbols-outlined">settings</span>
</button>
</div>
</header>

<section className="p-unit-lg space-y-unit-lg max-w-[1600px] mx-auto w-full">

<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-unit-md">
<div className="flex flex-wrap gap-unit-sm">
<select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-unit-md py-unit-sm text-body-sm focus:border-primary focus:ring-primary">
<option>Last 30 Days</option>
<option>Last Quarter</option>
<option>This Year</option>
<option>Custom Range</option>
</select>
<select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-unit-md py-unit-sm text-body-sm focus:border-primary focus:ring-primary">
<option>All Shows</option>
<option>Dolphin Symphony</option>
<option>Orca Odyssey</option>
<option>Tropical Reef Ballet</option>
</select>
</div>
<button className="flex items-center gap-unit-sm px-unit-lg py-unit-sm bg-primary text-on-primary rounded-full font-label-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
<span className="material-symbols-outlined text-[20px]">download</span>
                    Export PDF
                </button>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-unit-md">

<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-primary">
<p className="text-on-surface-variant font-label-md uppercase tracking-wider mb-unit-sm">Total Bookings</p>
<h3 className="font-headline-lg text-headline-lg text-primary">12,482</h3>
<div className="flex items-center gap-1 mt-unit-xs text-green-600 font-label-md">
<span className="material-symbols-outlined text-[16px]">trending_up</span>
<span>+12%</span>
</div>
</div>

<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-secondary">
<p className="text-on-surface-variant font-label-md uppercase tracking-wider mb-unit-sm">Paid Bookings</p>
<h3 className="font-headline-lg text-headline-lg text-secondary">11,902</h3>
<div className="flex items-center gap-1 mt-unit-xs text-green-600 font-label-md">
<span className="material-symbols-outlined text-[16px]">trending_up</span>
<span>+8%</span>
</div>
</div>

<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-tertiary col-span-1 lg:col-span-2">
<p className="text-on-surface-variant font-label-md uppercase tracking-wider mb-unit-sm">Total Revenue</p>
<h3 className="font-headline-lg text-headline-lg text-tertiary">$482,910.00</h3>
<div className="flex items-center gap-1 mt-unit-xs text-green-600 font-label-md">
<span className="material-symbols-outlined text-[16px]">trending_up</span>
<span>+$42k vs last month</span>
</div>
</div>

<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-primary-container">
<p className="text-on-surface-variant font-label-md uppercase tracking-wider mb-unit-sm">Attendance</p>
<h3 className="font-headline-lg text-headline-lg text-on-primary-container">94.2%</h3>
<div className="flex items-center gap-1 mt-unit-xs text-secondary font-label-md">
<span className="material-symbols-outlined text-[16px]">verified</span>
<span>High Capacity</span>
</div>
</div>

<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-outline">
<p className="text-on-surface-variant font-label-md uppercase tracking-wider mb-unit-sm">Check-ins</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface">10,841</h3>
<div className="flex items-center gap-1 mt-unit-xs text-on-surface-variant font-label-md">
<span className="material-symbols-outlined text-[16px]">group</span>
<span>Today: 842</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-lg">

<div className="lg:col-span-8 glass-card p-unit-lg rounded-lg shadow-md">
<div className="flex justify-between items-center mb-unit-lg">
<h4 className="font-headline-md text-headline-md text-on-surface">Daily Attendance Trend</h4>
<div className="flex gap-unit-md text-body-sm text-on-surface-variant">
<span className="flex items-center gap-1"><i className="w-3 h-3 rounded-full bg-primary"></i> Show A</span>
<span className="flex items-center gap-1"><i className="w-3 h-3 rounded-full bg-secondary"></i> Show B</span>
</div>
</div>
<div className="h-64 w-full relative flex items-end justify-between px-4 pb-8">

<div className="absolute inset-0 flex items-end opacity-10">
<div className="w-full h-[1px] bg-outline mb-12"></div>
<div className="w-full h-[1px] bg-outline mb-24"></div>
<div className="w-full h-[1px] bg-outline mb-36"></div>
</div>
<svg className="absolute bottom-12 left-0 w-full h-40 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
<path className="text-primary" d="M0,80 Q100,20 200,50 T400,30 T600,70 T800,10 T1000,40" fill="none" stroke="currentColor" strokeWidth="3"></path>
<path className="text-secondary" d="M0,90 Q120,40 250,70 T450,50 T650,90 T850,30 T1000,60" fill="none" stroke="currentColor" strokeWidth="3"></path>
</svg>
<div className="text-[10px] text-outline font-bold">MON</div>
<div className="text-[10px] text-outline font-bold">TUE</div>
<div className="text-[10px] text-outline font-bold">WED</div>
<div className="text-[10px] text-outline font-bold">THU</div>
<div className="text-[10px] text-outline font-bold">FRI</div>
<div className="text-[10px] text-outline font-bold">SAT</div>
<div className="text-[10px] text-outline font-bold">SUN</div>
</div>
</div>

<div className="lg:col-span-4 glass-card p-unit-lg rounded-lg shadow-md flex flex-col">
<h4 className="font-headline-md text-headline-md text-on-surface mb-unit-lg">Booking Distribution</h4>
<div className="flex-1 flex flex-col items-center justify-center">
<div className="relative w-48 h-48 rounded-full border-[16px] border-primary-container" style={{ borderRightColor: "#ffdcc3", borderBottomColor: "#baeafe" }}>
<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
<span className="font-headline-md text-on-surface">12k</span>
<span className="text-[10px] uppercase font-bold text-outline">Tickets</span>
</div>
</div>
<div className="mt-unit-lg w-full space-y-2">
<div className="flex justify-between items-center text-body-sm">
<span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-primary-container"></i> Confirmed</span>
<span className="font-bold">75%</span>
</div>
<div className="flex justify-between items-center text-body-sm">
<span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-secondary-fixed"></i> Pending</span>
<span className="font-bold">15%</span>
</div>
<div className="flex justify-between items-center text-body-sm">
<span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-tertiary-fixed"></i> Cancelled</span>
<span className="font-bold">10%</span>
</div>
</div>
</div>
</div>

<div className="lg:col-span-12 glass-card p-unit-lg rounded-lg shadow-md">
<div className="flex justify-between items-center mb-unit-lg">
<h4 className="font-headline-md text-headline-md text-on-surface">Revenue by Show Performance</h4>
<button className="text-primary font-label-lg hover:underline">View Detailed breakdown</button>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-unit-xl">

<div className="space-y-unit-sm">
<div className="flex justify-between items-end mb-1">
<span className="text-body-sm font-bold">Dolphin Symphony</span>
<span className="text-primary font-label-lg">$142k</span>
</div>
<div className="h-4 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: "85%" }}></div>
</div>
<p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Capacity: 92%</p>
</div>

<div className="space-y-unit-sm">
<div className="flex justify-between items-end mb-1">
<span className="text-body-sm font-bold">Orca Odyssey</span>
<span className="text-primary font-label-lg">$185k</span>
</div>
<div className="h-4 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: "95%" }}></div>
</div>
<p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Capacity: 98%</p>
</div>

<div className="space-y-unit-sm">
<div className="flex justify-between items-end mb-1">
<span className="text-body-sm font-bold">Sea Lion Splash</span>
<span className="text-primary font-label-lg">$84k</span>
</div>
<div className="h-4 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: "60%" }}></div>
</div>
<p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Capacity: 74%</p>
</div>

<div className="space-y-unit-sm">
<div className="flex justify-between items-end mb-1">
<span className="text-body-sm font-bold">Coral Reef Ballet</span>
<span className="text-primary font-label-lg">$71k</span>
</div>
<div className="h-4 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: "52%" }}></div>
</div>
<p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Capacity: 68%</p>
</div>
</div>
</div>
</div>

<div className="glass-card rounded-lg overflow-hidden shadow-md">
<div className="px-unit-lg py-unit-md border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/30">
<h4 className="font-headline-md text-on-surface">Top Booking Sources</h4>
<button className="text-on-surface-variant hover:text-primary transition-colors">
<span className="material-symbols-outlined">more_vert</span>
</button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-high/20 text-on-surface-variant font-label-lg uppercase text-[12px] tracking-widest">
<th className="px-unit-lg py-unit-md">Source</th>
<th className="px-unit-lg py-unit-md">Bookings</th>
<th className="px-unit-lg py-unit-md">Conversion</th>
<th className="px-unit-lg py-unit-md">Revenue</th>
<th className="px-unit-lg py-unit-md text-right">Trend</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10 text-body-sm">
<tr className="hover:bg-primary/5 transition-colors">
<td className="px-unit-lg py-unit-md flex items-center gap-3">
<div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">language</span>
</div>
                                    Direct Website
                                </td>
<td className="px-unit-lg py-unit-md font-bold">5,201</td>
<td className="px-unit-lg py-unit-md">12.4%</td>
<td className="px-unit-lg py-unit-md">$210,040</td>
<td className="px-unit-lg py-unit-md text-right text-green-600">
<span className="material-symbols-outlined text-[16px] align-middle">north_east</span>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors">
<td className="px-unit-lg py-unit-md flex items-center gap-3">
<div className="w-8 h-8 rounded bg-secondary-container/20 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]">confirmation_number</span>
</div>
                                    TicketMaster
                                </td>
<td className="px-unit-lg py-unit-md font-bold">3,892</td>
<td className="px-unit-lg py-unit-md">8.2%</td>
<td className="px-unit-lg py-unit-md">$158,230</td>
<td className="px-unit-lg py-unit-md text-right text-green-600">
<span className="material-symbols-outlined text-[16px] align-middle">north_east</span>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors">
<td className="px-unit-lg py-unit-md flex items-center gap-3">
<div className="w-8 h-8 rounded bg-tertiary-container/20 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[18px]">hotel</span>
</div>
                                    Hotel Concierge
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] rounded-full font-bold">PARTNER</span>
</td>
<td className="px-unit-lg py-unit-md font-bold">1,405</td>
<td className="px-unit-lg py-unit-md">18.1%</td>
<td className="px-unit-lg py-unit-md">$62,400</td>
<td className="px-unit-lg py-unit-md text-right text-red-600">
<span className="material-symbols-outlined text-[16px] align-middle">south_east</span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</section>

<footer className="mt-auto px-unit-lg py-unit-md border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center text-on-surface-variant text-[12px]">
<p>© 2024 AquaShow Management System. Precision in every splash.</p>
<div className="flex gap-unit-lg mt-unit-sm md:mt-0">
<a className="hover:text-primary transition-colors" href="/">Privacy Policy</a>
<a className="hover:text-primary transition-colors" href="/manager/reports">Audit Logs</a>
<a className="hover:text-primary transition-colors" href="mailto:support@aquashow.local">Support</a>
</div>
</footer>
</main>

<div className="fixed bottom-unit-lg right-unit-lg flex flex-col gap-unit-sm items-end group">
<div className="hidden group-hover:flex flex-col gap-unit-sm items-end animate-in fade-in slide-in-from-bottom-4 duration-300">
<button className="bg-white text-primary px-4 py-2 rounded-full shadow-lg border border-primary/20 font-label-lg flex items-center gap-2">
<span className="material-symbols-outlined text-sm">mail</span> Email Report
            </button>
<button className="bg-white text-primary px-4 py-2 rounded-full shadow-lg border border-primary/20 font-label-lg flex items-center gap-2">
<span className="material-symbols-outlined text-sm">schedule_send</span> Schedule Automated
            </button>
</div>
<button className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
<span className="material-symbols-outlined text-2xl">insights</span>
</button>
</div>
    </div>
  );
}
