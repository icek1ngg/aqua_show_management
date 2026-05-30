import MainLayout from '../../shared/layouts/MainLayout.jsx';
import EditProfileForm from './components/EditProfileForm.jsx';

const mockNavbarUser = {
  name: 'Marina Blue Waters',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCAs3NVAK7aoUYuYTZX3AmIWjo37TVxp8y6qJgQ9aCIxerTaTrUNtCZg6IkvjGYTrm8NkWAmMk9EYSAS0zHX-Ybuchms5PmzM8GSFwWEwlI4Yo9RrGTNwDjP0uBNcrI0GEVscCdtCQdMPXEMe6JZqLjxpYxC0m-dniRVU5w8F3YNuK1ONb9aqNtSQ8JjTFMnaKVdluoElQViAQ2wGLue9tKyOx3JFBWEQNJawzk2cibhFjqAkAmwOrkKMOymHdXyYfPgbQ1y6XgQQ',
};

export default function EditProfilePage() {
  return (
    <MainLayout navbarProps={{ isLoggedIn: true, user: mockNavbarUser }}>
      <div className="relative overflow-hidden">
        <div className="absolute left-[8%] top-16 h-32 w-32 rounded-full bg-cyan-200/40 blur-2xl" />
        <div className="absolute right-[6%] top-48 h-48 w-48 rounded-full bg-teal-200/35 blur-3xl" />
        <div className="absolute bottom-16 left-[20%] h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
        <svg className="absolute bottom-0 left-0 w-full opacity-10" fill="none" viewBox="0 0 1440 320" aria-hidden="true">
          <path
            d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z"
            fill="#00ced1"
          />
        </svg>

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <EditProfileForm />
        </main>
      </div>
    </MainLayout>
  );
}
