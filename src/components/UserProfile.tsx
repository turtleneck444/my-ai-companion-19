import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield, 
  Crown, 
  Zap, 
  MessageSquare, 
  Phone, 
  Heart,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Star,
  Calendar,
  MapPin,
  Users,
  Palette,
  Volume2,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PaymentModal } from '@/components/PaymentModal';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  preferred_name?: string;
  date_of_birth?: string;
  location?: string;
  interests?: string[];
  pronouns?: string;
  communication_style?: string;
  emotional_tone?: string;
  response_length?: string;
  formality_level?: string;
  humor_level?: string;
  voice_preference?: string;
  theme_preference?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  voice_call_notifications?: boolean;
  message_notifications?: boolean;
  profile_visibility?: string;
  data_sharing?: boolean;
  analytics_tracking?: boolean;
  plan?: string;
  subscription_status?: string;
  messages_used?: number;
  voice_calls_used?: number;
  messages_limit?: number;
  voice_calls_limit?: number;
  created_at?: string;
  updated_at?: string;
}

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: '$0',
    features: ['5 messages per day', '1 voice call per day', 'Basic features'],
    limits: { messages: 5, voice_calls: 1 }
  },
  premium: {
    name: 'Premium',
    price: '$19/month',
    features: ['50 messages per day', '5 voice calls per day', 'Advanced features', 'Priority support'],
    limits: { messages: 50, voice_calls: 5 }
  },
  pro: {
    name: 'Pro',
    price: '$49/month',
    features: ['Unlimited messages', 'Unlimited voice calls', 'All features', 'API access'],
    limits: { messages: -1, voice_calls: -1 }
  }
};

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [activeTab, setActiveTab] = useState('profile');
  const [refreshKey, setRefreshKey] = useState(0);

  // Load user profile
  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First try to get by user_id
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If not found, try to get by email
      if (error && user.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (!emailError && emailData) {
          data = emailData;
          error = null;
        }
      }

      if (error) {
        console.error('Error loading profile:', error);
        
        // Create a new profile if none exists
        const newProfile: Partial<UserProfile> = {
          user_id: user.id,
          email: user.email || '',
          preferred_name: user.user_metadata?.full_name || '',
          plan: 'free', // Use 'plan' instead of 'subscription_plan' to match AuthContext
          subscription_status: 'active',
          messages_used: 0,
          voice_calls_used: 0,
          messages_limit: 5,
          voice_calls_limit: 1,
          email_notifications: true,
          push_notifications: true,
          voice_call_notifications: true,
          message_notifications: true,
          profile_visibility: 'private',
          data_sharing: false,
          analytics_tracking: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: insertData, error: insertError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast({
            title: "Error",
            description: "Failed to create user profile. Please try again.",
            variant: "destructive"
          });
          return;
        }

        setProfile(insertData);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save user profile
  const saveProfile = async (updates: Partial<UserProfile>) => {
    if (!profile || !user) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "Failed to save changes. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Unexpected error saving profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle plan change
  const handlePlanChange = async (newPlan: string) => {
    if (!profile) return;

    if (newPlan === 'free') {
      // Downgrade to free
      await saveProfile({
        plan: 'free',
        subscription_status: 'active',
        messages_limit: 5,
        voice_calls_limit: 1
      });
      
      toast({
        title: "Plan Updated",
        description: "Your plan has been changed to Free. Changes will take effect on your next billing cycle.",
      });
    } else {
      // Upgrade - show payment modal
      setSelectedPlan(newPlan);
      setShowPaymentModal(true);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (plan: string) => {
    const limits = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]?.limits;
    
    await saveProfile({
      plan: plan,
      subscription_status: 'active',
      messages_limit: limits?.messages || 5,
      voice_calls_limit: limits?.voice_calls || 1
    });
    
    setShowPaymentModal(false);
    setSelectedPlan('');
    
    toast({
      title: "Upgrade Successful!",
      description: `Welcome to ${SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]?.name}!`,
    });
  };

  // Refresh profile data
  const refreshProfile = () => {
    setRefreshKey(prev => prev + 1);
    loadUserProfile();
  };

  // Load profile on mount and when user changes
  useEffect(() => {
    loadUserProfile();
  }, [user, refreshKey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadUserProfile();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Profile</h3>
            <p className="text-muted-foreground">Please wait while we load your profile...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">We couldn't load your profile. Please try refreshing the page.</p>
            <Button onClick={refreshProfile} className="bg-pink-400 hover:bg-pink-500 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentPlan = SUBSCRIPTION_PLANS[profile.plan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
  const usagePercentage = {
    messages: profile.messages_limit > 0 ? (profile.messages_used || 0) / profile.messages_limit * 100 : 0,
    voiceCalls: profile.voice_calls_limit > 0 ? (profile.voice_calls_used || 0) / profile.voice_calls_limit * 100 : 0
  };

  // Check if user has unlimited plan
  const isUnlimited = profile.plan === 'pro';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account, preferences, and subscription</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshProfile}
              variant="outline"
              size="sm"
              className="text-pink-400 border-pink-400 hover:bg-pink-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_name">Preferred Name</Label>
                    <Input
                      id="preferred_name"
                      value={profile.preferred_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, preferred_name: e.target.value } : null)}
                      placeholder="Enter your preferred name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={profile.date_of_birth || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, date_of_birth: e.target.value } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                      placeholder="City, Country"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pronouns">Pronouns</Label>
                    <Select
                      value={profile.pronouns || ''}
                      onValueChange={(value) => setProfile(prev => prev ? { ...prev, pronouns: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pronouns" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="she/her">She/Her</SelectItem>
                        <SelectItem value="he/him">He/Him</SelectItem>
                        <SelectItem value="they/them">They/Them</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Textarea
                    id="interests"
                    value={Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || '')}
                    onChange={(e) => setProfile(prev => prev ? { 
                      ...prev, 
                      interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) 
                    } : null)}
                    placeholder="Enter your interests separated by commas"
                    rows={3}
                  />
                </div>
                
                <Button
                  onClick={() => saveProfile(profile)}
                  disabled={saving}
                  className="bg-pink-400 hover:bg-pink-500 text-white"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize how you interact with your AI companions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Communication Style</Label>
                    <Select
                      value={profile.communication_style || 'friendly'}
                      onValueChange={(value) => setProfile(prev => prev ? { ...prev, communication_style: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="intimate">Intimate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Emotional Tone</Label>
                    <Select
                      value={profile.emotional_tone || 'balanced'}
                      onValueChange={(value) => setProfile(prev => prev ? { ...prev, emotional_tone: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cheerful">Cheerful</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="passionate">Passionate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Response Length</Label>
                    <Select
                      value={profile.response_length || 'medium'}
                      onValueChange={(value) => setProfile(prev => prev ? { ...prev, response_length: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Voice Preference</Label>
                    <Select
                      value={profile.voice_preference || 'female'}
                      onValueChange={(value) => setProfile(prev => prev ? { ...prev, voice_preference: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Humor Level</Label>
                    <div className="px-4">
                      <Slider
                        value={[parseInt(profile.humor_level || '5')]}
                        onValueChange={([value]) => setProfile(prev => prev ? { ...prev, humor_level: value.toString() } : null)}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Serious</span>
                        <span>Very Funny</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Theme Preference</Label>
                    <Select
                      value={profile.theme_preference || 'light'}
                      onValueChange={(value) => setProfile(prev => prev ? { ...prev, theme_preference: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  onClick={() => saveProfile(profile)}
                  disabled={saving}
                  className="bg-pink-400 hover:bg-pink-500 text-white"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  Manage your subscription and usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                  <div>
                    <h3 className="text-xl font-semibold text-pink-600">{currentPlan.name}</h3>
                    <p className="text-muted-foreground">{currentPlan.price}</p>
                  </div>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                    {profile.subscription_status || 'Active'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Usage This Month</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Messages</span>
                          <span>
                            {isUnlimited ? (
                              <span className="text-green-600 font-semibold">Unlimited</span>
                            ) : (
                              `${profile.messages_used || 0} / ${profile.messages_limit || 0}`
                            )}
                          </span>
                        </div>
                        {!isUnlimited && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-pink-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(usagePercentage.messages, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Voice Calls</span>
                          <span>
                            {isUnlimited ? (
                              <span className="text-green-600 font-semibold">Unlimited</span>
                            ) : (
                              `${profile.voice_calls_used || 0} / ${profile.voice_calls_limit || 0}`
                            )}
                          </span>
                        </div>
                        {!isUnlimited && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(usagePercentage.voiceCalls, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Plan Features</h4>
                    <ul className="space-y-2">
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Plan</CardTitle>
                <CardDescription>
                  Upgrade or downgrade your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border ${
                      profile.plan === key
                        ? 'border-pink-400 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">{plan.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {profile.plan === key && (
                          <Badge className="bg-pink-400 text-white">Current</Badge>
                        )}
                        {profile.plan !== key && (
                          <Button
                            size="sm"
                            onClick={() => handlePlanChange(key)}
                            className="bg-pink-400 hover:bg-pink-500 text-white"
                          >
                            {key === 'free' ? 'Downgrade' : 'Upgrade'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your payment methods and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
                  <p className="text-muted-foreground mb-4">
                    Add a payment method to upgrade your plan
                  </p>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-pink-400 hover:bg-pink-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      id="email_notifications"
                      checked={profile.email_notifications || false}
                      onCheckedChange={(checked) => setProfile(prev => prev ? { ...prev, email_notifications: checked } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push_notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
                    </div>
                    <Switch
                      id="push_notifications"
                      checked={profile.push_notifications || false}
                      onCheckedChange={(checked) => setProfile(prev => prev ? { ...prev, push_notifications: checked } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice_call_notifications">Voice Call Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified about voice calls</p>
                    </div>
                    <Switch
                      id="voice_call_notifications"
                      checked={profile.voice_call_notifications || false}
                      onCheckedChange={(checked) => setProfile(prev => prev ? { ...prev, voice_call_notifications: checked } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="message_notifications">Message Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                    </div>
                    <Switch
                      id="message_notifications"
                      checked={profile.message_notifications || false}
                      onCheckedChange={(checked) => setProfile(prev => prev ? { ...prev, message_notifications: checked } : null)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Privacy Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile_visibility">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                    </div>
                    <Select
                      value={profile.profile_visibility || 'private'}
                      onValueChange={(value) => setProfile(prev => prev ? { ...prev, profile_visibility: value } : null)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data_sharing">Data Sharing</Label>
                      <p className="text-sm text-muted-foreground">Allow data to be used for improvements</p>
                    </div>
                    <Switch
                      id="data_sharing"
                      checked={profile.data_sharing || false}
                      onCheckedChange={(checked) => setProfile(prev => prev ? { ...prev, data_sharing: checked } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="analytics_tracking">Analytics Tracking</Label>
                      <p className="text-sm text-muted-foreground">Help us improve by sharing usage data</p>
                    </div>
                    <Switch
                      id="analytics_tracking"
                      checked={profile.analytics_tracking || false}
                      onCheckedChange={(checked) => setProfile(prev => prev ? { ...prev, analytics_tracking: checked } : null)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => saveProfile(profile)}
                  disabled={saving}
                  className="bg-pink-400 hover:bg-pink-500 text-white"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Modal */}
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
            plan={selectedPlan}
          />
        )}
      </div>
    </div>
  );
};
