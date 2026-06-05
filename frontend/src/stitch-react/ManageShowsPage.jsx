import { useEffect } from 'react';

export default function ManageShowsPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "function toggleModal(modalId) {\r\n            const modal = document.getElementById(modalId);\r\n            const isHidden = modal.classList.contains('hidden');\r\n            \r\n            if (isHidden) {\r\n                modal.classList.remove('hidden');\r\n                modal.classList.add('flex');\r\n                setTimeout(() => {\r\n                    const content = modal.querySelector('div:not(.absolute)');\r\n                    if (content) content.classList.remove('scale-95', 'opacity-0');\r\n                    if (content) content.classList.add('scale-100', 'opacity-100');\r\n                }, 10);\r\n            } else {\r\n                const content = modal.querySelector('div:not(.absolute)');\r\n                if (content) content.classList.remove('scale-100', 'opacity-100');\r\n                if (content) content.classList.add('scale-95', 'opacity-0');\r\n                setTimeout(() => {\r\n                    modal.classList.add('hidden');\r\n                    modal.classList.remove('flex');\r\n                }, 200);\r\n            }\r\n        }\r\n\r\n        // Search highlight interaction\r\n        const searchInput = document.querySelector('input[type=\"text\"]');\r\n        searchInput.addEventListener('focus', () => {\r\n            searchInput.parentElement.classList.add('ring-2', 'ring-primary-container');\r\n        });\r\n        searchInput.addEventListener('blur', () => {\r\n            searchInput.parentElement.classList.remove('ring-2', 'ring-primary-container');\r\n        });";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="bg-background text-on-surface overflow-x-hidden">
      <style>{"body {\r\n            font-family: 'Plus Jakarta Sans', sans-serif;\r\n            background-color: #f1fbfb;\r\n        }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(12px);\r\n            border: 1px solid rgba(255, 255, 255, 0.3);\r\n        }\r\n        .sidebar-active {\r\n            border-left: 4px solid #5af8fb;\r\n            background: rgba(25, 77, 93, 0.3);\r\n        }"}</style>
<aside className="fixed left-0 top-0 h-full w-sidebar-width bg-on-secondary-fixed shadow-lg flex flex-col py-unit-lg z-50">
<div className="px-unit-lg mb-unit-xl">
<h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
<p className="font-body-sm text-body-sm text-on-secondary-fixed-variant opacity-70">Management System</p>
</div>
<nav className="flex-grow space-y-unit-xs">

<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/dashboard">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-body-md text-body-md">Dashboard</span>
</a>

<a className="flex items-center gap-unit-md text-primary-fixed border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 px-unit-lg py-unit-md" href="/manager/shows">
<span className="material-symbols-outlined" data-icon="theater_comedy">theater_comedy</span>
<span className="font-body-md text-body-md">Shows</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/venues">
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
<button className="w-full bg-primary-fixed text-on-primary-fixed py-unit-md rounded-lg font-label-lg text-label-lg hover:brightness-110 active:scale-95 transition-all shadow-md" onClick={() => window.toggleModal?.('createModal')}>
                Quick Schedule
            </button>
</div>
</aside>

<header className="flex justify-between items-center px-unit-lg py-unit-sm ml-sidebar-width w-[calc(100%-theme(spacing.sidebar-width))] bg-surface/70 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/20">
<div className="flex items-center gap-unit-md">
<div className="relative w-64">
<input className="w-full bg-surface-container-low border-none rounded-full px-unit-lg py-2 focus:ring-2 focus:ring-primary-container text-body-sm" placeholder="Search shows..." type="text"/>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant scale-75" data-icon="search">search</span>
</div>
</div>
<div className="flex items-center gap-unit-lg">
<button className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="notifications">notifications</span>
</button>
<button className="p-2 rounded-full hover:bg-surface-container-high/50 transition-colors">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="settings">settings</span>
</button>
<div className="flex items-center gap-unit-md ml-unit-md border-l border-outline-variant pl-unit-lg">
<div className="text-right">
<p className="font-label-lg text-label-lg text-on-surface">Admin User</p>
<p className="text-[10px] text-on-surface-variant">Manager</p>
</div>
<img alt="User Profile Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0iWrWxq_J7bzXYI_AY1PTe7d9EKcNjKSoIcf5vOfLAt_FBAJuFhHU3Ikg2CIE5lz2ki_2zGKfjNLh6PwwfbPe3uNiD43CjLgI3Aiuwrwx7l2VwRI5xymZraYqmbkhuLullF-nVMi_Fmbv7QymgpKWiqGlavF3knGyMW5pDQdH2txt_xTCcUwFWW2jzbZabYi4_U_4-3esI-_6iM9UMxUYTksaX75K0jGDGW-p7AhixQwaJwGIpq8ufDN6BumsEI-fVkfMxAQoIIuu"/>
</div>
</div>
</header>

<main className="ml-sidebar-width min-h-screen p-unit-lg">
<div className="max-w-7xl mx-auto space-y-unit-xl">

<div className="flex justify-between items-end">
<div>
<h2 className="font-headline-xl text-headline-xl text-primary">Manage Shows</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Oversee all marine entertainment productions and logistics.</p>
</div>
<button className="bg-primary text-on-primary px-unit-xl py-unit-md rounded-full font-label-lg text-label-lg flex items-center gap-unit-md hover:shadow-lg transition-all active:scale-95" onClick={() => window.toggleModal?.('createModal')}>
<span className="material-symbols-outlined" data-icon="add">add</span>
                    Create New Show
                </button>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-unit-lg">
<div className="glass-card p-unit-lg rounded-lg shadow-sm">
<div className="flex justify-between items-start mb-unit-md">
<div className="p-unit-sm bg-primary-container/30 rounded-lg">
<span className="material-symbols-outlined text-primary" data-icon="theater_comedy">theater_comedy</span>
</div>
<span className="text-label-md text-on-surface-variant">+2 this month</span>
</div>
<p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Total Shows</p>
<p className="font-headline-lg text-headline-lg text-on-surface">12</p>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm border-l-4 border-primary">
<div className="flex justify-between items-start mb-unit-md">
<div className="p-unit-sm bg-primary-container/30 rounded-lg">
<span className="material-symbols-outlined text-primary" data-icon="check_circle">check_circle</span>
</div>
<span className="text-label-md text-primary font-bold">Active</span>
</div>
<p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Active Shows</p>
<p className="font-headline-lg text-headline-lg text-on-surface">8</p>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm">
<div className="flex justify-between items-start mb-unit-md">
<div className="p-unit-sm bg-error-container/30 rounded-lg">
<span className="material-symbols-outlined text-error" data-icon="pause_circle">pause_circle</span>
</div>
<span className="text-label-md text-error font-bold">Paused</span>
</div>
<p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Inactive Shows</p>
<p className="font-headline-lg text-headline-lg text-on-surface">2</p>
</div>
<div className="glass-card p-unit-lg rounded-lg shadow-sm">
<div className="flex justify-between items-start mb-unit-md">
<div className="p-unit-sm bg-tertiary-container/30 rounded-lg">
<span className="material-symbols-outlined text-tertiary" data-icon="schedule">schedule</span>
</div>
<span className="text-label-md text-tertiary font-bold">Soon</span>
</div>
<p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Upcoming Shows</p>
<p className="font-headline-lg text-headline-lg text-on-surface">2</p>
</div>
</div>

<div className="glass-card rounded-lg overflow-hidden shadow-md">
<div className="p-unit-lg border-b border-outline-variant/30 flex justify-between items-center">
<h3 className="font-headline-md text-headline-md text-on-surface">Show Catalog</h3>
<div className="flex gap-unit-md">
<button className="flex items-center gap-unit-sm text-label-lg text-on-surface-variant px-unit-md py-unit-sm border border-outline-variant rounded-full hover:bg-surface-variant/30">
<span className="material-symbols-outlined text-sm" data-icon="filter_list">filter_list</span>
                            Filter
                        </button>
<button className="flex items-center gap-unit-sm text-label-lg text-on-surface-variant px-unit-md py-unit-sm border border-outline-variant rounded-full hover:bg-surface-variant/30">
<span className="material-symbols-outlined text-sm" data-icon="download">download</span>
                            Export
                        </button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead className="bg-surface-container-low">
<tr>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Image</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Title</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Duration</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Status</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Created At</th>
<th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/20">

<tr className="hover:bg-primary-container/5 transition-colors group">
<td className="px-unit-lg py-unit-md">
<img className="w-16 h-12 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform" data-alt="A professional high-resolution photograph of a majestic dolphin leaping gracefully through a turquoise water ring in a modern aquatic stadium. The lighting is bright and clear, reflecting a premium light-mode aesthetic with soft teal and white water splashes. The atmosphere is energetic and expertly managed, showcasing the peak of marine entertainment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGv1p38H7OadNEaIuXdWb3grDkYf0losplVkkhDiN-Ip-WsAm0te-6vi1dNmYZfH8LzbKsE78pjgMmaQrkvX4ItLPk6nkce03kqztzTijEWZxWhmMUuMl4uI6XlDovYcJdl_OZSXCwof7DmsGz4q2zCOTZR6cSVudQiwADViJ9dg8HoIW-iXsFG05g-c5Z2rzFjApGssB6GTywMfz9BqfdczOP7JLvnsXArQOx4evFGZ-S0vSdNTAes7wt6wZGuWrkgiDM8f55UC0U"/>
</td>
<td className="px-unit-lg py-unit-md">
<p className="font-body-md text-body-md font-bold text-on-surface">Dolphin Dreams Spectacular</p>
<p className="text-[12px] text-on-surface-variant">Main Lagoon Arena</p>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-body-sm">45 Mins</td>
<td className="px-unit-lg py-unit-md">
<span className="px-3 py-1 bg-primary-container/20 text-primary rounded-full text-label-md font-bold">Active</span>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-body-sm text-on-surface-variant">Oct 12, 2023</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="visibility">visibility</span></button>
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
<button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => window.toggleModal?.('confirmModal')}><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-primary-container/5 transition-colors group">
<td className="px-unit-lg py-unit-md">
<img className="w-16 h-12 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform" data-alt="A cinematic low-angle shot of a massive whale tail splashing into a deep blue pool within an ultra-modern aquatic center. The scene is illuminated by dramatic theatrical lighting with highlights of crisp white and deep teal water. The aesthetic is clean, sophisticated, and grand, capturing a moment of powerful natural beauty in a controlled entertainment environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQAFCVm8-uESwj3m1FNlNuIFwwXxwpK1Yb72cRQxsj21v1x-vVbPCaKAlFlVuRSFVUMz1yOWEYQbKGHmopxMjQxlclKZx5AiT3_cGtwQQfTjqDKmN9JqyhWHUJyhx40YeXz1jez_7ywuhT7bDm2zmWzRplsQk6jAVTg75FcvMlBZMXjqEoqy9mjz2ERoPSWa5YVKDZFGon-OjJX8nJbt5K1N-IElOjHcr5lp5Ncd3zbB7jCus7uLCxbkmS2Ejjn2nkTrsjfzcZAZXF"/>
</td>
<td className="px-unit-lg py-unit-md">
<p className="font-body-md text-body-md font-bold text-on-surface">Majestic Blue Voyage</p>
<p className="text-[12px] text-on-surface-variant">Deep Sea Theatre</p>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-body-sm">60 Mins</td>
<td className="px-unit-lg py-unit-md">
<span className="px-3 py-1 bg-primary-container/20 text-primary rounded-full text-label-md font-bold">Active</span>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-body-sm text-on-surface-variant">Nov 05, 2023</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="visibility">visibility</span></button>
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
<button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => window.toggleModal?.('confirmModal')}><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
</div>
</td>
</tr>

<tr className="hover:bg-primary-container/5 transition-colors group opacity-70">
<td className="px-unit-lg py-unit-md">
<img className="w-16 h-12 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform grayscale" data-alt="A serene underwater scene featuring a group of colorful tropical fish swimming through a pristine coral reef exhibit. The water is crystal clear with a vibrant aquamarine tint, reflecting a bright and clean architectural style. Soft sunlight filters through the water surface creating dancing patterns on the white sandy floor of the tank. The mood is tranquil, premium, and perfectly balanced." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZZWAYtndYSxJmLAU-WIMHnNrALHaxPjpllL3ClCVQW0FI4rI5VTW_uWBtK5oPB0GRe-hw89LX8__KLNtoHwdNQthIWvlnCXZWjr1PWNiiq9zAHKb1dGLi0wwKzG-cFuzDd4nHgKIHPPDSiV1uBXZJ71pR-iYIFvH_LkYNKpFiCeiWFmGUj0tirQFEbN3HDtlX1FnWJz_wB02v4fZv6UFeG1PXk5B5MMxoJSzhh_kDVI7X4Ipo8U-v0ybziwRlJUiwJ791RrU1lOd6"/>
</td>
<td className="px-unit-lg py-unit-md">
<p className="font-body-md text-body-md font-bold text-on-surface">Neon Reef Explorer</p>
<p className="text-[12px] text-on-surface-variant">Interactive Zone</p>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-body-sm">30 Mins</td>
<td className="px-unit-lg py-unit-md">
<span className="px-3 py-1 bg-outline-variant/30 text-on-surface-variant rounded-full text-label-md font-bold">Inactive</span>
</td>
<td className="px-unit-lg py-unit-md font-body-sm text-body-sm text-on-surface-variant">Jan 14, 2024</td>
<td className="px-unit-lg py-unit-md text-right">
<div className="flex justify-end gap-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="visibility">visibility</span></button>
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
<button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => window.toggleModal?.('confirmModal')}><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
<div className="p-unit-lg flex justify-between items-center bg-surface-container-low/50">
<p className="font-body-sm text-body-sm text-on-surface-variant">Showing 3 of 12 shows</p>
<div className="flex gap-unit-sm">
<button className="px-unit-md py-2 border border-outline-variant rounded-lg text-label-lg opacity-50 cursor-not-allowed">Previous</button>
<button className="px-unit-md py-2 bg-primary-container text-on-primary-container rounded-lg text-label-lg hover:brightness-110">Next</button>
</div>
</div>
</div>
</div>
</main>

<div className="fixed inset-0 z-[60] hidden flex items-center justify-center p-unit-lg" id="createModal">
<div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => window.toggleModal?.('createModal')}></div>
<div className="relative w-full max-w-2xl bg-surface rounded-lg shadow-2xl overflow-hidden scale-95 transition-transform duration-300" id="createModalContent">
<div className="p-unit-lg border-b border-outline-variant/30 flex justify-between items-center">
<h4 className="font-headline-md text-headline-md text-primary">Create New Show</h4>
<button className="p-2 rounded-full hover:bg-surface-variant transition-colors" onClick={() => window.toggleModal?.('createModal')}>
<span className="material-symbols-outlined" data-icon="close">close</span>
</button>
</div>
<form className="p-unit-lg space-y-unit-md">
<div className="grid grid-cols-2 gap-unit-lg">
<div className="col-span-2">
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-unit-sm">Show Title</label>
<input className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-unit-md py-3 focus:ring-2 focus:ring-primary outline-none text-body-md" placeholder="Enter show name..." type="text"/>
</div>
<div className="col-span-2">
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-unit-sm">Description</label>
<textarea className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-unit-md py-3 focus:ring-2 focus:ring-primary outline-none text-body-md" placeholder="Describe the show experience..." rows="3"></textarea>
</div>
<div>
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-unit-sm">Duration (Mins)</label>
<input className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-unit-md py-3 focus:ring-2 focus:ring-primary outline-none text-body-md" type="number" defaultValue="45"/>
</div>
<div>
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-unit-sm">Initial Status</label>
<select className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-unit-md py-3 focus:ring-2 focus:ring-primary outline-none text-body-md">
<option>Active</option>
<option>Inactive</option>
<option>Draft</option>
</select>
</div>
<div className="col-span-2">
<label className="block font-label-lg text-label-lg text-on-surface-variant mb-unit-sm">Cover Image URL</label>
<input className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-unit-md py-3 focus:ring-2 focus:ring-primary outline-none text-body-md" placeholder="https://..." type="url"/>
</div>
</div>
<div className="pt-unit-lg flex justify-end gap-unit-md border-t border-outline-variant/20">
<button className="px-unit-xl py-unit-md text-label-lg text-on-surface-variant hover:bg-surface-variant rounded-full transition-all" onClick={() => window.toggleModal?.('createModal')} type="button">Cancel</button>
<button className="px-unit-xl py-unit-md bg-primary text-on-primary rounded-full font-label-lg text-label-lg hover:shadow-lg transition-all shadow-md" type="submit">Create Show</button>
</div>
</form>
</div>
</div>

<div className="fixed inset-0 z-[60] hidden flex items-center justify-center p-unit-lg" id="confirmModal">
<div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => window.toggleModal?.('confirmModal')}></div>
<div className="relative w-full max-w-md bg-surface rounded-lg shadow-2xl overflow-hidden p-unit-lg text-center">
<div className="w-16 h-16 bg-error-container/20 rounded-full flex items-center justify-center mx-auto mb-unit-lg">
<span className="material-symbols-outlined text-error text-4xl" data-icon="warning">warning</span>
</div>
<h4 className="font-headline-md text-headline-md text-on-surface mb-unit-sm">Deactivate Show?</h4>
<p className="font-body-md text-body-md text-on-surface-variant mb-unit-xl">This will hide the show from the booking portal and guest views immediately. You can re-activate it later.</p>
<div className="flex gap-unit-md">
<button className="flex-1 px-unit-md py-unit-md border border-outline-variant rounded-full font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-variant transition-all" onClick={() => window.toggleModal?.('confirmModal')}>Cancel</button>
<button className="flex-1 px-unit-md py-unit-md bg-error text-on-error rounded-full font-label-lg text-label-lg hover:brightness-110 shadow-md" onClick={() => window.toggleModal?.('confirmModal')}>Yes, Deactivate</button>
</div>
</div>
</div>
    </div>
  );
}
