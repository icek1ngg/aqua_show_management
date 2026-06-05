import { useEffect } from 'react';

export default function ManageUsersPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "function toggleModal(modalId) {\r\n            const modal = document.getElementById(modalId);\r\n            const content = modal.querySelector('#modalContent');\r\n            \r\n            if (modal.classList.contains('hidden')) {\r\n                modal.classList.remove('hidden');\r\n                setTimeout(() => {\r\n                    content.classList.remove('scale-95', 'opacity-0');\r\n                    content.classList.add('scale-100', 'opacity-100');\r\n                }, 10);\r\n            } else {\r\n                content.classList.remove('scale-100', 'opacity-100');\r\n                content.classList.add('scale-95', 'opacity-0');\r\n                setTimeout(() => {\r\n                    modal.classList.add('hidden');\r\n                }, 300);\r\n            }\r\n        }\r\n\r\n        // Search highlight micro-interaction\r\n        const searchInput = document.querySelector('header input');\r\n        searchInput.addEventListener('focus', () => {\r\n            searchInput.parentElement.classList.add('scale-[1.02]');\r\n        });\r\n        searchInput.addEventListener('blur', () => {\r\n            searchInput.parentElement.classList.remove('scale-[1.02]');\r\n        });";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="bg-background font-body-md text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <style>{".material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n        }\r\n        .sidebar-active {\r\n            border-left-width: 4px;\r\n        }\r\n        ::-webkit-scrollbar {\r\n            width: 6px;\r\n        }\r\n        ::-webkit-scrollbar-track {\r\n            background: transparent;\r\n        }\r\n        ::-webkit-scrollbar-thumb {\r\n            background: #bac9c9;\r\n            border-radius: 10px;\r\n        }"}</style>
<aside className="fixed left-0 top-0 h-full w-sidebar-width bg-on-secondary-fixed shadow-lg flex flex-col h-full py-unit-lg z-50">
<div className="px-unit-lg mb-unit-xl">
<h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
<p className="font-label-md text-label-md text-primary-fixed-dim/70">Management System</p>
</div>
<nav className="flex-1 flex flex-col gap-unit-xs">

<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/dashboard">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-body-md text-body-md">Dashboard</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/shows">
<span className="material-symbols-outlined">theater_comedy</span>
<span className="font-body-md text-body-md">Shows</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/venues">
<span className="material-symbols-outlined">water_drop</span>
<span className="font-body-md text-body-md">Venues</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/schedules">
<span className="material-symbols-outlined">calendar_month</span>
<span className="font-body-md text-body-md">Schedules</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/bookings">
<span className="material-symbols-outlined">event_seat</span>
<span className="font-body-md text-body-md">Bookings</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/reports">
<span className="material-symbols-outlined">analytics</span>
<span className="font-body-md text-body-md">Reports</span>
</a>
<a className="flex items-center gap-unit-md text-primary-fixed border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 px-unit-lg py-unit-md transition-all" href="/admin/users">
<span className="material-symbols-outlined">group</span>
<span className="font-body-md text-body-md">Users</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/roles">
<span className="material-symbols-outlined">admin_panel_settings</span>
<span className="font-body-md text-body-md">Roles</span>
</a>
</nav>
<div className="px-unit-lg mt-auto pt-unit-lg border-t border-on-secondary-fixed-variant/10">
<button className="w-full bg-primary-fixed text-on-primary-fixed font-label-lg text-label-lg py-unit-md rounded-lg flex items-center justify-center gap-unit-sm hover:scale-[1.02] transition-transform active:scale-[0.98]">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                Quick Schedule
            </button>
</div>
</aside>

<div className="ml-sidebar-width min-h-screen flex flex-col">

<header className="flex justify-between items-center px-unit-lg py-unit-sm sticky top-0 z-40 bg-surface/70 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
<div className="flex items-center gap-unit-lg flex-1">
<div className="relative w-full max-w-md">
<span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="w-full pl-unit-xl pr-unit-md py-unit-sm bg-surface-container-low border-none rounded-full font-body-sm text-body-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search management..." type="text"/>
</div>
</div>
<div className="flex items-center gap-unit-md">
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors relative">
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
</button>
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors">
<span className="material-symbols-outlined">help_outline</span>
</button>
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors">
<span className="material-symbols-outlined">settings</span>
</button>
<div className="h-8 w-[1px] bg-outline-variant/30 mx-unit-sm"></div>
<div className="flex items-center gap-unit-sm">
<div className="text-right">
<p className="font-label-lg text-label-lg text-on-surface">Alex River</p>
<p className="font-label-md text-label-md text-on-surface-variant">System Admin</p>
</div>
<img alt="AquaShow Admin Profile" className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover" data-alt="A professional headshot of a smiling male administrator in a clean modern office setting. He is wearing a sharp, dark professional suit that contrasts with the bright, high-key lighting of the aquatic-themed management center. The atmosphere is professional, serene, and reflects a high-end technological workspace with soft cyan and white accents." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcrKCf_oLg-05-K8tU2FOtrtoGiH9r3FTipUI8EV1IRful9dWFDr3RGMuCk7iLIGmFWvgMML4Q3MItKEbcHCXKIv02clS6qkMBQl4-EcPVhtSdxrWs9-iVQJWnCmYKgo51GpTm3i0QtSdx5yQ4UyFgX9LeqBlSwfmz3Q8TfRm5BaIZLCH3wIttTGso14chvT9H1n83zXHPrxpc-V4pAK5LvfOBLp_HVE67NjPuZlsedAe-6DFpPJaf_3UPMQXEGYIZcoQZVyxqFjS8"/>
</div>
</div>
</header>

<main className="p-unit-lg flex-1">
<div className="max-w-[1440px] mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-unit-lg mb-unit-xl">
<div>
<h2 className="font-headline-xl text-headline-xl text-on-surface">Manage Users</h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-unit-xs">Oversee staff access and account permissions for the AquaShow ecosystem.</p>
</div>
<div className="flex flex-wrap gap-unit-md">
<div className="flex items-center bg-surface-container-lowest rounded-xl p-unit-xs border border-outline-variant/30">
<button className="px-unit-md py-unit-sm rounded-lg bg-primary-container text-on-primary-container font-label-lg text-label-lg transition-all">All Users</button>
<button className="px-unit-md py-unit-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container transition-all">Staff</button>
<button className="px-unit-md py-unit-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container transition-all">Managers</button>
</div>
<button className="flex items-center gap-unit-sm bg-primary text-on-primary px-unit-lg py-unit-md rounded-full font-label-lg text-label-lg hover:shadow-lg transition-all active:scale-95" onClick={() => window.toggleModal?.('userModal')}>
<span className="material-symbols-outlined">person_add</span>
                            Add New User
                        </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-unit-lg mb-unit-xl">
<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-primary">
<div className="flex justify-between items-start mb-unit-md">
<span className="p-unit-sm bg-primary/10 text-primary rounded-lg material-symbols-outlined">group</span>
<span className="text-primary font-label-md text-label-md">+12%</span>
</div>
<h3 className="text-on-surface-variant font-label-lg text-label-lg">Total Users</h3>
<p className="font-headline-md text-headline-md text-on-surface mt-unit-xs">1,284</p>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-secondary">
<div className="flex justify-between items-start mb-unit-md">
<span className="p-unit-sm bg-secondary/10 text-secondary rounded-lg material-symbols-outlined">verified_user</span>
<span className="text-secondary font-label-md text-label-md">Active</span>
</div>
<h3 className="text-on-surface-variant font-label-lg text-label-lg">Active Now</h3>
<p className="font-headline-md text-headline-md text-on-surface mt-unit-xs">92%</p>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-tertiary">
<div className="flex justify-between items-start mb-unit-md">
<span className="p-unit-sm bg-tertiary/10 text-tertiary rounded-lg material-symbols-outlined">pending_actions</span>
<span className="text-tertiary font-label-md text-label-md">Pending</span>
</div>
<h3 className="text-on-surface-variant font-label-lg text-label-lg">New Requests</h3>
<p className="font-headline-md text-headline-md text-on-surface mt-unit-xs">18</p>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-error">
<div className="flex justify-between items-start mb-unit-md">
<span className="p-unit-sm bg-error/10 text-error rounded-lg material-symbols-outlined">person_off</span>
<span className="text-error font-label-md text-label-md">Inactive</span>
</div>
<h3 className="text-on-surface-variant font-label-lg text-label-lg">Disabled Accounts</h3>
<p className="font-headline-md text-headline-md text-on-surface mt-unit-xs">42</p>
</div>
</div>

<div className="glass-card rounded-lg shadow-sm overflow-hidden border border-outline-variant/20">
<div className="p-unit-lg border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-unit-md">
<div className="flex items-center gap-unit-md flex-1 min-w-[300px]">
<div className="relative flex-1 max-w-sm">
<span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input className="w-full pl-unit-xl pr-unit-md py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg font-body-sm text-body-sm focus:border-primary transition-all outline-none" placeholder="Filter by name, email..." type="text"/>
</div>
<select className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-unit-md py-2 font-body-sm text-body-sm outline-none focus:border-primary transition-all">
<option>All Roles</option>
<option>Admin</option>
<option>Show Manager</option>
<option>Ticket Agent</option>
<option>Trainer</option>
</select>
<select className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-unit-md py-2 font-body-sm text-body-sm outline-none focus:border-primary transition-all">
<option>All Status</option>
<option>Active</option>
<option>Pending</option>
<option>Disabled</option>
</select>
</div>
<div className="flex items-center gap-unit-sm">
<button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
<span className="material-symbols-outlined">filter_list</span>
</button>
<button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
<span className="material-symbols-outlined">download</span>
</button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low">
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">User</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Email</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Role</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Status</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Created At</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10">

<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<img alt="Marina Coast" className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-primary/40 transition-all" data-alt="A portrait of a cheerful female professional with long brown hair, wearing a stylish light teal blouse. The background is a blurred high-end office with soft turquoise lighting and aquatic motifs, suggesting a modern and efficient workspace. The light-mode aesthetic is bright, clean, and professional." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvT39PKx5UiuqVvOQ6atJG9NLNHgR3pWnbtCEibinK4VV5_jHDGkGDeUEbYMSuDd1X--0aXWLmEjXpFOPDOTtXeJFkH0yYHy3QntBGc2vhZMRC9ExFF7Nj34qCCYbtxmER04DIPXolwJQjE4J5u3p1lQzCP1x63pDW6KMRhyIHKwZnRDekNhhG0d1QWjewYrheoPQsim9zJBJwJL9-BEDHa9ajROgOGH-eDLhbldCXDCUBgjjxVmoaKhbbbeWgfhS6NcrDOtU5S9jd"/>
<div>
<p className="font-body-md text-body-md font-bold text-on-surface">Marina Coast</p>
<p className="font-label-md text-label-md text-on-surface-variant">+1 (555) 012-3456</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant font-body-sm">marina.c@aquashow.com</td>
<td className="px-unit-lg py-unit-md">
<span className="px-unit-md py-unit-xs bg-secondary-container text-on-secondary-container rounded-full text-label-md font-label-md">Show Manager</span>
</td>
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-xs">
<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span className="text-on-surface font-label-md">Active</span>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant font-body-sm">Oct 12, 2023</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-unit-sm">
<button className="p-unit-sm hover:bg-primary/10 text-primary rounded-full transition-colors" onClick={() => window.toggleModal?.('userModal')} title="Edit">
<span className="material-symbols-outlined">edit</span>
</button>
<button className="p-unit-sm hover:bg-error/10 text-error rounded-full transition-colors" title="Disable">
<span className="material-symbols-outlined">block</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<img alt="Julian Reed" className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-primary/40 transition-all" data-alt="A portrait of a male professional with short dark hair and spectacles, wearing a modern charcoal grey shirt. He is looking at the camera with a confident expression. The background features a blurred marine-inspired interior with clean lines and soft ambient lighting, maintaining a premium aquatic management system aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOK3o767api7Ctk2JJsRYLHNFJp_6J_0eyn2U3jFYRWbNNTYCwVBxyCkrZoVDWu3bWDnJ2n2RtY71bfXhERZkTGSQ9jrAfjWrluohAlFPr2_gGgp5O-WfYfh8PWJAbSLqhaIHZ8LZxizgpKw8b5mpINiygos6V0cjreKfXt4tffPRSkXwDDpITHUhYVFV-JDz6-3vGtaJHZoiPtNT07JFEvK5RVMP-acM1HQD6JDxKWDdliCNWeiokxdbEELn2bTPkX39BtBxZhn88"/>
<div>
<p className="font-body-md text-body-md font-bold text-on-surface">Julian Reed</p>
<p className="font-label-md text-label-md text-on-surface-variant">+1 (555) 987-6543</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant font-body-sm">j.reed@aquashow.com</td>
<td className="px-unit-lg py-unit-md">
<span className="px-unit-md py-unit-xs bg-tertiary-container text-on-tertiary-container rounded-full text-label-md font-label-md">Trainer</span>
</td>
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-xs text-on-surface-variant">
<span className="w-2 h-2 rounded-full bg-outline"></span>
<span className="font-label-md">Offline</span>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant font-body-sm">Nov 05, 2023</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-unit-sm">
<button className="p-unit-sm hover:bg-primary/10 text-primary rounded-full transition-colors">
<span className="material-symbols-outlined">edit</span>
</button>
<button className="p-unit-sm hover:bg-error/10 text-error rounded-full transition-colors">
<span className="material-symbols-outlined">block</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-headline-md border-2 border-transparent group-hover:border-primary/40 transition-all">SH</div>
<div>
<p className="font-body-md text-body-md font-bold text-on-surface">Sarah Hellsing</p>
<p className="font-label-md text-label-md text-on-surface-variant">+1 (555) 443-2211</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant font-body-sm">sarah.h@aquashow.com</td>
<td className="px-unit-lg py-unit-md">
<span className="px-unit-md py-unit-xs bg-surface-variant text-on-surface-variant rounded-full text-label-md font-label-md">Ticket Agent</span>
</td>
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-xs text-error">
<span className="w-2 h-2 rounded-full bg-error"></span>
<span className="font-label-md">Disabled</span>
</div>
</td>
<td className="px-unit-lg py-unit-md text-on-surface-variant font-body-sm">Dec 20, 2023</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-unit-sm">
<button className="p-unit-sm hover:bg-primary/10 text-primary rounded-full transition-colors">
<span className="material-symbols-outlined">edit</span>
</button>
<button className="p-unit-sm bg-error/10 text-error rounded-full transition-colors" title="Enable">
<span className="material-symbols-outlined">check_circle</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>

<div className="p-unit-lg border-t border-outline-variant/20 flex items-center justify-between">
<p className="font-label-md text-label-md text-on-surface-variant">Showing 1 to 3 of 1,284 users</p>
<div className="flex items-center gap-unit-sm">
<button className="p-2 border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-all disabled:opacity-50" disabled="">
<span className="material-symbols-outlined">chevron_left</span>
</button>
<button className="w-10 h-10 bg-primary text-on-primary rounded-lg font-label-lg shadow-sm">1</button>
<button className="w-10 h-10 hover:bg-surface-container rounded-lg font-label-lg transition-all">2</button>
<button className="w-10 h-10 hover:bg-surface-container rounded-lg font-label-lg transition-all">3</button>
<span className="mx-unit-sm text-on-surface-variant">...</span>
<button className="w-10 h-10 hover:bg-surface-container rounded-lg font-label-lg transition-all">42</button>
<button className="p-2 border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-all">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
</main>
</div>

<div className="fixed inset-0 z-[60] hidden flex items-center justify-center p-unit-md" id="userModal">
<div className="absolute inset-0 bg-on-secondary-fixed/40 backdrop-blur-sm" onClick={() => window.toggleModal?.('userModal')}></div>
<div className="relative w-full max-w-2xl bg-surface rounded-lg shadow-2xl overflow-hidden scale-95 transition-transform duration-300" id="modalContent">
<div className="p-unit-lg bg-primary text-on-primary flex justify-between items-center">
<div>
<h3 className="font-headline-md text-headline-md">Edit User Profile</h3>
<p className="font-label-md text-label-md opacity-80">Update account settings and permissions.</p>
</div>
<button className="p-unit-sm hover:bg-white/10 rounded-full transition-colors" onClick={() => window.toggleModal?.('userModal')}>
<span className="material-symbols-outlined">close</span>
</button>
</div>
<div className="p-unit-lg space-y-unit-lg overflow-y-auto max-h-[716px]">

<div className="flex items-center gap-unit-lg">
<div className="relative">
<img alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-surface-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGJwbi4FKQFsCFrhzbPFDbyiPfWpAWoVP2uW9MM-SYvwiHYMt1xMRd7QFJBiZqyhAOeTO_abRezw_6MqmJJqQb81bFQxD58vBAhrIeaPiycqdu-cvB9IMDY9IlJWca-fROCTs7_42BNIPQ4sQp7YnX6IIj-OyCp4wzVa03o33zrPOpfOdTvI8SJ_55T_vrs_uC1pSauZNyOJXTXpm1AWVjhr8goxIza03bCGPByL90N76HMUMPTiKa769GlQPrw1-pd9iLdATbGBdV"/>
<button className="absolute bottom-0 right-0 p-unit-sm bg-primary text-on-primary rounded-full shadow-lg border-2 border-surface">
<span className="material-symbols-outlined text-sm">photo_camera</span>
</button>
</div>
<div className="flex-1">
<p className="font-label-lg text-label-lg text-on-surface">Profile Picture</p>
<p className="font-body-sm text-body-sm text-on-surface-variant">JPG, GIF or PNG. Max size of 2MB.</p>
<div className="mt-unit-sm flex gap-unit-sm">
<button className="font-label-md text-label-md text-primary hover:underline">Change</button>
<button className="font-label-md text-label-md text-error hover:underline">Remove</button>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-unit-lg">
<div className="space-y-unit-xs">
<label className="font-label-lg text-label-lg text-on-surface">Full Name</label>
<input className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-unit-md py-unit-sm outline-none focus:border-primary transition-all" type="text" defaultValue="Marina Coast"/>
</div>
<div className="space-y-unit-xs">
<label className="font-label-lg text-label-lg text-on-surface">Email Address</label>
<input className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-unit-md py-unit-sm outline-none focus:border-primary transition-all" type="email" defaultValue="marina.c@aquashow.com"/>
</div>
<div className="space-y-unit-xs">
<label className="font-label-lg text-label-lg text-on-surface">Phone Number</label>
<input className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-unit-md py-unit-sm outline-none focus:border-primary transition-all" type="tel" defaultValue="+1 (555) 012-3456"/>
</div>
<div className="space-y-unit-xs">
<label className="font-label-lg text-label-lg text-on-surface">Role</label>
<select className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-unit-md py-unit-sm outline-none focus:border-primary transition-all">
<option selected="">Show Manager</option>
<option>Admin</option>
<option>Ticket Agent</option>
<option>Trainer</option>
</select>
</div>
</div>
<div className="space-y-unit-sm">
<label className="font-label-lg text-label-lg text-on-surface">Permissions</label>
<div className="grid grid-cols-1 md:grid-cols-2 gap-unit-sm">
<label className="flex items-center gap-unit-sm p-unit-md bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-all">
<input checked="" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<div className="flex-1">
<p className="font-label-lg text-label-lg">Manage Schedules</p>
<p className="font-label-md text-label-md text-on-surface-variant">Edit show timings and rosters</p>
</div>
</label>
<label className="flex items-center gap-unit-sm p-unit-md bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-all">
<input checked="" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<div className="flex-1">
<p className="font-label-lg text-label-lg">Financial Reports</p>
<p className="font-label-md text-label-md text-on-surface-variant">Access ticket revenue data</p>
</div>
</label>
</div>
</div>
</div>
<div className="p-unit-lg bg-surface-container-low border-t border-outline-variant/20 flex justify-between gap-unit-md">
<button className="px-unit-lg py-unit-md rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container transition-all" onClick={() => window.toggleModal?.('userModal')}>Cancel</button>
<div className="flex gap-unit-md">
<button className="px-unit-lg py-unit-md rounded-full font-label-lg text-label-lg border border-error text-error hover:bg-error/5 transition-all">Disable Account</button>
<button className="px-unit-lg py-unit-md bg-primary text-on-primary rounded-full font-label-lg text-label-lg hover:shadow-lg hover:scale-105 active:scale-95 transition-all">Save Changes</button>
</div>
</div>
</div>
</div>
    </div>
  );
}
