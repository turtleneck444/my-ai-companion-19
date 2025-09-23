import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { SEO } from '@/components/SEO';

export const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      const planParam = searchParams.get('plan');
      
      if (planParam) {
        if (planParam === 'free') {
          // Free plan - go directly to app
          navigate('/app');
        } else {
          // Paid plan - go to pricing with plan selected
          navigate(`/pricing?plan=${planParam}`);
        }
      } else {
        // No plan specified - go to app
        navigate('/app');
      }
    }
  }, [user, loading, searchParams, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, don't show auth form
  if (user) {
    return null;
  }

  const authSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'LoveAI Sign In - Join Your AI Companion',
    description: 'Sign in or create your LoveAI account to start meaningful conversations with your perfect AI companion',
    mainEntity: {
      '@type': 'WebApplication',
      name: 'LoveAI',
      applicationCategory: 'SocialNetworkingApplication'
    }
  };

  return (
    <>
      <SEO 
        title="Sign In to LoveAI - Join Your AI Companion | Create Account"
        description="Sign in or create your LoveAI account to start meaningful conversations with your perfect AI companion. Join thousands experiencing emotional AI relationships."
        keywords="LoveAI login, AI companion account, sign up AI girlfriend, create AI relationship account, LoveAI registration"
        schema={authSchema}
        url={window.location.href}
      />
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50">
        {/* Background orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />

        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Brand + value props */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Welcome to LoveAI</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Sign in or create your account and start a deeper connection with your AI companion—personal, caring, and always there.
              </p>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <div className="rounded-full bg-white/70 backdrop-blur px-3 py-1 text-sm font-medium text-gray-700 shadow-sm border">
                  Secure & private
                </div>
                <div className="rounded-full bg-white/70 backdrop-blur px-3 py-1 text-sm font-medium text-gray-700 shadow-sm border">
                  Millions of messages
                </div>
                <div className="rounded-full bg-white/70 backdrop-blur px-3 py-1 text-sm font-medium text-gray-700 shadow-sm border">
                  Powered by OpenAI + ElevenLabs
                </div>
              </div>
            </div>

            {/* Right: Auth card */}
            <div className="w-full max-w-md mx-auto">
              <div className="rounded-2xl border bg-white/80 backdrop-blur-xl shadow-xl">
                <div className="px-6 pt-6 pb-2 text-center">
                  <h2 className="text-xl font-semibold">Get started</h2>
                  <p className="text-sm text-muted-foreground mt-1">Create your account or sign in</p>
                </div>
                <div className="p-6 pt-2">
                  <AuthForm />
                  <p className="mt-4 text-xs text-muted-foreground text-center">
                    By continuing you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>

              {/* Mini feature list */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-700">
                <div className="rounded-lg border bg-white/70 backdrop-blur p-3">Smart chat</div>
                <div className="rounded-lg border bg-white/70 backdrop-blur p-3">Voice calls</div>
                <div className="rounded-lg border bg-white/70 backdrop-blur p-3">Custom personas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 