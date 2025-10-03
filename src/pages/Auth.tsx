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
import { Mail, Lock, LogIn, Shield, Sparkles, Eye, EyeOff, Loader2, Crown, Heart, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14 relative z-10">
        <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/80 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-6 text-center bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-4xl font-extrabold tracking-tight">
              LoveAI Companion
            </CardTitle>
            <CardDescription className="text-pink-100 text-lg">
              {preselectedPlan ? (
                <>
                  Complete your signup to get started with the <span className="font-semibold text-white">{preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)}</span> plan.
                </>
              ) : (
                "Sign in or create your account to start meaningful AI connections."
              )}
            </CardDescription>
            {preselectedPlan && (
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 mt-4">
                <div className="flex items-center justify-center gap-3 text-white">
                  <Crown className="w-6 h-6" />
                  <span className="font-semibold text-lg">Selected Plan: {preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)}</span>
                  <Star className="w-5 h-5" />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue={preselectedPlan ? "signup" : "signin"} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid grid-cols-2 w-full max-w-sm rounded-full bg-gray-100 p-1">
                  <TabsTrigger 
                    className="rounded-full data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-all duration-300" 
                    value="signin"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    className="rounded-full data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-all duration-300" 
                    value="signup"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="signin" className="space-y-8 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  {/* Sign In Form */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h3>
                      <p className="text-gray-600">Sign in to continue your AI journey</p>
                    </div>
                    
                    <form onSubmit={handleSignIn} className="space-y-6">
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
                            className="pl-10 h-12 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
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
                            className="pl-10 pr-10 h-12 border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
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
                        className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
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
                      
                      <p className="text-xs text-gray-500 text-center">
                        By continuing, you agree to our <a className="text-pink-500 hover:text-pink-600 underline" href="/terms">Terms</a> and <a className="text-pink-500 hover:text-pink-600 underline" href="/privacy">Privacy Policy</a>.
                      </p>
                    </form>
                  </div>

                  {/* Benefits Section */}
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 space-y-6">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Why Choose LoveAI?</h4>
                      <p className="text-gray-600">Experience the future of AI companionship</p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-1">Secure & Private</h5>
                          <p className="text-sm text-gray-600">Protected by modern authentication and encryption. Your chats remain private.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-1">Personalized Companions</h5>
                          <p className="text-sm text-gray-600">Choose your style: sweet, sassy, or soulful. Build a connection that feels real.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Zap className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-1">Real-time Responses</h5>
                          <p className="text-sm text-gray-600">Get instant, intelligent responses that adapt to your mood and conversation style.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 pt-6">
                <UnifiedSignupFlow
                  preselectedPlan={preselectedPlan}
                  onClose={() => {}}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
