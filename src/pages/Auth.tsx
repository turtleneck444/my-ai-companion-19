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
import { Mail, Lock, LogIn, ArrowRight, Shield, Sparkles, Chrome, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app'
        }
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: 'Google sign-in failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Welcome to LoveAI</CardTitle>
            <CardDescription className="text-center text-lg">
              Your AI companion awaits. Sign in to continue or create a new account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={handleGoogle}>
                      <Chrome className="w-4 h-4 mr-2" />
                      Continue with Google
                    </Button>
                    <div className="relative text-center text-xs text-muted-foreground">
                      <span className="px-2 bg-background relative z-10">or</span>
                      <div className="absolute inset-x-0 top-1/2 border-t" />
                    </div>
                    
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          value={signInData.email}
                          onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={signInData.password}
                            onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                  
                  <div className="hidden md:block">
                    <div className="rounded-lg border p-6 text-sm text-muted-foreground space-y-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Secure Authentication</p>
                          <p>Powered by Supabase with enterprise-grade security</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">One-Click Access</p>
                          <p>Sign in with Google for the fastest experience</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Email Support</p>
                          <p>Need help? Contact us at support@loveaicompanion.com</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
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
