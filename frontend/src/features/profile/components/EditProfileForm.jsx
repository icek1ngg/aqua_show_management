const mockUser = {
  firstName: 'Marina Blue',
  lastName: 'Waters',
  gender: 'female',
  phone: '+1 (555) 000-0000',
  email: 'marina.waters@aquashow.local',
  address: '789 Ocean Breeze Boulevard, Wave City, Aqua District 10101',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCAs3NVAK7aoUYuYTZX3AmIWjo37TVxp8y6qJgQ9aCIxerTaTrUNtCZg6IkvjGYTrm8NkWAmMk9EYSAS0zHX-Ybuchms5PmzM8GSFwWEwlI4Yo9RrGTNwDjP0uBNcrI0GEVscCdtCQdMPXEMe6JZqLjxpYxC0m-dniRVU5w8F3YNuK1ONb9aqNtSQ8JjTFMnaKVdluoElQViAQ2wGLue9tKyOx3JFBWEQNJawzk2cibhFjqAkAmwOrkKMOymHdXyYfPgbQ1y6XgQQ',
};

function FieldLabel({ children, icon }) {
  return (
    <label className="ml-1 flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
      <span className="material-symbols-outlined text-[18px] text-cyan-700">{icon}</span>
      {children}
    </label>
  );
}

const inputClassName =
  'w-full rounded-2xl border border-transparent bg-cyan-50/70 px-6 py-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200';

export default function EditProfileForm({ user = mockUser }) {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_48px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col justify-between gap-4 bg-gradient-to-r from-cyan-400 via-cyan-600 to-teal-800 p-8 text-white md:flex-row md:items-center md:p-10">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">Edit Profile</h1>
            <span className="flex items-center gap-1 rounded-full border border-cyan-200/30 bg-cyan-200/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-50">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Active Account
            </span>
          </div>
          <p className="text-sm leading-6 text-white/80">Update your personal information for your AquaPulse account.</p>
        </div>

        <div className="flex -space-x-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm">
            <span className="material-symbols-outlined text-sm">settings</span>
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm">
            <span className="material-symbols-outlined text-sm">shield</span>
          </span>
        </div>
      </div>

      <div className="p-8 md:p-12">
        <form className="space-y-12" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-8 border-b border-cyan-100 pb-10 md:flex-row">
            <div className="group relative">
              <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-cyan-100 bg-cyan-50 shadow-xl ring-4 ring-white">
                <img alt="Profile" className="h-full w-full object-cover" src={user.avatarUrl} />
              </div>
              <button
                className="absolute bottom-1 right-1 flex items-center justify-center rounded-full border-2 border-white bg-cyan-700 p-2 text-white shadow-lg transition hover:scale-110"
                type="button"
                aria-label="Change profile photo placeholder"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
            </div>

            <div className="text-center md:text-left">
              <button
                className="mb-3 rounded-full bg-cyan-100 px-6 py-2.5 text-sm font-bold text-cyan-800 shadow-sm transition hover:bg-cyan-200"
                type="button"
              >
                Change Photo
              </button>
              <p className="text-sm text-slate-500">JPG, GIF or PNG. Max size of 800K.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
            <div className="space-y-3">
              <FieldLabel icon="person">First and Middle Name</FieldLabel>
              <input className={inputClassName} defaultValue={user.firstName} placeholder="Enter names" type="text" />
            </div>

            <div className="space-y-3">
              <FieldLabel icon="badge">Last Name</FieldLabel>
              <input className={inputClassName} defaultValue={user.lastName} placeholder="Enter last name" type="text" />
            </div>

            <div className="space-y-3">
              <FieldLabel icon="diversity_3">Gender</FieldLabel>
              <div className="relative">
                <select className={`${inputClassName} appearance-none cursor-pointer`} defaultValue={user.gender}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <FieldLabel icon="call">Phone Number</FieldLabel>
              <input className={inputClassName} defaultValue={user.phone} placeholder="+1 (000) 000-0000" type="tel" />
            </div>

            <div className="space-y-3 md:col-span-2">
              <FieldLabel icon="lock">Email Address</FieldLabel>
              <div className="relative">
                <input
                  className="w-full cursor-not-allowed rounded-2xl border border-cyan-100 bg-slate-100 px-6 py-4 text-base text-slate-500 shadow-inner outline-none"
                  defaultValue={user.email}
                  disabled
                  type="email"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 rounded bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Read Only
                </span>
              </div>
              <p className="ml-4 text-xs italic text-slate-500">Email cannot be changed from this page. Contact support for assistance.</p>
            </div>

            <div className="space-y-3 md:col-span-2">
              <FieldLabel icon="location_on">Residential Address</FieldLabel>
              <textarea
                className={`${inputClassName} min-h-32 resize-none`}
                defaultValue={user.address}
                placeholder="123 Coral Reef Drive, Atlantis City..."
                rows="3"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-6 border-t border-cyan-100 pt-10 md:flex-row">
            <button className="order-3 px-4 py-2 font-bold text-slate-400 transition hover:text-red-600 md:order-1" type="button">
              Discard Changes
            </button>

            <div className="order-1 flex w-full flex-col gap-4 sm:flex-row md:order-2 md:w-auto">
              <a
                className="rounded-full border-2 border-cyan-100 px-10 py-4 text-center font-bold text-slate-600 shadow-sm transition hover:bg-cyan-50 active:scale-95"
                href="/profile"
              >
                Cancel
              </a>
              <button
                className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-800 px-12 py-4 font-bold text-white shadow-[0_12px_24px_rgba(0,105,107,0.2)] transition hover:shadow-[0_16px_32px_rgba(0,105,107,0.3)] active:scale-95"
                type="submit"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
