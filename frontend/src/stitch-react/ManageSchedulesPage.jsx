import { useEffect } from 'react';

export default function ManageSchedulesPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "function openModal() {\r\n            const modal = document.getElementById('modalOverlay');\r\n            modal.classList.remove('hidden');\r\n            modal.classList.add('flex');\r\n            document.body.style.overflow = 'hidden';\r\n        }\r\n\r\n        function closeModal() {\r\n            const modal = document.getElementById('modalOverlay');\r\n            modal.classList.add('hidden');\r\n            modal.classList.remove('flex');\r\n            document.body.style.overflow = 'auto';\r\n        }\r\n\r\n        // Close on escape key\r\n        document.addEventListener('keydown', (e) => {\r\n            if (e.key === 'Escape') closeModal();\r\n        });\r\n\r\n        // Close on overlay click\r\n        document.getElementById('modalOverlay').addEventListener('click', (e) => {\r\n            if (e.target === document.getElementById('modalOverlay')) closeModal();\r\n        });";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen">
      <style>{".material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n            box-shadow: 0 8px 32px 0 rgba(0, 105, 107, 0.08);\r\n        }\r\n        .sidebar-active-indicator {\r\n            position: absolute;\r\n            left: 0;\r\n            width: 4px;\r\n            height: 100%;\r\n            background-color: theme('colors.primary-fixed');\r\n        }"}</style>
<aside className="fixed left-0 top-0 h-full w-sidebar-width bg-on-secondary-fixed shadow-lg flex flex-col py-unit-lg z-50">
<div className="px-unit-lg mb-unit-xl">
<h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
<p className="font-body-sm text-body-sm text-on-secondary-fixed-variant opacity-70">Management System</p>
</div>
<nav className="flex-1 space-y-unit-xs">
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/dashboard">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/shows">
<span className="material-symbols-outlined" data-icon="theater_comedy">theater_comedy</span>
<span>Shows</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/venues">
<span className="material-symbols-outlined" data-icon="water_drop">water_drop</span>
<span>Venues</span>
</a>

<a className="flex items-center gap-unit-md text-primary-fixed border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 px-unit-lg py-unit-md transition-all" href="/manager/schedules">
<span className="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
<span>Schedules</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/bookings">
<span className="material-symbols-outlined" data-icon="event_seat">event_seat</span>
<span>Bookings</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/reports">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
<span>Reports</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/users">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span>Users</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/roles">
<span className="material-symbols-outlined" data-icon="admin_panel_settings">admin_panel_settings</span>
<span>Roles</span>
</a>
</nav>
<div className="px-unit-lg mt-auto">
<button className="w-full bg-primary-container text-on-primary-container py-unit-md rounded-lg font-label-lg flex items-center justify-center gap-unit-sm hover:opacity-90 active:scale-[0.99] transition-all" onClick={() => window.openModal?.()}>
<span className="material-symbols-outlined" data-icon="add">add</span>
                Quick Schedule
            </button>
</div>
</aside>

<main className="ml-sidebar-width min-h-screen flex flex-col">

<header className="flex justify-between items-center px-unit-lg py-unit-sm sticky top-0 z-40 bg-surface/70 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
<div className="flex items-center gap-unit-lg">
<h2 className="font-headline-md text-headline-md font-extrabold text-primary">Manage Show Schedules</h2>
<div className="hidden md:flex bg-surface-container rounded-full px-unit-md py-unit-xs items-center gap-unit-sm w-96">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="search">search</span>
<input className="bg-transparent border-none focus:ring-0 text-body-sm w-full" placeholder="Search schedules..." type="text"/>
</div>
</div>
<div className="flex items-center gap-unit-md">
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95 duration-150">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95 duration-150">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
</button>
<div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
<img alt="AquaShow Admin Profile" data-alt="A professional headshot of a marine park manager in a clean, high-key office environment. The person has a friendly but authoritative expression, wearing a smart-casual uniform. The background is softly blurred with hints of aquatic-themed decor and modern office architecture. The lighting is bright and airy, consistent with a premium management software profile." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1cLKGGgumY00LTFBZbhr92m2Lv2x6g9m6RC999hJ80ltkdaVSFGrNM55XvsWWeH3JcGWCQSZqvE2EsonCmGQ9l8-KFAAHXTeh3fK4xFbpM8WkLfMuF2WRkqZyX5v0ndyU-l2VhdPSuXFOvc5QYxVODVfpkNhHJYdZ83G7MeTR8m4ybQaElnIhDdE-xhCccLZrC7CHyZnYL5a7q6vZkvmRsp7jfNnCeLi0DPaaKqj_3yHSw1WnXqgYIo1kP_igj4kA82V5bxpiTUiU"/>
</div>
</div>
</header>

<div className="p-unit-lg space-y-unit-lg">

<div className="glass-card p-unit-md rounded-lg flex flex-wrap items-end gap-unit-md">
<div className="flex-1 min-w-[200px] space-y-unit-xs">
<label className="text-label-md text-on-surface-variant uppercase">Show</label>
<select className="w-full bg-surface-container-low border-none rounded-md text-body-sm focus:ring-2 focus:ring-primary">
<option>All Shows</option>
<option>Dolphin Symphony</option>
<option>The Orca Tale</option>
<option>Deep Sea bioluminescence</option>
</select>
</div>
<div className="flex-1 min-w-[200px] space-y-unit-xs">
<label className="text-label-md text-on-surface-variant uppercase">Venue</label>
<select className="w-full bg-surface-container-low border-none rounded-md text-body-sm focus:ring-2 focus:ring-primary">
<option>All Venues</option>
<option>Main Lagoon</option>
<option>Sunset Arena</option>
<option>Ocean Dome</option>
</select>
</div>
<div className="flex-1 min-w-[150px] space-y-unit-xs">
<label className="text-label-md text-on-surface-variant uppercase">Status</label>
<select className="w-full bg-surface-container-low border-none rounded-md text-body-sm focus:ring-2 focus:ring-primary">
<option>All Statuses</option>
<option>ACTIVE</option>
<option>INACTIVE</option>
<option>COMPLETED</option>
</select>
</div>
<div className="flex-1 min-w-[200px] space-y-unit-xs">
<label className="text-label-md text-on-surface-variant uppercase">Date Range</label>
<div className="flex items-center bg-surface-container-low rounded-md px-unit-sm">
<input className="bg-transparent border-none text-body-sm focus:ring-0" type="date"/>
<span className="text-on-surface-variant px-unit-xs">-</span>
<input className="bg-transparent border-none text-body-sm focus:ring-0" type="date"/>
</div>
</div>
<div className="flex items-center gap-unit-xs bg-surface-container-high p-1 rounded-lg">
<button className="p-unit-sm rounded-md bg-surface-container-lowest text-primary shadow-sm">
<span className="material-symbols-outlined" data-icon="table_rows">table_rows</span>
</button>
<button className="p-unit-sm rounded-md text-on-surface-variant hover:bg-surface-container-lowest transition-colors">
<span className="material-symbols-outlined" data-icon="calendar_view_day">calendar_view_day</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-unit-lg">
<div className="glass-card p-unit-lg rounded-lg border-l-4 border-primary">
<p className="text-label-md text-on-surface-variant">Scheduled Today</p>
<h3 className="text-headline-lg font-bold text-primary mt-1">12 Shows</h3>
</div>
<div className="glass-card p-unit-lg rounded-lg border-l-4 border-secondary">
<p className="text-label-md text-on-surface-variant">Avg. Occupancy</p>
<h3 className="text-headline-lg font-bold text-secondary mt-1">84%</h3>
</div>
<div className="glass-card p-unit-lg rounded-lg border-l-4 border-tertiary-container">
<p className="text-label-md text-on-surface-variant">Active Warnings</p>
<h3 className="text-headline-lg font-bold text-tertiary mt-1">2 Conflicts</h3>
</div>
<div className="glass-card p-unit-lg rounded-lg border-l-4 border-primary-container">
<p className="text-label-md text-on-surface-variant">Tickets Sold</p>
<h3 className="text-headline-lg font-bold text-on-primary-container mt-1">4.2k</h3>
</div>
</div>

<div className="glass-card rounded-lg overflow-hidden">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container text-on-surface-variant font-label-lg">
<th className="px-unit-lg py-unit-md">Show</th>
<th className="px-unit-lg py-unit-md">Venue</th>
<th className="px-unit-lg py-unit-md">Start Time</th>
<th className="px-unit-lg py-unit-md">End Time</th>
<th className="px-unit-lg py-unit-md text-center">Capacity</th>
<th className="px-unit-lg py-unit-md text-center">Tickets</th>
<th className="px-unit-lg py-unit-md">Price</th>
<th className="px-unit-lg py-unit-md">Status</th>
<th className="px-unit-lg py-unit-md text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10">

<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
<img alt="Dolphin Symphony" data-alt="A spectacular underwater photograph showing two dolphins jumping in perfect synchronization against a bright blue lagoon backdrop. The water is crystalline, with sparkling surface reflections and soft teal tones. The overall atmosphere is energetic, clean, and representative of a premium marine show. Lighting is cinematic and bright." src="https://lh3.googleusercontent.com/aida-public/AB6AXuANM6rgOqgnBIK1LoKg_8wEzuUgRV76L55lB7ATaBCjZye3GmdzC2452tyqTL_z39BTzZam_QgtV-Chlnz5wKpgOxmqCk4J88VT9scUUAXI2nw5mcNzW5TgDKu-SDQIxmvExgWDD4mY2i7cejaxPyF0CQHqtMl4yyeMfA36w9OeZhtyzplzT4x6_o46Dd5FFG94xovjRwakJuLHskrj3liAwCuAA2fn4DzrEsxKp57fAnOH6QzkRbfNYUgglDrTTNhzggHEniPMvQE3"/>
</div>
<span className="font-bold text-primary">Dolphin Symphony</span>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant">Main Lagoon</td>
<td className="px-unit-lg py-unit-md font-medium">10:00 AM</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant">11:15 AM</td>
<td className="px-unit-lg py-unit-md text-center">450</td>
<td className="px-unit-lg py-unit-md">
<div className="flex flex-col items-center gap-1">
<span className="text-body-sm font-bold">120/450</span>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary" style={{ width: "26%" }}></div>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md font-bold">$45.00</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-md font-bold uppercase">ACTIVE</span>
</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-unit-sm opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-primary/10 text-primary rounded-full"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
<button className="p-2 hover:bg-error/10 text-error rounded-full"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
<img alt="The Orca Tale" data-alt="A powerful and majestic Orca leaping out of a deep indigo ocean, splashing white foam against a sunset sky with orange and purple hues. The composition is dramatic and evokes a sense of awe. The lighting is warm and evocative, symbolizing a grand evening performance in a high-end marine park." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT46Pmdqhv7aLip-fChIVax42KvlFqM2IZha7xymvGw5jB6bwcLIufB0sH7zU04_mEPKcdzXEMMUa7FpfgVTrIuUyL-nZOrKV0T1O7u0CiCZlswGS1gTsf_W0h1AvurYQZN20xaBfLnIOcEX9kRx1MGCyLOyt5s7If1vAbrn9wlupoKiFNGgcUOnQagE4AhtyhHE_W501JAVJNNiBRSy5E_bUV8f4wVtaB6TbmgDTmpPtMQelbOXEgNm-G-eS8rRBpqX4-gK9KZP8V"/>
</div>
<span className="font-bold text-primary">The Orca Tale</span>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant">Sunset Arena</td>
<td className="px-unit-lg py-unit-md font-medium">02:30 PM</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant">04:00 PM</td>
<td className="px-unit-lg py-unit-md text-center">800</td>
<td className="px-unit-lg py-unit-md">
<div className="flex flex-col items-center gap-1">
<span className="text-body-sm font-bold">780/800</span>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-tertiary-container" style={{ width: "97%" }}></div>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md font-bold">$65.00</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-md font-bold uppercase">ACTIVE</span>
</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-unit-sm opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-primary/10 text-primary rounded-full"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
<button className="p-2 hover:bg-error/10 text-error rounded-full"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
<img alt="Jellyfish Glow" data-alt="A magical scene of glowing bioluminescent jellyfish floating in a dark oceanic abyss. Vivid neon blues, pinks, and purples contrast against the deep black water. The lighting is surreal and ethereal, capturing the quiet beauty of a specialized marine dome attraction. Minimalist and ultra-modern aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAacnVbHAmObUmsKMTCjaXz8M8aRjIuqivvKqIZyV5BotE3bBPBOQFeLj7HHp3jfXcCcp8A8kokN9Vr580spc3AZZdR0tOqEQwdwJiaqc_2ZrKV0H0BsKhlJMKmVkzabeIkxmrHFTJukZtBQjhedC3tQBOHUlnHsxfo9wumFF3rBHPS-OGdKRlznxFLWy9vWvVn3l79ClH6rEzTqJ3u9tVE1CJbyag7xGXe-Oiu0nJ5dwUaeFxvVqLrk3N5HmTYXmgYyaAXm4KCnQ2K"/>
</div>
<span className="font-bold text-primary text-opacity-50 line-through">Jellyfish Glow</span>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant">Ocean Dome</td>
<td className="px-unit-lg py-unit-md font-medium">09:00 AM</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant">10:00 AM</td>
<td className="px-unit-lg py-unit-md text-center">150</td>
<td className="px-unit-lg py-unit-md">
<div className="flex flex-col items-center gap-1">
<span className="text-body-sm font-bold">150/150</span>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-secondary-container" style={{ width: "100%" }}></div>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md font-bold">$25.00</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-label-md font-bold uppercase">COMPLETED</span>
</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-unit-sm opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-primary/10 text-primary rounded-full"><span className="material-symbols-outlined" data-icon="visibility">visibility</span></button>
</div>
</td>
</tr>
</tbody>
</table>

<div className="p-unit-md border-t border-outline-variant/10 flex items-center justify-between">
<span className="text-body-sm text-on-surface-variant">Showing 1-10 of 42 schedules</span>
<div className="flex items-center gap-unit-xs">
<button className="p-unit-sm rounded-md hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span></button>
<button className="w-8 h-8 rounded-md bg-primary text-on-primary font-bold">1</button>
<button className="w-8 h-8 rounded-md hover:bg-surface-container-high">2</button>
<button className="w-8 h-8 rounded-md hover:bg-surface-container-high">3</button>
<button className="p-unit-sm rounded-md hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span></button>
</div>
</div>
</div>
</div>
</main>

<div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] hidden items-center justify-center p-unit-lg" id="modalOverlay">
<div className="glass-card w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
<div className="p-unit-lg border-b border-outline-variant/20 flex justify-between items-center">
<h2 className="font-headline-md text-headline-md font-bold text-primary">New Show Schedule</h2>
<button className="p-unit-sm hover:bg-error/10 text-error rounded-full transition-colors" onClick={() => window.closeModal?.()}>
<span className="material-symbols-outlined" data-icon="close">close</span>
</button>
</div>
<form className="p-unit-lg overflow-y-auto max-h-[716px] space-y-unit-lg" id="scheduleForm">
<div className="grid grid-cols-2 gap-unit-lg">
<div className="space-y-unit-xs">
<label className="text-label-md font-bold text-on-surface-variant">Select Show</label>
<select className="w-full bg-surface-container-low border-none rounded-md text-body-md focus:ring-2 focus:ring-primary py-unit-md px-unit-md">
<option>Dolphin Symphony</option>
<option>The Orca Tale</option>
</select>
</div>
<div className="space-y-unit-xs">
<label className="text-label-md font-bold text-on-surface-variant">Select Venue</label>
<select className="w-full bg-surface-container-low border-none rounded-md text-body-md focus:ring-2 focus:ring-primary py-unit-md px-unit-md">
<option>Main Lagoon</option>
<option>Sunset Arena</option>
</select>
</div>
</div>
<div className="grid grid-cols-2 gap-unit-lg">
<div className="space-y-unit-xs">
<label className="text-label-md font-bold text-on-surface-variant">Start Time</label>
<div className="relative">
<input className="w-full bg-surface-container-low border-none rounded-md text-body-md focus:ring-2 focus:ring-primary py-unit-md px-unit-md" type="time"/>
</div>
</div>
<div className="space-y-unit-xs">
<label className="text-label-md font-bold text-on-surface-variant">End Time</label>
<div className="relative">
<input className="w-full bg-surface-container-low border-none rounded-md text-body-md focus:ring-2 focus:ring-primary py-unit-md px-unit-md" type="time"/>
</div>
</div>
</div>
<div className="grid grid-cols-3 gap-unit-lg">
<div className="space-y-unit-xs">
<label className="text-label-md font-bold text-on-surface-variant">Capacity</label>
<input className="w-full bg-surface-container-low border-none rounded-md text-body-md focus:ring-2 focus:ring-primary py-unit-md px-unit-md" placeholder="500" type="number"/>
<p className="text-[10px] text-tertiary font-medium">Max Venue Cap: 800</p>
</div>
<div className="space-y-unit-xs">
<label className="text-label-md font-bold text-on-surface-variant">Ticket Price ($)</label>
<input className="w-full bg-surface-container-low border-none rounded-md text-body-md focus:ring-2 focus:ring-primary py-unit-md px-unit-md" placeholder="45.00" step="0.01" type="number"/>
</div>
<div className="space-y-unit-xs">
<label className="text-label-md font-bold text-on-surface-variant">Status</label>
<select className="w-full bg-surface-container-low border-none rounded-md text-body-md focus:ring-2 focus:ring-primary py-unit-md px-unit-md">
<option>ACTIVE</option>
<option>INACTIVE</option>
</select>
</div>
</div>

<div className="bg-tertiary-container/10 border border-tertiary-container/30 p-unit-md rounded-md flex gap-unit-md">
<span className="material-symbols-outlined text-tertiary-container" data-icon="warning">warning</span>
<div className="space-y-1">
<h4 className="text-label-md font-bold text-tertiary">Conflict Detection</h4>
<p className="text-body-sm text-on-surface-variant">Selected time overlaps with "Lagoon Maintenance" (09:00 - 10:30). Please adjust start time.</p>
</div>
</div>
</form>
<div className="p-unit-lg bg-surface-container-low flex justify-end gap-unit-md">
<button className="px-unit-xl py-unit-md text-on-surface-variant font-label-lg hover:bg-surface-container-high rounded-md transition-colors" onClick={() => window.closeModal?.()}>Cancel</button>
<button className="px-unit-xl py-unit-md bg-primary text-on-primary font-label-lg rounded-md hover:opacity-90 active:scale-95 transition-all">Create Schedule</button>
</div>
</div>
</div>
    </div>
  );
}
