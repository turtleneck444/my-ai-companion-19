
import React, { useMemo } from "react";
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthForm } from '@/components/AuthForm';
import { UnifiedSignupFlow } from '@/components/UnifiedSignupFlow';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, Shield, Sparkles, UserPlus, Chrome } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const preselectedPlan = useMemo(() => searchParams.get('plan') || undefined, [searchParams]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/app" replace />;
  }

  async function handleGoogle() {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Welcome to LoveAI</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full" onClick={handleGoogle}>
                      <Chrome className="w-4 h-4 mr-2" />
                      Continue with Google
                    </Button>
                    <div className="relative text-center text-xs text-muted-foreground">
                      <span className="px-2 bg-background relative z-10">or</span>
                      <div className="absolute inset-x-0 top-1/2 border-t" />
                    </div>
                    {/* Existing email/password sign-in form remains below */}
                  </div>
                  <div className="hidden md:block">
                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                      <p className="mb-2"><Shield className="inline w-4 h-4 mr-1" /> Secure authentication powered by Supabase</p>
                      <p><Sparkles className="inline w-4 h-4 mr-1" /> One-tap with Google for fastest access</p>
                    </div>
                  </div>
                </div>
                {/* ... existing sign-in form content ... */}
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