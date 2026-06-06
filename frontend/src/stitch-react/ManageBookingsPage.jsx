import { useEffect } from 'react';

export default function ManageBookingsPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = "function openSidePanel(id, customer, show, time, qty, total, status, payment, email) {\r\n            const panel = document.getElementById('side-panel');\r\n            const backdrop = document.getElementById('panel-backdrop');\r\n            \r\n            // Fill details\r\n            document.getElementById('panel-booking-id').innerText = id;\r\n            document.getElementById('panel-customer-name').innerText = customer;\r\n            document.getElementById('panel-customer-email').innerText = email;\r\n            document.getElementById('panel-show-name').innerText = show;\r\n            document.getElementById('panel-schedule-time').innerText = time;\r\n            document.getElementById('panel-quantity').innerText = qty;\r\n            document.getElementById('panel-total-amount').innerText = total;\r\n            document.getElementById('panel-total-final').innerText = total;\r\n            \r\n            const statusBadge = document.getElementById('panel-booking-status');\r\n            statusBadge.innerText = status;\r\n            if (status === 'Pending') {\r\n                statusBadge.className = 'bg-tertiary-container/30 text-on-tertiary-container px-3 py-1 rounded-full text-label-md font-bold w-fit text-center';\r\n            } else {\r\n                statusBadge.className = 'bg-primary-container/30 text-on-primary-container px-3 py-1 rounded-full text-label-md font-bold w-fit text-center';\r\n            }\r\n\r\n            const paymentBadge = document.getElementById('panel-payment-status');\r\n            paymentBadge.innerHTML = `<span class=\"material-symbols-outlined text-[14px]\" style=\"font-variation-settings: 'FILL' 1;\">${payment === 'Paid' ? 'check_circle' : 'hourglass_empty'}</span> ${payment}`;\r\n            if (payment === 'Unpaid') {\r\n                paymentBadge.className = 'bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-label-md font-bold flex items-center gap-1 justify-end';\r\n            } else {\r\n                paymentBadge.className = 'bg-primary/10 text-primary px-3 py-1 rounded-full text-label-md font-bold flex items-center gap-1 justify-end';\r\n            }\r\n\r\n            // Show panel\r\n            panel.classList.remove('translate-x-full');\r\n            backdrop.classList.remove('hidden');\r\n            setTimeout(() => {\r\n                backdrop.classList.add('opacity-100');\r\n            }, 10);\r\n        }\r\n\r\n        function closeSidePanel() {\r\n            const panel = document.getElementById('side-panel');\r\n            const backdrop = document.getElementById('panel-backdrop');\r\n            \r\n            panel.classList.add('translate-x-full');\r\n            backdrop.classList.remove('opacity-100');\r\n            setTimeout(() => {\r\n                backdrop.classList.add('hidden');\r\n            }, 300);\r\n        }";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="bg-background text-on-surface overflow-hidden h-screen flex">
      <style>{"body {\r\n            font-family: 'Plus Jakarta Sans', sans-serif;\r\n            background-color: #f1fbfb;\r\n        }\r\n        .glass-panel {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n        }\r\n        .custom-scrollbar::-webkit-scrollbar {\r\n            width: 6px;\r\n        }\r\n        .custom-scrollbar::-webkit-scrollbar-track {\r\n            background: transparent;\r\n        }\r\n        .custom-scrollbar::-webkit-scrollbar-thumb {\r\n            background: #bac9c9;\r\n            border-radius: 10px;\r\n        }\r\n        .side-panel-transition {\r\n            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);\r\n        }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }"}</style>
<aside className="fixed left-0 top-0 h-full w-sidebar-width bg-on-secondary-fixed shadow-lg flex flex-col py-unit-lg z-50">
<div className="px-unit-lg mb-unit-xl">
<h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
<p className="text-on-secondary-fixed-variant font-label-md">Management System</p>
</div>
<nav className="flex-1 space-y-unit-xs">
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/dashboard">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-body-md">Dashboard</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/shows">
<span className="material-symbols-outlined" data-icon="theater_comedy">theater_comedy</span>
<span className="font-body-md">Shows</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/venues">
<span className="material-symbols-outlined" data-icon="water_drop">water_drop</span>
<span className="font-body-md">Venues</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/schedules">
<span className="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
<span className="font-body-md">Schedules</span>
</a>
<a className="flex items-center gap-unit-md text-primary-fixed border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 px-unit-lg py-unit-md transition-all" href="/manager/bookings">
<span className="material-symbols-outlined" data-icon="event_seat">event_seat</span>
<span className="font-body-md">Bookings</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/manager/reports">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
<span className="font-body-md">Reports</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/users">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="font-body-md">Users</span>
</a>
<a className="flex items-center gap-unit-md text-on-secondary-fixed-variant px-unit-lg py-unit-md hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/20 transition-all" href="/admin/roles">
<span className="material-symbols-outlined" data-icon="admin_panel_settings">admin_panel_settings</span>
<span className="font-body-md">Roles</span>
</a>
</nav>
<div className="mt-auto px-unit-lg">
<button className="w-full bg-primary-fixed text-on-primary-fixed py-unit-md rounded-lg font-label-lg flex items-center justify-center gap-unit-sm hover:opacity-90 transition-all">
<span className="material-symbols-outlined" data-icon="add">add</span>
                Quick Schedule
            </button>
</div>
</aside>

<main className="ml-sidebar-width w-[calc(100%-theme(spacing.sidebar-width))] flex flex-col h-full relative">

<header className="flex justify-between items-center px-unit-lg py-unit-sm w-full sticky top-0 z-40 bg-surface/70 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
<div className="flex items-center gap-unit-lg">
<h2 className="font-headline-md text-headline-md font-extrabold text-primary">Manage Bookings</h2>
<div className="relative w-96">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-md" data-icon="search">search</span>
<input className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-label-md focus:ring-2 focus:ring-primary/20" placeholder="Search booking ID or customer..." type="text"/>
</div>
</div>
<div className="flex items-center gap-unit-md">
<button className="p-unit-sm text-on-surface-variant hover:bg-surface-container-high/50 rounded-full transition-colors">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="p-unit-sm text-on-surface-variant hover:bg-surface-container-high/50 rounded-full transition-colors">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
</button>
<div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 cursor-pointer">
<img alt="Admin Profile" data-alt="A professional close-up portrait of a corporate manager in a modern office. The lighting is bright and clean with a cool aquatic blue tint, matching a high-end management dashboard aesthetic. The subject is smiling warmly, conveying confidence and hospitality, with a soft-focus background that includes glass partitions and lush green indoor plants." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPUCoTYKwKJ2yBm_yKnxhppj1EnonxQD4M4tQnRUlkFwhBggGoi99H1mIyOZJV4qJDWmQVseqZRkZqAQxx2vEN9MB81oKpH0qQELzP1xUmpMLkHfO2yKJQzm2uc2jeVh_9Wv0aHTynbwtjwA0jIeBmGbudXacXTmtH05dXH5MqCy_bg45dgM2u2JGrJEAweLfnm9cfycGzBUtmp9r7_imyIIzra-qpeERpY3i9EJDANhhCFuiGjxvk2FQ-TEf4yZ51lQnDo3dbIBH8"/>
</div>
</div>
</header>

<div className="flex-1 p-unit-lg overflow-y-auto custom-scrollbar space-y-unit-lg">

<section className="glass-panel p-unit-md rounded-xl flex flex-wrap items-center gap-unit-md">
<div className="flex flex-col gap-1 min-w-[200px]">
<label className="text-label-md text-on-surface-variant px-1">Show</label>
<select className="bg-surface-container-low border-none rounded-lg text-body-sm px-3 py-2.5 focus:ring-primary/20">
<option>All Shows</option>
<option>Dolphin Symphony</option>
<option>Oceanic Wonders</option>
<option>Mermaid Lagoon</option>
</select>
</div>
<div className="flex flex-col gap-1 min-w-[150px]">
<label className="text-label-md text-on-surface-variant px-1">Schedule</label>
<select className="bg-surface-container-low border-none rounded-lg text-body-sm px-3 py-2.5 focus:ring-primary/20">
<option>All Times</option>
<option>Today (10:00 AM)</option>
<option>Today (02:00 PM)</option>
<option>Tomorrow (11:00 AM)</option>
</select>
</div>
<div className="flex flex-col gap-1 min-w-[140px]">
<label className="text-label-md text-on-surface-variant px-1">Status</label>
<select className="bg-surface-container-low border-none rounded-lg text-body-sm px-3 py-2.5 focus:ring-primary/20">
<option>All Statuses</option>
<option>Confirmed</option>
<option>Pending</option>
<option>Cancelled</option>
</select>
</div>
<div className="flex flex-col gap-1 min-w-[140px]">
<label className="text-label-md text-on-surface-variant px-1">Payment</label>
<select className="bg-surface-container-low border-none rounded-lg text-body-sm px-3 py-2.5 focus:ring-primary/20">
<option>All Payments</option>
<option>Paid</option>
<option>Unpaid</option>
<option>Refunded</option>
</select>
</div>
<div className="ml-auto self-end flex gap-unit-sm">
<button className="px-unit-lg py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-label-lg hover:opacity-90 transition-all flex items-center gap-2">
<span className="material-symbols-outlined text-body-md" data-icon="filter_list">filter_list</span>
                        Apply Filters
                    </button>
<button className="px-unit-lg py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg font-label-lg hover:bg-surface-container-highest transition-all">
                        Reset
                    </button>
</div>
</section>

<section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low/50">
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Booking ID</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Customer</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Show</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Schedule Time</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Qty</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Total</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Status</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Payment</th>
<th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/20">

<tr className="hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => window.openSidePanel?.('BK-8821', 'Elena Rodriguez', 'Dolphin Symphony', 'Oct 24, 2023 - 10:00 AM', 4, '$120.00', 'Confirmed', 'Paid', 'elena.r@example.com')}>
<td className="px-unit-lg py-unit-md font-label-md text-primary font-bold">#BK-8821</td>
<td className="px-unit-lg py-unit-md">
<div className="flex flex-col">
<span className="font-body-md font-semibold text-on-surface">Elena Rodriguez</span>
<span className="text-body-sm text-on-surface-variant">elena.r@example.com</span>
</div>
</td>
<td className="px-unit-lg py-unit-md font-body-md">Dolphin Symphony</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">Oct 24, 2023 10:00 AM</td>
<td className="px-unit-lg py-unit-md font-body-md">4</td>
<td className="px-unit-lg py-unit-md font-body-md font-semibold">$120.00</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-primary-container/20 text-on-primary-container px-3 py-1 rounded-full text-label-md">Confirmed</span>
</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-md font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]" data-icon="check_circle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        Paid
                                    </span>
</td>
<td className="px-unit-lg py-unit-md">
<button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>

<tr className="hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => window.openSidePanel?.('BK-8822', 'Marcus Chen', 'Oceanic Wonders', 'Oct 24, 2023 - 02:00 PM', 2, '$70.00', 'Pending', 'Unpaid', 'm.chen@example.com')}>
<td className="px-unit-lg py-unit-md font-label-md text-primary font-bold">#BK-8822</td>
<td className="px-unit-lg py-unit-md">
<div className="flex flex-col">
<span className="font-body-md font-semibold text-on-surface">Marcus Chen</span>
<span className="text-body-sm text-on-surface-variant">m.chen@example.com</span>
</div>
</td>
<td className="px-unit-lg py-unit-md font-body-md">Oceanic Wonders</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">Oct 24, 2023 02:00 PM</td>
<td className="px-unit-lg py-unit-md font-body-md">2</td>
<td className="px-unit-lg py-unit-md font-body-md font-semibold">$70.00</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-tertiary-container/20 text-on-tertiary-container px-3 py-1 rounded-full text-label-md">Pending</span>
</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-label-md">Unpaid</span>
</td>
<td className="px-unit-lg py-unit-md">
<button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>

<tr className="hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => window.openSidePanel?.('BK-8823', 'Sarah Jenkins', 'Mermaid Lagoon', 'Oct 25, 2023 - 11:00 AM', 3, '$95.00', 'Confirmed', 'Paid', 'sarah.j@example.com')}>
<td className="px-unit-lg py-unit-md font-label-md text-primary font-bold">#BK-8823</td>
<td className="px-unit-lg py-unit-md">
<div className="flex flex-col">
<span className="font-body-md font-semibold text-on-surface">Sarah Jenkins</span>
<span className="text-body-sm text-on-surface-variant">sarah.j@example.com</span>
</div>
</td>
<td className="px-unit-lg py-unit-md font-body-md">Mermaid Lagoon</td>
<td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">Oct 25, 2023 11:00 AM</td>
<td className="px-unit-lg py-unit-md font-body-md">3</td>
<td className="px-unit-lg py-unit-md font-body-md font-semibold">$95.00</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-primary-container/20 text-on-primary-container px-3 py-1 rounded-full text-label-md">Confirmed</span>
</td>
<td className="px-unit-lg py-unit-md">
<span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-md font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]" data-icon="check_circle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        Paid
                                    </span>
</td>
<td className="px-unit-lg py-unit-md">
<button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<div className="px-unit-lg py-unit-md bg-surface-container-low/30 border-t border-outline-variant/10 flex items-center justify-between">
<span className="text-body-sm text-on-surface-variant">Showing 1 to 10 of 248 bookings</span>
<div className="flex gap-unit-xs">
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface-variant">
<span className="material-symbols-outlined text-body-md" data-icon="chevron_left">chevron_left</span>
</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary font-label-md shadow-md">1</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface-variant font-label-md">2</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface-variant font-label-md">3</button>
<button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface-variant">
<span className="material-symbols-outlined text-body-md" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
</section>
</div>

<div className="fixed right-0 top-0 h-full w-[450px] bg-surface-container-lowest shadow-2xl z-[60] transform translate-x-full side-panel-transition flex flex-col border-l border-outline-variant/20" id="side-panel">
<header className="p-unit-lg border-b border-outline-variant/20 flex items-center justify-between">
<div className="flex flex-col">
<h3 className="font-headline-md text-headline-md text-primary" id="panel-booking-id">#BK-0000</h3>
<span className="text-body-sm text-on-surface-variant">Detailed Booking View</span>
</div>
<button className="p-unit-sm hover:bg-surface-container-high rounded-full transition-colors" onClick={() => window.closeSidePanel?.()}>
<span className="material-symbols-outlined" data-icon="close">close</span>
</button>
</header>
<div className="flex-1 overflow-y-auto custom-scrollbar p-unit-lg space-y-unit-xl">

<div className="flex items-center justify-between p-unit-md bg-surface-container rounded-xl">
<div className="flex flex-col gap-1">
<span className="text-label-md text-on-surface-variant uppercase">Booking Status</span>
<span className="bg-primary-container/30 text-on-primary-container px-3 py-1 rounded-full text-label-md font-bold w-fit text-center" id="panel-booking-status">Confirmed</span>
</div>
<div className="flex flex-col gap-1 text-right">
<span className="text-label-md text-on-surface-variant uppercase">Payment</span>
<span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-md font-bold flex items-center gap-1 justify-end" id="panel-payment-status">
<span className="material-symbols-outlined text-[14px]" data-icon="check_circle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Paid
                        </span>
</div>
</div>

<div className="space-y-unit-md">
<div className="flex items-center gap-unit-sm">
<span className="material-symbols-outlined text-primary" data-icon="person">person</span>
<h4 className="font-label-lg text-on-surface uppercase">Customer Information</h4>
</div>
<div className="grid grid-cols-1 gap-unit-md p-unit-md border border-outline-variant/20 rounded-xl">
<div className="flex justify-between">
<span className="text-body-sm text-on-surface-variant">Full Name</span>
<span className="font-body-md font-semibold" id="panel-customer-name">Elena Rodriguez</span>
</div>
<div className="flex justify-between">
<span className="text-body-sm text-on-surface-variant">Email Address</span>
<span className="font-body-md" id="panel-customer-email">elena.r@example.com</span>
</div>
<div className="flex justify-between">
<span className="text-body-sm text-on-surface-variant">Phone Number</span>
<span className="font-body-md">+1 (555) 902-3341</span>
</div>
</div>
</div>

<div className="space-y-unit-md">
<div className="flex items-center gap-unit-sm">
<span className="material-symbols-outlined text-primary" data-icon="theater_comedy">theater_comedy</span>
<h4 className="font-label-lg text-on-surface uppercase">Show Details</h4>
</div>
<div className="p-unit-md border border-outline-variant/20 rounded-xl space-y-unit-sm">
<div className="aspect-video w-full rounded-lg overflow-hidden mb-unit-sm">
<img alt="Dolphin Show" data-alt="A cinematic, wide-angle shot of a grand aquatic stadium. Powerful turquoise dolphins leap gracefully from a crystalline pool, backlit by soft atmospheric sunlight filtering through the water. The surrounding architecture is modern glass and steel, with the branding and color scheme perfectly aligned with a luxury marine theme in shades of teal and ocean blue." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI37PKlcmE_VLM82w0HhigXhxLEo7JYUykpVDYPVnZnMWqppYh0JyT98-3c9wqZzL2rvWVwK1RQ1Zsok4uVKTz9ze6Om7UGd63n2EoKGUFT9PLZlUiSHpPn7SU4FvJ5ke78evMyVdCpVTi8O5kt7EKUdU37c5a6MAtNzowti3WKWeSWmsN1gVIsrbzxvItIwBZfj2ePXQBI0ykjnxDoLQ60iD5QOhophb6IVHURnkDmu1hClkTEjPloJedCqqqcRz5zzSeQllI0qLQ"/>
</div>
<div className="flex justify-between">
<span className="text-body-sm text-on-surface-variant">Performance</span>
<span className="font-body-md font-semibold" id="panel-show-name">Dolphin Symphony</span>
</div>
<div className="flex justify-between">
<span className="text-body-sm text-on-surface-variant">Venue</span>
<span className="font-body-md">Grand Blue Arena</span>
</div>
<div className="flex justify-between">
<span className="text-body-sm text-on-surface-variant">Scheduled Time</span>
<span className="font-body-md" id="panel-schedule-time">Oct 24, 2023 - 10:00 AM</span>
</div>
</div>
</div>

<div className="space-y-unit-md">
<div className="flex items-center gap-unit-sm">
<span className="material-symbols-outlined text-primary" data-icon="receipt_long">receipt_long</span>
<h4 className="font-label-lg text-on-surface uppercase">Ticket Summary</h4>
</div>
<div className="p-unit-md border border-outline-variant/20 rounded-xl space-y-unit-md">
<div className="flex justify-between items-center pb-unit-sm border-b border-outline-variant/10">
<div className="flex flex-col">
<span className="font-body-md font-semibold">Standard Entry x <span id="panel-quantity">4</span></span>
<span className="text-body-sm text-on-surface-variant">$30.00 each</span>
</div>
<span className="font-headline-md text-primary" id="panel-total-amount">$120.00</span>
</div>
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Service Fee (0%)</span>
<span>$0.00</span>
</div>
<div className="flex justify-between text-body-lg font-bold">
<span>Total</span>
<span id="panel-total-final">$120.00</span>
</div>
</div>
</div>

<div className="space-y-unit-md pb-unit-xl">
<div className="flex items-center gap-unit-sm">
<span className="material-symbols-outlined text-primary" data-icon="history">history</span>
<h4 className="font-label-lg text-on-surface uppercase text-[12px]">Activity Timeline</h4>
</div>
<div className="relative pl-6 border-l-2 border-outline-variant/30 space-y-6 ml-2">
<div className="relative">
<span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background"></span>
<div className="flex flex-col">
<span className="text-label-md font-bold">Booking Created</span>
<span className="text-body-sm text-on-surface-variant">Oct 20, 2023 at 11:45 AM</span>
</div>
</div>
<div className="relative">
<span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background"></span>
<div className="flex flex-col">
<span className="text-label-md font-bold">Payment Verified</span>
<span className="text-body-sm text-on-surface-variant">Oct 20, 2023 at 11:47 AM</span>
</div>
</div>
<div className="relative">
<span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-outline-variant ring-4 ring-background"></span>
<div className="flex flex-col opacity-60">
<span className="text-label-md font-bold">Ticket Issued</span>
<span className="text-body-sm text-on-surface-variant">Pending distribution</span>
</div>
</div>
</div>
</div>
</div>

<footer className="p-unit-lg border-t border-outline-variant/20 bg-surface-container-low/50 flex gap-unit-md">
<button className="flex-1 bg-surface-container-high text-on-surface-variant py-unit-md rounded-lg font-label-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all">
<span className="material-symbols-outlined" data-icon="print">print</span>
                    Print Ticket
                </button>
<button className="flex-1 bg-primary text-on-primary py-unit-md rounded-lg font-label-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
<span className="material-symbols-outlined" data-icon="edit">edit</span>
                    Modify Seat
                </button>
</footer>
</div>

<div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[55] hidden opacity-0 transition-opacity duration-300" id="panel-backdrop" onClick={() => window.closeSidePanel?.()}></div>
</main>
    </div>
  );
}
