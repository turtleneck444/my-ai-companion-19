import React, { useMemo, useState } from "react";
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, LogIn, Shield, Sparkles, Eye, EyeOff, Loader2, Crown, Heart, Star, Zap, ArrowLeft, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PaymentModal } from '@/components/PaymentModal';

// Signup Form Component
const SignupForm: React.FC<{ preselectedPlan?: string }> = ({ preselectedPlan }) => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive"
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters.",
          variant: "destructive"
        });
        return;
      }

      // Create the account first
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        selected_plan: preselectedPlan || 'free'
      });
      
      setUserCreated(true);
      
      // If it's a paid plan, show payment modal
      if (preselectedPlan && preselectedPlan !== 'free') {
        setShowPaymentModal(true);
        toast({
          title: "Account Created!",
          description: "Please complete your payment to activate your plan.",
          variant: "default"
        });
      } else {
        // Free plan - go directly to app
        toast({
          title: "Account Created!",
          description: "Welcome to LoveAI! Please check your email to verify your account.",
          variant: "default"
        });
        navigate('/app');
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (plan: string) => {
    setShowPaymentModal(false);
    toast({
      title: "Payment Successful!",
      description: `Welcome to LoveAI ${plan}! Your account is now active.`,
      variant: "default"
    });
    navigate('/app');
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    // If user closes payment modal, still take them to app with free plan
    navigate('/app');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="pl-12 h-14 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="signup-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="pl-12 h-14 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="pl-12 pr-12 h-14 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="pl-12 pr-12 h-14 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {preselectedPlan && preselectedPlan !== 'free' && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-4">
            <div className="flex items-center gap-3 text-pink-700">
              <Crown className="w-5 h-5" />
              <span className="font-medium">
                You'll be charged for the {preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)} plan after signup
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <User className="w-5 h-5 mr-2" />
              {preselectedPlan && preselectedPlan !== 'free' 
                ? `Create Account & Pay for ${preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)}`
                : 'Create Account'
              }
            </>
          )}
        </Button>
      </form>

      {/* Payment Modal */}
      {showPaymentModal && preselectedPlan && preselectedPlan !== 'free' && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          plan={preselectedPlan}
        />
      )}
    </>
  );
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const preselectedPlan = useMemo(() => searchParams.get('plan') || undefined, [searchParams]);
  
  // Sign-in form state
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        toast({
          title: "Sign-in failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Sign-in failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSignInData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fdf2f8%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Side - Branding and Info */}
            <div className="text-center xl:text-left space-y-8 lg:space-y-12 order-2 xl:order-1">
              {/* Header Section */}
              <div className="space-y-6 lg:space-y-8">
                <div className="flex items-center justify-center xl:justify-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">LoveAI</h1>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                    Your AI Companion
                    <span className="block bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                      Awaits
                    </span>
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto xl:mx-0 leading-relaxed">
                    Connect with intelligent AI companions designed to understand, support, and engage with you in meaningful conversations.
                  </p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 lg:gap-6">
                <div className="flex items-center gap-4 text-gray-700 p-4 lg:p-6 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:shadow-lg group">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-pink-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-lg">Emotional Intelligence</span>
                    <p className="text-sm text-gray-600">AI that understands your feelings</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-gray-700 p-4 lg:p-6 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:shadow-lg group">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-lg">Real-time Conversations</span>
                    <p className="text-sm text-gray-600">Instant, natural responses</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-gray-700 p-4 lg:p-6 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:shadow-lg group sm:col-span-2 xl:col-span-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-lg">Privacy & Security</span>
                    <p className="text-sm text-gray-600">Your data is always protected</p>
                  </div>
                </div>
              </div>

              {/* Preselected Plan Indicator */}
              {preselectedPlan && (
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6 lg:p-8 shadow-xl">
                  <div className="flex items-center justify-center xl:justify-start gap-4 text-pink-700">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-xl">Selected Plan: {preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)}</span>
                      <p className="text-sm text-pink-600 mt-1">You'll be charged after completing signup</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full max-w-lg mx-auto order-1 xl:order-2">
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-8 pt-8 px-8 relative">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="absolute left-6 top-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {preselectedPlan ? 'Complete Your Signup' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-lg">
                      {preselectedPlan 
                        ? `Get started with the ${preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)} plan`
                        : 'Sign in to continue your journey'
                      }
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <Tabs defaultValue={preselectedPlan ? "signup" : "signin"} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-xl p-1">
                      <TabsTrigger 
                        value="signin"
                        className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg font-semibold"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup"
                        className="data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg font-semibold"
                      >
                        Sign Up
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="space-y-6">
                      <form onSubmit={handleSignIn} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              value={signInData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="pl-12 h-14 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={signInData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                              className="pl-12 pr-12 h-14 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl text-lg"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-14 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Signing In...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-5 h-5 mr-2" />
                              Sign In
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-6">
                      <SignupForm preselectedPlan={preselectedPlan} />
                    </TabsContent>
                  </Tabs>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500 text-center leading-relaxed">
                      By continuing, you agree to our{' '}
                      <a href="/terms" className="text-pink-500 hover:text-pink-600 underline font-medium">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-pink-500 hover:text-pink-600 underline font-medium">
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
