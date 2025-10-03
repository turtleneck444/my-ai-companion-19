import React, { useMemo, useState } from "react";
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedSignupFlow } from '@/components/UnifiedSignupFlow';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, LogIn, Shield, Sparkles, Eye, EyeOff, Loader2, Crown, Heart, Star, Zap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding and Info */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">LoveAI</h1>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Your AI Companion
                <span className="block text-pink-500">Awaits</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-md mx-auto lg:mx-0">
                Connect with intelligent AI companions designed to understand, support, and engage with you in meaningful conversations.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
                <span className="font-medium">Emotional Intelligence</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-pink-500" />
                </div>
                <span className="font-medium">Real-time Conversations</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-pink-500" />
                </div>
                <span className="font-medium">Privacy & Security</span>
              </div>
            </div>

            {/* Preselected Plan Indicator */}
            {preselectedPlan && (
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-pink-700">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Selected Plan: {preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {preselectedPlan ? 'Complete Your Signup' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {preselectedPlan 
                    ? `Get started with the ${preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)} plan`
                    : 'Sign in to continue your journey'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                <Tabs defaultValue={preselectedPlan ? "signup" : "signin"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                    <TabsTrigger 
                      value="signin"
                      className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup"
                      className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-6">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={signInData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10 h-12 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={signInData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="pl-10 pr-10 h-12 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-lg"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-all duration-200"
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
                    <UnifiedSignupFlow
                      preselectedPlan={preselectedPlan}
                      onClose={() => {}}
                    />
                  </TabsContent>
                </Tabs>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    By continuing, you agree to our{' '}
                    <a href="/terms" className="text-pink-500 hover:text-pink-600 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-pink-500 hover:text-pink-600 underline">
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
  );
}
