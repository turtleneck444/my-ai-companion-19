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
import { Mail, Lock, LogIn, Shield, Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
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
      });
    } catch (error: any) {
      toast({
        title: "Sign-in failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Brand gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-rose-50 to-pink-50" />
      <div className="absolute -top-32 -left-32 h-80 w-80 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 bg-pink-300/20 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 py-14">
        <Card className="border-0 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 via-pink-600 to-rose-600 bg-clip-text text-transparent">
              LoveAI Companion
            </CardTitle>
            <CardDescription className="text-base md:text-lg text-muted-foreground">
              {preselectedPlan ? (
                <>
                  Complete your signup to get started with the <span className="font-semibold text-pink-600 capitalize">{preselectedPlan}</span> plan.
                </>
              ) : (
                "Sign in or create your account to start meaningful AI connections."
              )}
            </CardDescription>
            {preselectedPlan && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-center gap-2 text-pink-700">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Selected Plan: {preselectedPlan.charAt(0).toUpperCase() + preselectedPlan.slice(1)}</span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={preselectedPlan ? "signup" : "signin"} className="w-full">
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-2 w-full max-w-sm rounded-full">
                  <TabsTrigger className="rounded-full" value="signin">Sign In</TabsTrigger>
                  <TabsTrigger className="rounded-full" value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="signin" className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                  {/* Form */}
                  <div className="space-y-5">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@loveaicompanion.com"
                            value={signInData.email}
                            onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            className="pl-9 py-6 text-base"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signInData.password}
                            onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            className="pl-9 pr-10 py-6 text-base"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 py-0 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full py-6 text-lg" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-5 w-5" />
                            Sign In
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        By continuing, you agree to our <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/privacy">Privacy Policy</a>.
                      </p>
                    </form>
                  </div>

                  {/* Brand / Benefits */}
                  <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
                    <div className="space-y-5">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-foreground">Secure & Private</p>
                          <p className="text-sm text-muted-foreground">Protected by modern authentication and encryption. Your chats remain private.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-foreground">Personalized Companions</p>
                          <p className="text-sm text-muted-foreground">Choose your style: sweet, sassy, or soulful. Build a connection that feels real.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-foreground">Human Support</p>
                          <p className="text-sm text-muted-foreground">Questions? Reach us anytime at support@loveaicompanion.com</p>
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
