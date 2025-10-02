import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Settings, 
  Crown, 
  MessageSquare, 
  Phone, 
  Heart, 
  Brain, 
  Zap,
  Save,
  Edit,
  Check,
  X,
  Star,
  Gift,
  Shield,
  Bell,
  Palette,
  Volume2,
  Moon,
  Sun,
  RefreshCw,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PaymentProcessor, SUBSCRIPTION_PLANS } from '@/lib/payments';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface UserProfileData {
  id: string;
  user_id: string;
  email: string;
  preferred_name: string;
  date_of_birth: string | null;
  location: string | null;
  interests: string[];
  pronouns: string | null;
  plan: string;
  subscription_status: string | null;
  total_spent: number;
  usage_messages_today: number;
  usage_voice_calls_today: number;
  usage_companions_created: number;
  last_active_at: string;
  created_at: string;
}

interface UserPreferences {
  communication_style: string;
  emotional_tone: string;
  response_length: string;
  formality_level: string;
  humor_level: string;
  voice_preference: string;
  theme_preference: string;
  notification_settings: {
    email_notifications: boolean;
    push_notifications: boolean;
    voice_call_notifications: boolean;
    message_notifications: boolean;
  };
  privacy_settings: {
    profile_visibility: string;
    data_sharing: boolean;
    analytics_tracking: boolean;
  };
}

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

const PaymentForm = ({ 
  selectedPlan, 
  onSuccess, 
  onCancel 
}: { 
  selectedPlan: string; 
  onSuccess: () => void; 
  onCancel: () => void; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardElementReady, setCardElementReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create subscription
      const response = await fetch('/.netlify/functions/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_subscription',
          planId: selectedPlan,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      toast({
        title: "Success!",
        description: "Your subscription has been updated successfully.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="card-element">Card Details</Label>
        <div className="mt-2 p-3 border border-gray-300 rounded-md">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
            onReady={() => setCardElementReady(true)}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!stripe || !cardElementReady || isProcessing}
          className="bg-pink-400 hover:bg-pink-500 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe to {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    communication_style: 'friendly',
    emotional_tone: 'warm',
    response_length: 'medium',
    formality_level: 'casual',
    humor_level: 'moderate',
    voice_preference: 'default',
    theme_preference: 'light',
    notification_settings: {
      email_notifications: true,
      push_notifications: true,
      voice_call_notifications: true,
      message_notifications: true
    },
    privacy_settings: {
      profile_visibility: 'private',
      data_sharing: false,
      analytics_tracking: true
    }
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [downgradePlan, setDowngradePlan] = useState<string>('');

  useEffect(() => {
    loadUserProfile();
    loadPaymentMethods();
  }, [user]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !isSaving) {
        loadUserProfile();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isSaving]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const emailResult = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (emailResult.data) {
          data = emailResult.data;
          error = null;
        } else {
          error = emailResult.error;
        }
      }

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData(data);
        // Load preferences from profile data
        if (data.communication_style) {
          setPreferences(prev => ({
            ...prev,
            communication_style: data.communication_style || 'friendly',
            emotional_tone: data.emotional_tone || 'warm',
            response_length: data.response_length || 'medium',
            formality_level: data.formality_level || 'casual',
            humor_level: data.humor_level || 'moderate',
            voice_preference: data.voice_preference || 'default',
            theme_preference: data.theme_preference || 'light'
          }));
        }
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: user.id,
            email: user.email,
            preferred_name: user.user_metadata?.preferred_name || user.email?.split('@')[0] || 'User',
            plan: 'free'
          }])
          .select()
          .single();

        if (createError) throw createError;
        setProfileData(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    // This would typically load from Stripe
    // For now, we'll simulate it
    setPaymentMethods([]);
  };

  const saveProfile = async () => {
    if (!profileData || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          preferred_name: profileData.preferred_name,
          date_of_birth: profileData.date_of_birth,
          location: profileData.location,
          interests: profileData.interests,
          pronouns: profileData.pronouns,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          communication_style: preferences.communication_style,
          emotional_tone: preferences.emotional_tone,
          response_length: preferences.response_length,
          formality_level: preferences.formality_level,
          humor_level: preferences.humor_level,
          voice_preference: preferences.voice_preference,
          theme_preference: preferences.theme_preference,
          notification_settings: preferences.notification_settings,
          privacy_settings: preferences.privacy_settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferences updated successfully"
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlanChange = (newPlan: string) => {
    if (!profileData) return;

    const currentPlanIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === profileData.plan);
    const newPlanIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === newPlan);

    if (newPlanIndex > currentPlanIndex) {
      // Upgrading - require payment
      setSelectedPlan(newPlan);
      setShowPaymentForm(true);
    } else if (newPlanIndex < currentPlanIndex) {
      // Downgrading - confirm and schedule for next billing cycle
      setDowngradePlan(newPlan);
      setShowDowngradeConfirm(true);
    }
  };

  const confirmDowngrade = async () => {
    if (!user || !downgradePlan) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          plan: downgradePlan,
          subscription_status: 'downgrade_pending',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Downgrade Scheduled",
        description: `Your plan will change to ${SUBSCRIPTION_PLANS.find(p => p.id === downgradePlan)?.name} on your next billing cycle.`
      });

      setShowDowngradeConfirm(false);
      setDowngradePlan('');
      loadUserProfile();
    } catch (error) {
      console.error('Error downgrading plan:', error);
      toast({
        title: "Error",
        description: "Failed to schedule downgrade",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan('');
    loadUserProfile();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load profile data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === profileData.plan);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <Button
          onClick={() => loadUserProfile()}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                >
                  {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input
                    id="preferred_name"
                    value={profileData.preferred_name || ''}
                    onChange={(e) => setProfileData(prev => prev ? { ...prev, preferred_name: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profileData.date_of_birth || ''}
                    onChange={(e) => setProfileData(prev => prev ? { ...prev, date_of_birth: e.target.value } : null)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileData.location || ''}
                    onChange={(e) => setProfileData(prev => prev ? { ...prev, location: e.target.value } : null)}
                    disabled={!isEditing}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Select
                    value={profileData.pronouns || ''}
                    onValueChange={(value) => setProfileData(prev => prev ? { ...prev, pronouns: value } : null)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pronouns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="he/him">He/Him</SelectItem>
                      <SelectItem value="she/her">She/Her</SelectItem>
                      <SelectItem value="they/them">They/Them</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="interests">Interests</Label>
                <Textarea
                  id="interests"
                  value={profileData.interests?.join(', ') || ''}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) } : null)}
                  disabled={!isEditing}
                  placeholder="Enter your interests separated by commas"
                />
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="bg-pink-400 hover:bg-pink-500 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Communication Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Communication Style</Label>
                  <Select
                    value={preferences.communication_style}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, communication_style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Emotional Tone</Label>
                  <Select
                    value={preferences.emotional_tone}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, emotional_tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Response Length</Label>
                  <Select
                    value={preferences.response_length}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, response_length: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Voice Preference</Label>
                  <Select
                    value={preferences.voice_preference}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, voice_preference: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Notification Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={preferences.notification_settings.email_notifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        notification_settings: {
                          ...prev.notification_settings,
                          email_notifications: checked
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
                    </div>
                    <Switch
                      checked={preferences.notification_settings.push_notifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        notification_settings: {
                          ...prev.notification_settings,
                          push_notifications: checked
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={savePreferences}
                disabled={isSaving}
                className="bg-pink-400 hover:bg-pink-500 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan?.name}</h3>
                  <p className="text-muted-foreground">
                    ${currentPlan?.price}/{currentPlan?.interval === 'forever' ? 'forever' : 'month'}
                  </p>
                </div>
                <Badge className="bg-pink-400 text-white">
                  {profileData.subscription_status || 'Active'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg ${
                      plan.id === profileData.plan ? 'border-pink-400 bg-pink-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      {plan.id === profileData.plan && (
                        <CheckCircle className="w-5 h-5 text-pink-400" />
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-2">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.interval === 'forever' ? 'forever' : 'month'}
                      </span>
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {plan.id !== profileData.plan && (
                      <Button
                        onClick={() => handlePlanChange(plan.id)}
                        className="w-full bg-pink-400 hover:bg-pink-500 text-white"
                        size="sm"
                      >
                        {SUBSCRIPTION_PLANS.findIndex(p => p.id === plan.id) > 
                         SUBSCRIPTION_PLANS.findIndex(p => p.id === profileData.plan) 
                          ? 'Upgrade' : 'Downgrade'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment methods on file</p>
                  <Button className="mt-4 bg-pink-400 hover:bg-pink-500 text-white">
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5" />
                        <div>
                          <p className="font-medium">
                            {method.card.brand.toUpperCase()} •••• {method.card.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.card.exp_month}/{method.card.exp_year}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No billing history available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise}>
                <PaymentForm
                  selectedPlan={selectedPlan}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentForm(false)}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      {showDowngradeConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Downgrade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to downgrade to {SUBSCRIPTION_PLANS.find(p => p.id === downgradePlan)?.name}? 
                This change will take effect on your next billing cycle.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={confirmDowngrade}
                  disabled={isSaving}
                  className="bg-pink-400 hover:bg-pink-500 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Downgrade'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDowngradeConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
