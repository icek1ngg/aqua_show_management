import { useEffect } from 'react';

export default function ManageVenuesPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "function openModal(id) {\r\n            document.getElementById(id).classList.remove('hidden');\r\n            document.body.style.overflow = 'hidden';\r\n        }\r\n\r\n        function closeModal(id) {\r\n            document.getElementById(id).classList.add('hidden');\r\n            document.body.style.overflow = 'auto';\r\n        }\r\n\r\n        // Lightweight entrance animations\r\n        window.addEventListener('DOMContentLoaded', () => {\r\n            const cards = document.querySelectorAll('.glass-card');\r\n            cards.forEach((card, index) => {\r\n                card.style.opacity = '0';\r\n                card.style.transform = 'translateY(20px)';\r\n                setTimeout(() => {\r\n                    card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';\r\n                    card.style.opacity = '1';\r\n                    card.style.transform = 'translateY(0)';\r\n                }, index * 100);\r\n            });\r\n        });";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen">
      <style>{"body { font-family: 'Plus Jakarta Sans', sans-serif; }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n        }\r\n        .sidebar-bg { background-color: #001f28; }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }"}</style>
<aside className="fixed left-0 top-0 h-full w-sidebar-width bg-on-secondary-fixed shadow-lg flex flex-col py-unit-lg z-50">
<div className="px-unit-lg mb-unit-xl">
<h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
<p className="font-body-md text-body-md text-on-secondary-fixed-variant opacity-70">Management System</p>
</div>
<nav className="flex-1 space-y-unit-xs">

<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/dashboard">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-body-md text-body-md">Dashboard</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/shows">
<span className="material-symbols-outlined" data-icon="theater_comedy">theater_comedy</span>
<span className="font-body-md text-body-md">Shows</span>
</a>
<a className="flex items-center gap-unit-md text-primary-fixed border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 px-unit-lg py-unit-md" href="/manager/venues">
<span className="material-symbols-outlined" data-icon="water_drop">water_drop</span>
<span className="font-body-md text-body-md">Venues</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/schedules">
<span className="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
<span className="font-body-md text-body-md">Schedules</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/bookings">
<span className="material-symbols-outlined" data-icon="event_seat">event_seat</span>
<span className="font-body-md text-body-md">Bookings</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/reports">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
<span className="font-body-md text-body-md">Reports</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/users">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="font-body-md text-body-md">Users</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/roles">
<span className="material-symbols-outlined" data-icon="admin_panel_settings">admin_panel_settings</span>
<span className="font-body-md text-body-md">Roles</span>
</a>
</nav>
<div className="px-unit-lg mt-auto">
<button className="w-full bg-primary-container text-on-primary-container py-unit-md rounded-lg font-label-lg text-label-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
                Quick Schedule
            </button>
</div>
</aside>

<main className="ml-sidebar-width flex flex-col min-h-screen">

<header className="flex justify-between items-center px-unit-lg py-unit-sm sticky top-0 z-40 bg-surface/70 backdrop-blur-md border-b border-outline-variant/20 shadow-sm h-16">
<div className="flex items-center gap-unit-lg">
<h2 className="font-headline-md text-headline-md font-extrabold text-primary">Manage Venues</h2>
<div className="relative hidden lg:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="search">search</span>
<input className="bg-surface-container border-none rounded-full pl-10 pr-4 py-2 font-body-sm text-body-sm focus:ring-2 focus:ring-primary w-64 transition-all" placeholder="Search venues..." type="text"/>
</div>
</div>
<div className="flex items-center gap-unit-md">
<button className="p-2 hover:bg-surface-container-high/50 rounded-full transition-colors relative">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="notifications">notifications</span>
<span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
</button>
<button className="p-2 hover:bg-surface-container-high/50 rounded-full transition-colors">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="help_outline">help_outline</span>
</button>
<button className="p-2 hover:bg-surface-container-high/50 rounded-full transition-colors">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="settings">settings</span>
</button>
<div className="h-8 w-[1px] bg-outline-variant/30 mx-unit-sm"></div>
<div className="flex items-center gap-unit-sm cursor-pointer hover:bg-surface-container-high/50 p-1 pr-3 rounded-full transition-all">
<img alt="AquaShow Admin Profile" className="w-8 h-8 rounded-full object-cover border-2 border-primary-fixed" data-alt="A professional close-up portrait of a corporate executive in a modern, brightly lit office environment. The lighting is soft and flattering, emphasizing a clean and professional look. The background is a mix of soft aquamarine and white tones, matching a high-end management interface aesthetic. The overall mood is confident and efficient." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzcfET9JJRH7miDbhOmvQ6XWdQPi9hB-IsG-AdU-OiKPhg7vpMofMdTyFRlMp5c9OJaRQxsG3O4Gm3szdWv8OkULBVh8JSwZ4c-_G4cV5B1SsC2crTMBV8Yg8GZdM1Ac4HtecWo_kUv_Azb3vzRn7jD5zbigYjh4GBjLzgQyrGoJ9NfLI--CIKerHZzlnRMJQZsDvQ-z0O7f3YAuD7ROdUreRUMzKr0nfCAKQy87HKYkVAw57gErfDGOp38BiI2puldnf_p99FK1Ur"/>
<span className="font-label-lg text-label-lg text-on-surface">Admin</span>
</div>
</div>
</header>

<div className="p-unit-lg space-y-unit-lg">

<section className="grid grid-cols-1 md:grid-cols-3 gap-unit-lg">
<div className="glass-card p-unit-lg rounded-lg shadow-sm flex items-center justify-between overflow-hidden relative group">
<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
<span className="material-symbols-outlined text-[120px] text-primary" data-icon="account_balance">account_balance</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface-variant mb-unit-sm">Total Venues</p>
<h3 className="font-headline-xl text-headline-xl text-primary">05</h3>
<p className="font-body-sm text-body-sm text-on-primary-fixed-variant mt-2 flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-primary" data-icon="trending_up">trending_up</span>
                            +1 this quarter
                        </p>
</div>
<div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
<span className="material-symbols-outlined" data-icon="corporate_fare">corporate_fare</span>
</div>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm flex items-center justify-between overflow-hidden relative group">
<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
<span className="material-symbols-outlined text-[120px] text-secondary" data-icon="check_circle">check_circle</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface-variant mb-unit-sm">Active Venues</p>
<h3 className="font-headline-xl text-headline-xl text-secondary">04</h3>
<p className="font-body-sm text-body-sm text-secondary mt-2 flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]" data-icon="visibility">visibility</span>
                            80% operational rate
                        </p>
</div>
<div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
<span className="material-symbols-outlined" data-icon="sensors">sensors</span>
</div>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm flex items-center justify-between overflow-hidden relative group">
<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
<span className="material-symbols-outlined text-[120px] text-tertiary" data-icon="groups">groups</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface-variant mb-unit-sm">Total Capacity</p>
<h3 className="font-headline-xl text-headline-xl text-tertiary">2,500</h3>
<p className="font-body-sm text-body-sm text-tertiary-container mt-2 flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]" data-icon="airline_seat_recline_extra">airline_seat_recline_extra</span>
                            Max combined occupancy
                        </p>
</div>
<div className="w-12 h-12 bg-tertiary/10 rounded-full flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined" data-icon="diversity_3">diversity_3</span>
</div>
</div>
</section>

<section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-unit-md">
<div className="flex gap-2">
<button className="px-unit-md py-unit-sm bg-surface-container text-on-surface-variant rounded-full font-label-lg text-label-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-[18px]" data-icon="filter_list">filter_list</span>
                        Filter
                    </button>
<button className="px-unit-md py-unit-sm bg-surface-container text-on-surface-variant rounded-full font-label-lg text-label-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-[18px]" data-icon="download">download</span>
                        Export
                    </button>
</div>
<button className="px-unit-lg py-unit-md bg-primary text-on-primary rounded-full font-label-lg text-label-lg flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all" onClick={() => window.openModal?.('addVenueModal')}>
<span className="material-symbols-outlined text-[20px]" data-icon="add_circle">add_circle</span>
                    Add Venue
                </button>
</section>

<section className="glass-card rounded-lg shadow-sm overflow-hidden">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low border-b border-outline-variant/30">
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Venue Name</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Location</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Capacity</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Status</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/20">

<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-unit-lg py-unit-lg">
<div className="flex items-center gap-unit-md">
<div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined" data-icon="scuba_diving">scuba_diving</span>
</div>
<div>
<p className="font-body-md text-body-md font-bold text-on-surface">The Grand Lagoon</p>
<p className="font-body-sm text-body-sm text-on-surface-variant">Main Arena</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-lg font-body-md text-body-md text-on-surface-variant">East Sector, Zone A</td>
<td className="px-unit-lg py-unit-lg">
<span className="font-body-md text-body-md text-on-surface">1,200</span>
</td>
<td className="px-unit-lg py-unit-lg">
<span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-label-md uppercase tracking-wider">Active</span>
</td>
<td className="px-unit-lg py-unit-lg text-right">
<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="edit">edit</span>
</button>
<button className="p-2 hover:bg-error/10 rounded-full text-error transition-colors" onClick={() => window.openModal?.('deactivateModal')}>
<span className="material-symbols-outlined" data-icon="do_not_disturb_on">do_not_disturb_on</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-unit-lg py-unit-lg">
<div className="flex items-center gap-unit-md">
<div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined" data-icon="waves">waves</span>
</div>
<div>
<p className="font-body-md text-body-md font-bold text-on-surface">Coral Reef Theatre</p>
<p className="font-body-sm text-body-sm text-on-surface-variant">Educational Hub</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-lg font-body-md text-body-md text-on-surface-variant">North Wing, Level 2</td>
<td className="px-unit-lg py-unit-lg">
<span className="font-body-md text-body-md text-on-surface">450</span>
</td>
<td className="px-unit-lg py-unit-lg">
<span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-label-md uppercase tracking-wider">Active</span>
</td>
<td className="px-unit-lg py-unit-lg text-right">
<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="edit">edit</span>
</button>
<button className="p-2 hover:bg-error/10 rounded-full text-error transition-colors" onClick={() => window.openModal?.('deactivateModal')}>
<span className="material-symbols-outlined" data-icon="do_not_disturb_on">do_not_disturb_on</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-unit-lg py-unit-lg">
<div className="flex items-center gap-unit-md">
<div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined" data-icon="bubble_chart">bubble_chart</span>
</div>
<div>
<p className="font-body-md text-body-md font-bold text-on-surface">Deep Sea Dome</p>
<p className="font-body-sm text-body-sm text-on-surface-variant">Immersive Space</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-lg font-body-md text-body-md text-on-surface-variant">Underground Level B1</td>
<td className="px-unit-lg py-unit-lg">
<span className="font-body-md text-body-md text-on-surface">300</span>
</td>
<td className="px-unit-lg py-unit-lg">
<span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-label-md uppercase tracking-wider">Active</span>
</td>
<td className="px-unit-lg py-unit-lg text-right">
<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="edit">edit</span>
</button>
<button className="p-2 hover:bg-error/10 rounded-full text-error transition-colors" onClick={() => window.openModal?.('deactivateModal')}>
<span className="material-symbols-outlined" data-icon="do_not_disturb_on">do_not_disturb_on</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-unit-lg py-unit-lg">
<div className="flex items-center gap-unit-md">
<div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined" data-icon="construction">construction</span>
</div>
<div>
<p className="font-body-md text-body-md font-bold text-on-surface">Splash Plaza</p>
<p className="font-body-sm text-body-sm text-on-surface-variant">Outdoor Stage</p>
</div>
</div>
</td>
<td className="px-unit-lg py-unit-lg font-body-md text-body-md text-on-surface-variant">South Pier</td>
<td className="px-unit-lg py-unit-lg">
<span className="font-body-md text-body-md text-on-surface">550</span>
</td>
<td className="px-unit-lg py-unit-lg">
<span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary font-label-md text-label-md uppercase tracking-wider">Maintenance</span>
</td>
<td className="px-unit-lg py-unit-lg text-right">
<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="edit">edit</span>
</button>
<button className="p-2 hover:bg-error/10 rounded-full text-error transition-colors" onClick={() => window.openModal?.('deactivateModal')}>
<span className="material-symbols-outlined" data-icon="do_not_disturb_on">do_not_disturb_on</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
</main>

<div aria-labelledby="modal-title" aria-modal="true" className="fixed inset-0 z-50 hidden overflow-y-auto" id="addVenueModal" role="dialog">
<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
<div aria-hidden="true" className="fixed inset-0 bg-on-secondary-fixed/60 backdrop-blur-sm transition-opacity" onClick={() => window.closeModal?.('addVenueModal')}></div>
<span aria-hidden="true" className="hidden sm:inline-block sm:align-middle sm:h-screen">​</span>
<div className="inline-block align-bottom glass-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/30">
<div className="px-unit-lg py-unit-lg">
<div className="flex items-center justify-between mb-unit-lg">
<h3 className="font-headline-lg text-headline-lg text-on-surface" id="modal-title">Add New Venue</h3>
<button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => window.closeModal?.('addVenueModal')}>
<span className="material-symbols-outlined" data-icon="close">close</span>
</button>
</div>
<form className="space-y-unit-md">
<div>
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-1">Venue Name</label>
<input className="w-full bg-surface-container-low border border-outline-variant/50 rounded-[12px] px-unit-md py-unit-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Blue Whale Atrium" type="text"/>
</div>
<div>
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-1">Location</label>
<input className="w-full bg-surface-container-low border border-outline-variant/50 rounded-[12px] px-unit-md py-unit-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Level 3, Wing B" type="text"/>
</div>
<div className="grid grid-cols-2 gap-unit-md">
<div>
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-1">Capacity</label>
<input className="w-full bg-surface-container-low border border-outline-variant/50 rounded-[12px] px-unit-md py-unit-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="500" type="number"/>
</div>
<div>
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-1">Status</label>
<select className="w-full bg-surface-container-low border border-outline-variant/50 rounded-[12px] px-unit-md py-unit-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all">
<option>Active</option>
<option>Maintenance</option>
<option>Inactive</option>
</select>
</div>
</div>
<div className="pt-unit-lg flex flex-col gap-2">
<button className="w-full bg-primary text-on-primary py-unit-md rounded-full font-label-lg text-label-lg shadow-lg hover:opacity-90 transition-all" type="button">Save Venue</button>
<button className="w-full bg-transparent text-on-surface-variant py-unit-md rounded-full font-label-lg text-label-lg hover:bg-surface-container-high transition-all" onClick={() => window.closeModal?.('addVenueModal')} type="button">Cancel</button>
</div>
</form>
</div>
</div>
</div>
</div>

<div aria-labelledby="modal-title" aria-modal="true" className="fixed inset-0 z-50 hidden overflow-y-auto" id="deactivateModal" role="dialog">
<div className="flex items-center justify-center min-h-screen px-4">
<div aria-hidden="true" className="fixed inset-0 bg-on-secondary-fixed/60 backdrop-blur-sm transition-opacity" onClick={() => window.closeModal?.('deactivateModal')}></div>
<div className="relative glass-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-md w-full border border-white/30 p-unit-lg">
<div className="text-center">
<div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error/10 text-error mb-unit-lg">
<span className="material-symbols-outlined text-[32px]" data-icon="warning">warning</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-unit-sm">Deactivate Venue?</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-unit-xl">
                        This action will mark the venue as inactive. All scheduled shows in this venue will be flagged for review.
                    </p>
</div>
<div className="flex flex-col gap-2">
<button className="w-full bg-error text-on-error py-unit-md rounded-full font-label-lg text-label-lg shadow-lg hover:opacity-90 transition-all" type="button">Confirm Deactivation</button>
<button className="w-full bg-transparent text-on-surface-variant py-unit-md rounded-full font-label-lg text-label-lg hover:bg-surface-container-high transition-all" onClick={() => window.closeModal?.('deactivateModal')} type="button">Back to Safety</button>
</div>
</div>
</div>
</div>
    </div>
  );
}
