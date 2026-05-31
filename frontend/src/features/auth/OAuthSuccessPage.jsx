import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const loginCalledRef = useRef(false);

  useEffect(() => {
    if (loginCalledRef.current) return;

    const accessToken = searchParams.get('accessToken');
    const expiresIn = searchParams.get('expiresIn');

    if (!accessToken) {
      navigate('/login?oauthError=true', { replace: true });
      return;
    }

    loginCalledRef.current = true;

    async function handleOAuth() {
      try {
        await completeOAuthLogin(accessToken, expiresIn);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('OAuth success token exchange or profile loading failed:', error);
        navigate('/login?oauthError=true', { replace: true });
      }
    }

    handleOAuth();
  }, [searchParams, navigate, completeOAuthLogin]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cyan-950 text-white">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-cyan-950 via-teal-900 to-cyan-900" />
      <div className="absolute left-1/4 top-1/4 z-[2] h-48 w-48 rounded-full border border-white/10 bg-white/5 blur-sm animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 z-[2] h-64 w-64 rounded-full border border-cyan-200/10 bg-cyan-200/5 blur-sm animate-pulse duration-1000" />

      {/* Loading Card */}
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-cyan-900/40 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-l-transparent border-teal-300 animate-spin duration-1000" />
          </div>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          Aqua<span className="text-cyan-300">Pulse</span>
        </h2>
        <p className="mt-4 text-lg font-medium text-cyan-100/90 animate-pulse">
          Signing you in...
        </p>
        <p className="mt-2 text-xs text-cyan-200/60 font-semibold tracking-wide uppercase">
          Verifying your secure credentials
        </p>
      </div>
    </div>
  );
}
