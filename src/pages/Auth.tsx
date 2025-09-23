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
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Welcome to LoveAI
          </h1>
          <p className="text-muted-foreground mt-2">
            Your perfect AI companion awaits
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
    </>
  );
}; 