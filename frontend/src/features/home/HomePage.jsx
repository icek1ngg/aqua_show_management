import MainLayout from '../../shared/layouts/MainLayout.jsx';

const featuredShows = [
  {
    title: 'Symphony of Lights',
    description: 'A synchronized masterpiece of light, water, and sound that will leave you breathless.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDgtKbX141GIXV28czApt3tHguCUvPKSbRAnFdFAQzlJutKE1EC4vS7jnqAU4kbJta6FkkFLWOG1xo4RFS8AM1MXBGOQlPFZh-FlQEpmZlt5nYB6wUrwlpXP5TSpL1DI7WuOKTisPjwwu6BaEFAPWXD2NGxEfXQvUJmomtpfH0x7egW2U7kxW6h2RZFC6PIb1cpt9NbIPLdOpwlkZgjkBVzNlC3R9onv6_Esbk17K0of4PgvHxDHfAWZoVi41bvelTws71QLVrPMQ',
    badge: 'Popular',
    badgeClass: 'bg-[#ff6900] text-white',
    price: 'from $29',
  },
  {
    title: 'Deep Sea Mystery',
    description: 'Journey into the abyss and discover the secrets of the ocean in this immersive play.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCaDCEPuRXIz-tXX1TXYxFJLqc_NIsXu8w_yLI5ZUwrlr8wnEL8-kgSlFbHHypXmoS8BFV3Nt-uIqfoUBNP3vsNwRpxWltuGVcjFaEYr5i0Jxbq-UGbC8e5wY7oIaDMk2npEmreyGf9rBbp29WokyWvugQKmrBX2PoVJWFeSGUirssyqs6CAB1JREDZCBlv_mFFOq4aPXSDN7RXezaVkV4yhWwjPBXZkL6PwbhHkm0AYogBR_08bBqL0orR0zzGAHByqIypSnGUag',
    badge: 'New',
    badgeClass: 'bg-cyan-300 text-slate-950',
    price: 'from $35',
  },
  {
    title: 'Tropical Splash',
    description: 'A high-energy daytime parade with water cannons, music, and tropical rhythms.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDOdYlgXL4Nwf4AWcGFjApQwu1wTev59cOd_-GZKhZAWO4Iz_zf7Tn8_yeXyi9P-cEDz6PldhiUpJ7j_1kqfhSt3YHIgmEJCtryWfqAghSSeXxzgAUM-pXEtaZhoz6g-0FlaiKz-SMUTjlXf7-QNguIhszVSRUHyFOy4zzsc6qh5RCz4gEwyyuSD5_OrUqMRuq-If6WwHs7nBE7Nwij3GBrdW3JEC77ydu5Az0EctrAsKLg-FkB0ZzurXJq_eCzA4NIrDfQsrmB1A',
    price: 'from $25',
  },
];

const schedules = [
  {
    day: '24',
    month: 'Aug',
    time: '19:30 PM',
    note: 'Gate opens 30m early',
    title: 'Symphony of Lights',
    venue: 'Main Aquatic Theater',
    status: 'Available',
    statusClass: 'bg-emerald-50 text-emerald-600',
    dotClass: 'bg-emerald-600 animate-pulse',
  },
  {
    day: '24',
    month: 'Aug',
    time: '21:00 PM',
    note: 'Late night performance',
    title: 'Deep Sea Mystery',
    venue: 'Grand Arena Pool',
    status: 'Almost Full',
    statusClass: 'bg-orange-50 text-[#ff6900]',
    dotClass: 'bg-[#ff6900]',
  },
];

const benefits = [
  {
    icon: 'bolt',
    title: 'Easy Booking',
    description: 'Instant confirmation and secure ticket management in just 3 clicks.',
  },
  {
    icon: 'verified_user',
    title: 'Secure Payment',
    description: 'Your data is protected by industry-leading encryption standards.',
  },
  {
    icon: 'confirmation_number',
    title: 'Fast Entry',
    description: 'Move smoothly from booking to showtime with clear reservation details.',
  },
  {
    icon: 'notifications_active',
    title: 'Real-time Updates',
    description: 'Get live notifications about show timings and seat availability.',
  },
];

export default function HomePage() {
  return (
    <MainLayout>
      <section className="relative flex min-h-[600px] items-center overflow-hidden lg:min-h-[720px]">
        <div className="absolute inset-0 z-0">
          <img
            alt="Spectacular water fountain show"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMtU715udYhrKO5UD5Z7WcmQPqPLM3sfRoUqm0yo9QyXaYviVVdqfJqXGt-R8q7yRyVJLCg-7yNQpxuClsEjazci4FKUvmHD8-h7VkaJqEUvZ5LGrgQc6OPyIHDftuWq5GrkH069uG0kIWEZVuOUHlSyRsz1ONwEJ_UsC5FRcoEUREr1YT7NhxEjLc3llvHYb1puPSJd-SvHfPyVBIZ0PfNO2dLzosiECIC6e8l0yAD35mD5_rDkKbENd7IbpmBKPOWznJiquMbA"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-cyan-950/35 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 text-white sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
              AquaPulse Water Park
            </p>
            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Dive Into <span className="text-cyan-300">Magical</span> Water Shows
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-cyan-50/90">
              Discover spectacular performances, book tickets online, and enjoy unforgettable moments at AquaPulse.
              Experience the harmony of light, water, and music.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-700 px-10 py-4 font-bold text-white shadow-2xl shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:shadow-cyan-950/40 active:translate-y-0" type="button">
                Book Tickets
              </button>
              <button className="rounded-full border-2 border-white/30 bg-white/10 px-10 py-4 font-bold text-white backdrop-blur-md transition hover:bg-white/20" type="button">
                Explore Shows
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-end gap-6 rounded-[2rem] border border-cyan-100/80 bg-white p-6 shadow-2xl shadow-cyan-950/10 md:flex-row md:p-8">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-4">
            <label className="space-y-2">
              <span className="flex items-center gap-2 px-1 text-sm font-bold text-slate-600">
                <span className="material-symbols-outlined text-cyan-700">water_drop</span>
                Select Show
              </span>
              <select className="w-full rounded-full border border-cyan-100 bg-cyan-50/70 px-5 py-3 text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200">
                <option>Symphony of Lights</option>
                <option>Aqua Ballet</option>
                <option>Deep Sea Mystery</option>
                <option>Tropical Splash Parade</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 px-1 text-sm font-bold text-slate-600">
                <span className="material-symbols-outlined text-cyan-700">calendar_month</span>
                Select Date
              </span>
              <input className="w-full rounded-full border border-cyan-100 bg-cyan-50/70 px-5 py-3 text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200" type="date" />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 px-1 text-sm font-bold text-slate-600">
                <span className="material-symbols-outlined text-cyan-700">numbers</span>
                Quantity
              </span>
              <input className="w-full rounded-full border border-cyan-100 bg-cyan-50/70 px-5 py-3 text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200" min="1" placeholder="Ticket quantity" type="number" />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 px-1 text-sm font-bold text-slate-600">
                <span className="material-symbols-outlined text-cyan-700">confirmation_number</span>
                Ticket Type
              </span>
              <select className="w-full rounded-full border border-cyan-100 bg-cyan-50/70 px-5 py-3 text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200">
                <option>Standard Entry</option>
                <option>VIP Experience</option>
                <option>Family Pass</option>
              </select>
            </label>
          </div>

          <button className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-cyan-700 px-10 py-4 font-bold text-white shadow-lg shadow-cyan-900/20 transition hover:bg-cyan-800 md:w-auto" type="button">
            <span className="material-symbols-outlined">search</span>
            Search Tickets
          </button>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 block text-sm font-bold uppercase tracking-[0.24em] text-cyan-700">Performances</span>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Featured Water Shows</h2>
          </div>
          <a className="group flex items-center gap-1 font-bold text-cyan-700 transition hover:text-cyan-900" href="#">
            View All
            <span className="material-symbols-outlined transition group-hover:translate-x-1">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {featuredShows.map((show) => (
            <article className="group overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-950/10" key={show.title}>
              <div className="relative h-72 overflow-hidden">
                <img alt={show.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" src={show.image} />
                {show.badge && (
                  <span className={`absolute left-5 top-5 rounded-full px-4 py-1.5 text-sm font-bold shadow-lg ${show.badgeClass}`}>
                    {show.badge}
                  </span>
                )}
                <div className="absolute bottom-5 right-5 rounded-full bg-white/95 px-4 py-1.5 shadow-lg backdrop-blur">
                  <span className="font-bold text-cyan-700">{show.price}</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="mb-3 text-2xl font-black text-slate-950">{show.title}</h3>
                <p className="mb-8 line-clamp-2 text-slate-600">{show.description}</p>
                <button className="w-full rounded-full border-2 border-cyan-700 py-3.5 font-bold text-cyan-700 transition hover:bg-cyan-700 hover:text-white" type="button">
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Upcoming Show Schedules</h2>
            <div className="mx-auto mb-6 h-1 w-20 rounded-full bg-cyan-500" />
            <p className="mx-auto max-w-xl text-slate-600">
              Plan your visit ahead. Check the latest show timings and real-time availability for our main stages.
            </p>
          </div>

          <div className="space-y-6">
            {schedules.map((schedule) => (
              <article className="flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-sm transition hover:shadow-lg md:flex-row" key={`${schedule.title}-${schedule.time}`}>
                <div className="flex w-full items-center gap-6 md:w-1/4">
                  <div className="min-w-[90px] rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-center">
                    <p className="text-2xl font-black text-cyan-700">{schedule.day}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{schedule.month}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-cyan-700">{schedule.time}</p>
                    <p className="text-sm text-slate-500">{schedule.note}</p>
                  </div>
                </div>

                <div className="w-full text-center md:w-1/3 md:text-left">
                  <h3 className="text-xl font-black text-slate-950">{schedule.title}</h3>
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600 md:justify-start">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {schedule.venue}
                  </p>
                </div>

                <div className="flex w-full items-center justify-between gap-6 md:w-auto md:justify-end">
                  <span className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${schedule.statusClass}`}>
                    <span className={`h-2 w-2 rounded-full ${schedule.dotClass}`} />
                    {schedule.status}
                  </span>
                  <button className="rounded-full bg-cyan-700 px-8 py-3.5 font-bold text-white shadow-md transition hover:bg-cyan-800" type="button">
                    Book Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-center gap-6">
          <h2 className="shrink-0 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Exclusive Promotions</h2>
          <div className="h-px flex-1 bg-cyan-200" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <article className="relative flex min-h-[400px] flex-col justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-400 to-teal-800 p-8 text-white shadow-2xl shadow-cyan-950/20 md:p-12">
            <div className="relative z-10 space-y-6">
              <span className="rounded-full border border-white/30 bg-white/20 px-5 py-1.5 text-sm font-bold uppercase tracking-[0.18em] backdrop-blur-md">
                Limited Time
              </span>
              <h3 className="text-4xl font-black leading-tight md:text-5xl">
                Summer Splash
                <br />
                Family Bundle
              </h3>
              <p className="max-w-sm text-lg text-white/80">Get 4 tickets for the price of 3 plus free snacks and drinks for the kids.</p>
              <button className="mt-4 w-fit rounded-full bg-yellow-300 px-10 py-4 font-black text-slate-950 transition hover:shadow-xl active:scale-95" type="button">
                Grab Offer
              </button>
            </div>
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-10 top-10 h-40 w-40 rounded-full border border-white/10 bg-white/5" />
            <span className="material-symbols-outlined absolute bottom-8 right-8 select-none text-[120px] leading-none opacity-10">waves</span>
          </article>

          <article className="relative flex min-h-[400px] flex-col justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ff6900] to-[#a43c12] p-8 text-white shadow-2xl shadow-orange-950/20 md:p-12">
            <div className="relative z-10 space-y-6">
              <span className="rounded-full border border-white/30 bg-white/20 px-5 py-1.5 text-sm font-bold uppercase tracking-[0.18em] backdrop-blur-md">
                Members Only
              </span>
              <h3 className="text-4xl font-black leading-tight md:text-5xl">
                VIP Season Pass
                <br />
                Early Access
              </h3>
              <p className="max-w-sm text-lg text-white/80">Enjoy unlimited entries and priority seating for all premium shows this season.</p>
              <button className="mt-4 w-fit rounded-full bg-white px-10 py-4 font-black text-cyan-800 transition hover:shadow-xl active:scale-95" type="button">
                Explore Perks
              </button>
            </div>
            <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <span className="material-symbols-outlined absolute bottom-8 right-8 select-none text-[120px] leading-none opacity-10">stars</span>
          </article>
        </div>
      </section>

      <section className="bg-cyan-50/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Why Book With AquaPulse?</h2>
            <div className="mx-auto h-1.5 w-24 rounded-full bg-cyan-500" />
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            {benefits.map((benefit) => (
              <article className="group text-center" key={benefit.title}>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white text-cyan-700 shadow-md transition duration-300 group-hover:bg-cyan-700 group-hover:text-white">
                  <span className="material-symbols-outlined text-4xl">{benefit.icon}</span>
                </div>
                <h3 className="mb-3 text-xl font-black text-slate-950">{benefit.title}</h3>
                <p className="px-4 text-sm leading-6 text-slate-600">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
