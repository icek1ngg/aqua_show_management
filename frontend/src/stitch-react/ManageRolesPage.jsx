import { useEffect } from 'react';

export default function ManageRolesPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "function toggleModal(show) {\r\n            const modal = document.getElementById('role-modal');\r\n            if (show) {\r\n                modal.classList.remove('hidden');\r\n            } else {\r\n                modal.classList.add('hidden');\r\n            }\r\n        }\r\n\r\n        function confirmAssignment() {\r\n            // Animation for visual feedback\r\n            const btn = event.currentTarget;\r\n            btn.innerHTML = '<span class=\"material-symbols-outlined animate-spin\">sync</span> Updating...';\r\n            \r\n            setTimeout(() => {\r\n                toggleModal(false);\r\n                btn.innerHTML = 'Confirm Role';\r\n                // Trigger a notification simulation could go here\r\n            }, 1000);\r\n        }\r\n\r\n        // Search highlight micro-interaction\r\n        const searchInput = document.querySelector('input[type=\"text\"]');\r\n        searchInput.addEventListener('focus', () => {\r\n            searchInput.parentElement.classList.add('ring-2', 'ring-primary/20');\r\n        });\r\n        searchInput.addEventListener('blur', () => {\r\n            searchInput.parentElement.classList.remove('ring-2', 'ring-primary/20');\r\n        });";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="bg-background overflow-x-hidden">
      <style>{"body {\r\n            font-family: 'Plus Jakarta Sans', sans-serif;\r\n            background-color: #f1fbfb;\r\n        }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n            box-shadow: 0 8px 32px 0 rgba(0, 31, 40, 0.05);\r\n        }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }"}</style>
<aside className="fixed left-0 top-0 h-full w-sidebar-width bg-on-secondary-fixed shadow-lg flex flex-col py-unit-lg z-50">
<div className="px-unit-lg mb-unit-xl">
<h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
<p className="font-body-md text-body-md text-primary-fixed/70">Management System</p>
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
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/reports">
<span className="material-symbols-outlined">analytics</span>
<span className="font-body-md">Reports</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/users">
<span className="material-symbols-outlined">group</span>
<span className="font-body-md">Users</span>
</a>

<a className="flex items-center gap-unit-md text-primary-fixed border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 px-unit-lg py-unit-md transition-all" href="/admin/roles">
<span className="material-symbols-outlined">admin_panel_settings</span>
<span className="font-body-md">Roles</span>
</a>
</nav>
<div className="px-unit-lg mt-auto">
<button className="w-full bg-primary-fixed text-on-primary-fixed py-unit-md rounded-lg font-label-lg transition-transform active:scale-[0.98]">
                Quick Schedule
            </button>
</div>
</aside>

<main className="ml-sidebar-width min-h-screen">

<header className="flex justify-between items-center px-unit-lg py-unit-sm sticky top-0 z-40 bg-surface/70 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
<div className="flex items-center gap-unit-lg flex-1">
<h2 className="font-headline-md text-headline-md font-extrabold text-primary">Manage Roles</h2>
<div className="relative w-full max-w-md">
<span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="w-full pl-unit-xl pr-unit-md py-2 bg-surface-container border-none rounded-full text-body-sm focus:ring-2 focus:ring-primary" placeholder="Search permissions or users..." type="text"/>
</div>
</div>
<div className="flex items-center gap-unit-md">
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95 duration-150">
<span className="material-symbols-outlined text-on-surface-variant">notifications</span>
</button>
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95 duration-150">
<span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
</button>
<button className="p-unit-sm hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-95 duration-150">
<span className="material-symbols-outlined text-on-surface-variant">settings</span>
</button>
<div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
<img alt="AquaShow Admin Profile" data-alt="A professional headshot of a marine park manager in a corporate setting. The subject is a middle-aged man with a friendly expression, wearing a navy blue blazer and a light blue shirt. The background is a softly blurred office with subtle aquatic-themed decor and cool, bright lighting consistent with a premium management environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAP3bOaXpZivr8g8MgpaVOV3OtOWV4JFY_ObcuoFZ0Q_SaOTuOrlxvLI-HYsGiO3ajFdZNIQlxiF8LY1jLGM8a4uAJerw97bTU08xEV9OsaBOX2PY9bWwYKEwG9zxhR3aWZCQGLhUYNw6lW9ggJlSQ1dss4H4Bt5jKkpBjC2BKBxYbC-nIDxqBfjE1uiXoEQx8hcAkLF0yhmCf2T_NBSsAHZSXb2q1M2AEZtcQvNg4XWEADsvO5gYKTxomN3Nfas8aU11EDRRV6ogDc"/>
</div>
</div>
</header>
<div className="p-unit-lg space-y-unit-lg">

<div className="flex items-center gap-unit-md p-unit-md bg-error-container/20 border border-error/20 rounded-lg text-on-error-container">
<span className="material-symbols-outlined text-error">warning</span>
<p className="font-label-lg">Warning note: Role changes affect access permissions immediately for all connected users.</p>
</div>

<section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-unit-lg">

<div className="glass-card p-unit-lg rounded-lg flex flex-col gap-unit-md border-t-4 border-primary">
<div className="flex justify-between items-start">
<div className="p-unit-sm bg-primary/10 rounded-lg">
<span className="material-symbols-outlined text-primary">person</span>
</div>
<span className="px-unit-sm py-unit-xs bg-surface-container rounded-full text-label-md text-on-surface-variant">42 Active</span>
</div>
<div>
<h3 className="font-headline-md text-primary">USER</h3>
<p className="font-body-sm text-on-surface-variant mt-unit-xs">Default customer access level.</p>
</div>
<ul className="space-y-unit-sm">
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-primary" data-weight="fill">check_circle</span> View Shows
                        </li>
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-primary" data-weight="fill">check_circle</span> Book Tickets
                        </li>
</ul>
</div>

<div className="glass-card p-unit-lg rounded-lg flex flex-col gap-unit-md border-t-4 border-secondary">
<div className="flex justify-between items-start">
<div className="p-unit-sm bg-secondary/10 rounded-lg">
<span className="material-symbols-outlined text-secondary">badge</span>
</div>
<span className="px-unit-sm py-unit-xs bg-surface-container rounded-full text-label-md text-on-surface-variant">12 Active</span>
</div>
<div>
<h3 className="font-headline-md text-secondary">STAFF</h3>
<p className="font-body-sm text-on-surface-variant mt-unit-xs">Operational personnel access.</p>
</div>
<ul className="space-y-unit-sm">
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-secondary" data-weight="fill">check_circle</span> Check-in Guest
                        </li>
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-secondary" data-weight="fill">check_circle</span> View Schedule
                        </li>
</ul>
</div>

<div className="glass-card p-unit-lg rounded-lg flex flex-col gap-unit-md border-t-4 border-primary-container">
<div className="flex justify-between items-start">
<div className="p-unit-sm bg-primary-container/10 rounded-lg">
<span className="material-symbols-outlined text-on-primary-container">supervisor_account</span>
</div>
<span className="px-unit-sm py-unit-xs bg-surface-container rounded-full text-label-md text-on-surface-variant">4 Active</span>
</div>
<div>
<h3 className="font-headline-md text-on-primary-container">MANAGER</h3>
<p className="font-body-sm text-on-surface-variant mt-unit-xs">Departmental authority level.</p>
</div>
<ul className="space-y-unit-sm">
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-primary-container" data-weight="fill">check_circle</span> Edit Schedules
                        </li>
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-primary-container" data-weight="fill">check_circle</span> View Reports
                        </li>
</ul>
</div>

<div className="glass-card p-unit-lg rounded-lg flex flex-col gap-unit-md border-t-4 border-on-secondary-fixed">
<div className="flex justify-between items-start">
<div className="p-unit-sm bg-on-secondary-fixed/10 rounded-lg">
<span className="material-symbols-outlined text-on-secondary-fixed">shield_person</span>
</div>
<span className="px-unit-sm py-unit-xs bg-surface-container rounded-full text-label-md text-on-surface-variant">2 Active</span>
</div>
<div>
<h3 className="font-headline-md text-on-secondary-fixed">ADMIN</h3>
<p className="font-body-sm text-on-surface-variant mt-unit-xs">Full system configuration.</p>
</div>
<ul className="space-y-unit-sm">
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-on-secondary-fixed" data-weight="fill">check_circle</span> Manage Roles
                        </li>
<li className="flex items-center gap-unit-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[18px] text-on-secondary-fixed" data-weight="fill">check_circle</span> System Logs
                        </li>
</ul>
</div>
</section>

<section className="glass-card rounded-lg overflow-hidden">
<div className="p-unit-lg border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-unit-md">
<div>
<h4 className="font-headline-md text-on-surface">User Role Assignment</h4>
<p className="font-body-sm text-on-surface-variant">Modify individual user permissions by assigning a primary role.</p>
</div>
<button className="bg-primary text-white px-unit-lg py-unit-md rounded-full font-label-lg flex items-center gap-unit-sm hover:opacity-90 transition-all shadow-md" onClick={() => window.toggleModal?.(true)}>
<span className="material-symbols-outlined">add</span>
                        Assign Role
                    </button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-container-low">
<tr>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">User</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">Email Address</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">Current Role</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">Last Active</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10">

<tr className="hover:bg-surface-container-lowest/50 transition-colors">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<img className="w-10 h-10 rounded-full" data-alt="A portrait of a young male aquarium trainer in a professional teal polo shirt with a name badge. He is smiling warmly in a bright, sun-drenched aquatic facility with blue water tanks in the distant background. High-key lighting, sharp focus, professional management software aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_LcUUGhWnyVuGqrYH_C6k-1huclO7XuLxGhxndgUl0pFHDehIJ_vm8zFgMgjqhGrhMog8EfhP5n-wu3UBy8YjcZcU4hk5ZcGEhfMgjyg9VAwsd4t66nZKDzq2xT5V8dPrTUwj9bJOqE9pfJ20rzQLfYowaRMpSvq6bbq287G_3PlPnv_UbXkBcuI58hpZhp50uCXWTqi7Q2LN98rwvqrg5LPlcH3VWL71ph8Ma39be0Bh3nfuoVruAoo0HKWU3pwySIxS0AlCO-68"/>
<div>
<p className="font-body-md font-bold text-on-surface">Marcus Chen</p>
<p className="font-body-sm text-on-surface-variant">Emp ID: AQ-772</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">m.chen@aquashow.com</td>
<td className="px-unit-lg py-unit-md">
<span className="px-unit-sm py-1 bg-secondary/10 text-secondary text-label-md rounded-full">STAFF</span>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">2 mins ago</td>
<td className="px-unit-lg py-unit-md text-right">
<button className="text-primary hover:bg-primary/5 p-unit-sm rounded-full transition-colors">
<span className="material-symbols-outlined">edit_square</span>
</button>
</td>
</tr>

<tr className="hover:bg-surface-container-lowest/50 transition-colors">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<img className="w-10 h-10 rounded-full" data-alt="A portrait of a female operations manager at a marine park. She is wearing a professional white blouse and a lanyard. The lighting is soft and professional, set against a modern office background with subtle blue glass accents. Premium, clean, and efficient management aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2AqhEdcBoItrk9mXYvcnR6ENdBXyVnxlVXPeniQPeHCQFlpaBbkX_ZAevV4_iBKn6yiPF2fZP3uO8NyqbG3B2RYcEX-OAs7ItC4vYy52wYlVDIyOKKaTErdNnYDFBbmUXzExQJHR7w1sRW4zeMhkd4NH-TIH3apLfTxLvp5_E0Y1gYM-l476AVWyF9j-iO22eNEbz_n9zUgcPA-odfQRqC8NPxKfXGccmbjY04VuAxTxl74bwvG4gSO3kj8KNplt-mObc4jhvEhXr"/>
<div>
<p className="font-body-md font-bold text-on-surface">Sarah Jennings</p>
<p className="font-body-sm text-on-surface-variant">Emp ID: AQ-401</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">s.jennings@aquashow.com</td>
<td className="px-unit-lg py-unit-md">
<span className="px-unit-sm py-1 bg-primary-container/20 text-on-primary-container text-label-md rounded-full">MANAGER</span>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">1 hour ago</td>
<td className="px-unit-lg py-unit-md text-right">
<button className="text-primary hover:bg-primary/5 p-unit-sm rounded-full transition-colors">
<span className="material-symbols-outlined">edit_square</span>
</button>
</td>
</tr>

<tr className="hover:bg-surface-container-lowest/50 transition-colors">
<td className="px-unit-lg py-unit-md">
<div className="flex items-center gap-unit-md">
<img className="w-10 h-10 rounded-full" data-alt="A portrait of a male IT administrator for a large corporation. He is wearing a dark navy sweater and glasses, looking confident and skilled. The background is a clean, modern data center with blue LED indicators softly blurred. Tech-focused and secure management system style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXpKC-wibyROsdWtiNJwtGpWf1i-SoypvefC9ZKbChQyFUjNzrXWj61Tny-iqUOmJhyvCj1GlJw9CEIEozW5krwkQEp88F5ZBJPsjdUIvl3jdSBhn8gcSttIZZuXXRKm9MZv5qKPkU_WR9V3NPIT7bK8FBKMMkr76bw7hN7_m9A4cbeeflPSNTH3Y_pnAZaXd0YkyIQNV-oL4e4Wvtu7R--Ns3_mOYb25_Iul-VF_8how9bEeDW9cbpmXI5ssig5AGkVyzFkCvRp4x"/>
<div>
<p className="font-body-md font-bold text-on-surface">David Vance</p>
<p className="font-body-sm text-on-surface-variant">Emp ID: AQ-102</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">d.vance@aquashow.com</td>
<td className="px-unit-lg py-unit-md">
<span className="px-unit-sm py-1 bg-on-secondary-fixed/10 text-on-secondary-fixed text-label-md rounded-full">ADMIN</span>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">Online Now</td>
<td className="px-unit-lg py-unit-md text-right">
<button className="text-primary hover:bg-primary/5 p-unit-sm rounded-full transition-colors">
<span className="material-symbols-outlined">edit_square</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<div className="p-unit-lg bg-surface-container-low flex justify-between items-center">
<p className="text-body-sm text-on-surface-variant">Showing 3 of 60 users</p>
<div className="flex gap-unit-sm">
<button className="p-unit-sm hover:bg-surface rounded-full transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
<button className="p-unit-sm bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-label-md">1</button>
<button className="p-unit-sm hover:bg-surface rounded-full transition-colors text-label-md">2</button>
<button className="p-unit-sm hover:bg-surface rounded-full transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
</div>
</div>
</section>
</div>
</main>

<div className="fixed inset-0 z-[100] hidden" id="role-modal">
<div className="absolute inset-0 bg-on-secondary-fixed/40 backdrop-blur-sm" onClick={() => window.toggleModal?.(false)}></div>
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-unit-lg">
<div className="bg-surface rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
<div className="p-unit-lg border-b border-outline-variant/20 flex justify-between items-center">
<h5 className="font-headline-md text-on-surface">Assign New Role</h5>
<button className="text-on-surface-variant hover:text-on-surface" onClick={() => window.toggleModal?.(false)}><span className="material-symbols-outlined">close</span></button>
</div>
<div className="p-unit-lg space-y-unit-md">
<div className="space-y-unit-xs">
<label className="font-label-lg text-on-surface-variant">Select User</label>
<div className="relative">
<select className="w-full bg-surface-container border-outline-variant/20 rounded-lg py-unit-md pl-unit-md pr-unit-xl appearance-none focus:ring-primary focus:border-primary">
<option>Select a user...</option>
<option>Alice Thompson (AQ-882)</option>
<option>Robert Miller (AQ-912)</option>
<option>Elena Rodriguez (AQ-115)</option>
</select>
<span className="material-symbols-outlined absolute right-unit-md top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
</div>
</div>
<div className="space-y-unit-xs">
<label className="font-label-lg text-on-surface-variant">Select Target Role</label>
<div className="grid grid-cols-2 gap-unit-sm">
<button className="border-2 border-primary bg-primary/5 p-unit-md rounded-lg text-left transition-all">
<p className="font-label-lg text-primary">STAFF</p>
<p className="text-[10px] text-on-surface-variant">Operational Access</p>
</button>
<button className="border-2 border-outline-variant/20 p-unit-md rounded-lg text-left hover:border-primary/40 transition-all">
<p className="font-label-lg text-on-surface">MANAGER</p>
<p className="text-[10px] text-on-surface-variant">Team Authority</p>
</button>
</div>
</div>
<div className="p-unit-md bg-tertiary-container/10 rounded-lg flex gap-unit-sm">
<span className="material-symbols-outlined text-tertiary text-[20px]">info</span>
<p className="text-body-sm text-on-tertiary-container">Confirming this action will grant immediate access to sensitive operations.</p>
</div>
</div>
<div className="p-unit-lg bg-surface-container-low flex gap-unit-md">
<button className="flex-1 py-unit-md rounded-full font-label-lg border border-outline hover:bg-surface transition-all" onClick={() => window.toggleModal?.(false)}>Cancel</button>
<button className="flex-1 py-unit-md rounded-full font-label-lg bg-primary text-white hover:opacity-90 shadow-md transition-all" onClick={() => window.confirmAssignment?.()}>Confirm Role</button>
</div>
</div>
</div>
</div>
    </div>
  );
}
