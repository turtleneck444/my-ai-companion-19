
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthForm } from '@/components/AuthForm';
import { UnifiedSignupFlow } from '@/components/UnifiedSignupFlow';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // Get plan from URL parameters
  const preselectedPlan = searchParams.get('plan') || 'free';

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome to LoveAI
          </h1>
          <p className="text-muted-foreground">Your AI companion awaits</p>
        </div>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="p-6">
                <AuthForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <UnifiedSignupFlow 
              preselectedPlan={preselectedPlan}
              onClose={() => {}}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth; 