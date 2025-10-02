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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    messages: 10,
    voice_calls: 2,
    companions: 1,
    features: ['Basic chat', '2 voice calls', '1 AI companion']
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    messages: 1000,
    voice_calls: 100,
    companions: 10,
    features: ['Unlimited chat', '100 voice calls', '10 AI companions', 'Priority support']
  },
  pro: {
    name: 'Pro',
    price: 49.99,
    messages: 10000,
    voice_calls: 1000,
    companions: 50,
    features: ['Everything in Premium', '1000 voice calls', '50 AI companions', 'Advanced features', 'API access']
  }
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  // Add this useEffect to refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !isSaving) {
        loadUserProfile();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, isSaving]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData(data);
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

  const upgradePlan = async (newPlan: string) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          plan: newPlan,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Upgraded to ${PLANS[newPlan as keyof typeof PLANS].name} plan`
      });

      // Reload profile data
      await loadUserProfile();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: "Error",
        description: "Failed to upgrade plan",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    );
  }

  const currentPlan = PLANS[profileData.plan as keyof typeof PLANS] || PLANS.free;
  const messageUsage = (profileData.usage_messages_today / currentPlan.messages) * 100;
  const voiceUsage = (profileData.usage_voice_calls_today / currentPlan.voice_calls) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUserProfile}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant={profileData?.plan === 'free' ? 'secondary' : 'default'}>
            {profileData ? PLANS[profileData.plan as keyof typeof PLANS].name : 'Loading'} Plan
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input
                    id="preferred_name"
                    value={profileData.preferred_name}
                    onChange={(e) => setProfileData(prev => prev ? { ...prev, preferred_name: e.target.value } : null)}
                    disabled={!isEditing}
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
                  onChange={(e) => setProfileData(prev => prev ? { 
                    ...prev, 
                    interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) 
                  } : null)}
                  disabled={!isEditing}
                  placeholder="Enter your interests separated by commas"
                />
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={saveProfile} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label>Humor Level</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[preferences.humor_level === 'none' ? 0 : preferences.humor_level === 'low' ? 1 : preferences.humor_level === 'moderate' ? 2 : 3]}
                      onValueChange={([value]) => {
                        const levels = ['none', 'low', 'moderate', 'high'];
                        setPreferences(prev => ({ ...prev, humor_level: levels[value] }));
                      }}
                      max={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>None</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <span>Email Notifications</span>
                    </div>
                    <Switch
                      checked={preferences.notification_settings.email_notifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        notification_settings: { ...prev.notification_settings, email_notifications: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Message Notifications</span>
                    </div>
                    <Switch
                      checked={preferences.notification_settings.message_notifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        notification_settings: { ...prev.notification_settings, message_notifications: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Voice Call Notifications</span>
                    </div>
                    <Switch
                      checked={preferences.notification_settings.voice_call_notifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        notification_settings: { ...prev.notification_settings, voice_call_notifications: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={savePreferences} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Preferences'}
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
                Subscription & Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-semibold">Messages</h3>
                  <p className="text-2xl font-bold">{profileData.usage_messages_today} / {currentPlan.messages}</p>
                  <Progress value={messageUsage} className="mt-2" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Phone className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <h3 className="font-semibold">Voice Calls</h3>
                  <p className="text-2xl font-bold">{profileData.usage_voice_calls_today} / {currentPlan.voice_calls}</p>
                  <Progress value={voiceUsage} className="mt-2" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                  <h3 className="font-semibold">Companions</h3>
                  <p className="text-2xl font-bold">{profileData.usage_companions_created} / {currentPlan.companions}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(PLANS).map(([key, plan]) => (
                    <Card key={key} className={profileData.plan === key ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {plan.name}
                          {profileData.plan === key && <Badge>Current</Badge>}
                        </CardTitle>
                        <div className="text-3xl font-bold">${plan.price}/month</div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {profileData.plan !== key && (
                          <Button 
                            onClick={() => upgradePlan(key)}
                            disabled={isSaving}
                            className="w-full"
                          >
                            {isSaving ? 'Upgrading...' : 'Upgrade'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Visibility</h3>
                <Select
                  value={preferences.privacy_settings.profile_visibility}
                  onValueChange={(value) => setPreferences(prev => ({
                    ...prev,
                    privacy_settings: { ...prev.privacy_settings, profile_visibility: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Data & Analytics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Data Sharing</span>
                      <p className="text-sm text-muted-foreground">Allow data to be used for improving the service</p>
                    </div>
                    <Switch
                      checked={preferences.privacy_settings.data_sharing}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        privacy_settings: { ...prev.privacy_settings, data_sharing: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Analytics Tracking</span>
                      <p className="text-sm text-muted-foreground">Help us understand how you use the app</p>
                    </div>
                    <Switch
                      checked={preferences.privacy_settings.analytics_tracking}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        privacy_settings: { ...prev.privacy_settings, analytics_tracking: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={savePreferences} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

