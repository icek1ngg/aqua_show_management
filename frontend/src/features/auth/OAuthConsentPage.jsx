import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { getRedirectPathAfterLogin } from './authRedirect.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

export default function OAuthConsentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthConsent } = useAuth();
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const code = searchParams.get('code');

  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h2 className="text-xl font-bold text-red-600">Invalid Request</h2>
          <p className="mt-2 text-slate-600">Missing onboarding code.</p>
          <Button onClick={() => navigate('/login')} className="mt-6 w-full">Back to Login</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError('You must accept the terms and privacy policy to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await completeOAuthConsent(code, true, "2026-07-15");
      navigate(getRedirectPathAfterLogin(user), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="bg-cyan-600 px-8 py-6 text-center text-white">
          <h2 className="text-2xl font-black tracking-tight">AquaPulse</h2>
          <p className="mt-2 text-cyan-100">Complete your profile</p>
        </div>
        <div className="p-8">
          <p className="mb-6 text-sm text-slate-600">
            You're almost there! Please review and accept our terms to complete linking your Google account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-inset ring-red-500/20">
                {error}
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex h-6 items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600"
                />
              </div>
              <label htmlFor="terms" className="text-sm leading-6 text-slate-600">
                I accept the{' '}
                <a href="#" className="font-semibold text-cyan-600 hover:text-cyan-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-cyan-600 hover:text-cyan-500">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-600 hover:bg-cyan-500"
            >
              {isSubmitting ? 'Creating account...' : 'Complete Sign Up'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500">
            Changed your mind?{' '}
            <Link to="/login" className="font-semibold text-cyan-600 hover:text-cyan-500">
              Cancel and return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
