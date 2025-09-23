import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, User, Mail, Settings, LogOut, Heart, Star, Calendar, Crown, 
  Shield, Bell, Volume2, Eye, Trash2, Download, Upload, Camera,
  CreditCard, Zap, BarChart3, MessageSquare, Phone, Timer,
  Edit, Save, X, Check, AlertTriangle, Gift, Sparkles, ChevronRight,
  Pause
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PlanDetails {
  name: string;
  tier: 'free' | 'premium' | 'pro';
  price: number;
  features: string[];
  limits: {
    companions: number;
    messages: number;
    voiceCalls: number;
  };
  nextBilling?: string;
}

export const UserProfile = () => {
  const { user, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    preferredName: '',
    treatmentStyle: 'romantic',
    bio: '',
    avatar: '',
    age: '',
    location: '',
    interests: '',
    relationship_status: 'single',
    pronouns: 'they/them'
  });

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      messages: true,
      calls: true,
      updates: false,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      showOnlineStatus: true,
      allowVoiceCalls: true,
      shareUsageData: false
    },
    preferences: {
      voiceVolume: 75,
      theme: 'system',
      language: 'en',
      contentFilter: true,
      explicitContent: false
    }
  });

  // Mock usage statistics
  const [usageStats] = useState({
    totalMessages: 2847,
    totalCalls: 127,
    totalMinutes: 3420,
    favoriteCompanions: 3,
    daysActive: 45,
    level: 12,
    xp: 8420,
    xpToNext: 1580
  });

  // Current plan (mock data)
  const [currentPlan] = useState<PlanDetails>({
    name: 'Free Launch Week',
    tier: 'free',
    price: 0,
    features: [
      'Unlimited conversations',
      'Voice calls (60 min/month)',
      '3 AI companions',
      'Basic customization',
      'Community support'
    ],
    limits: {
      companions: 3,
      messages: -1, // unlimited
      voiceCalls: 60
    },
    nextBilling: '2024-02-01'
  });

  useEffect(() => {
    if (user?.user_metadata) {
      setProfileData({
        preferredName: user.user_metadata.preferred_name || '',
        treatmentStyle: user.user_metadata.treatment_style || 'romantic',
        bio: user.user_metadata.bio || '',
        avatar: user.user_metadata.avatar || '',
        age: user.user_metadata.age || '',
        location: user.user_metadata.location || '',
        interests: user.user_metadata.interests || '',
        relationship_status: user.user_metadata.relationship_status || 'single',
        pronouns: user.user_metadata.pronouns || 'they/them'
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await updateProfile({
        preferred_name: profileData.preferredName,
        treatment_style: profileData.treatmentStyle,
        bio: profileData.bio,
        avatar: profileData.avatar,
        age: profileData.age,
        location: profileData.location,
        interests: profileData.interests,
        relationship_status: profileData.relationship_status,
        pronouns: profileData.pronouns
      });
      
      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile updated! ✨",
          description: "Your changes have been saved successfully.",
        });
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out 👋",
      description: "You've been successfully signed out.",
    });
    // Redirect to homepage after sign out
    try {
      window.location.href = '/';
    } catch {}
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion",
      description: "This feature will be available soon. Contact support for assistance.",
      variant: "destructive"
    });
  };

  const handleUpgradePlan = () => {
    toast({
      title: "Upgrade coming soon! 🚀",
      description: "Premium plans will be available after launch week.",
    });
  };

  const getTreatmentStyleEmoji = (style: string) => {
    switch (style) {
      case 'romantic': return '💕';
      case 'friendly': return '😊';
      case 'playful': return '😏';
      case 'caring': return '🤗';
      case 'flirty': return '😉';
      case 'intellectual': return '🤓';
      default: return '💕';
    }
  };

  const getPlanBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-green-100 text-green-800 border-green-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
                  <AvatarImage src={profileData.avatar} alt={profileData.preferredName} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                    {profileData.preferredName?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {profileData.preferredName || 'Your Profile'}
                  </h1>
                  <Badge className={`${getPlanBadgeColor(currentPlan.tier)} font-semibold`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {currentPlan.name}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span className="text-xs">{user.email}</span>
                  </Badge>
                  
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span className="text-xs">
                      {getTreatmentStyleEmoji(profileData.treatmentStyle)} {profileData.treatmentStyle}
                    </span>
                  </Badge>
                  
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs">Level {usageStats.level}</span>
                  </Badge>
                  
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">{usageStats.daysActive} days active</span>
                  </Badge>
                </div>
                
                {profileData.bio && (
                  <p className="text-gray-600 mt-2 text-sm max-w-md">{profileData.bio}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                variant={isEditing ? "secondary" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              
              {isEditing && (
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Level Progress</span>
              <span className="text-muted-foreground">{usageStats.xp} / {usageStats.xp + usageStats.xpToNext} XP</span>
            </div>
            <Progress 
              value={(usageStats.xp / (usageStats.xp + usageStats.xpToNext)) * 100} 
              className="h-2"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="plan" className="text-xs">Plan</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs">Privacy</TabsTrigger>
          <TabsTrigger value="account" className="text-xs lg:block hidden">Account</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Usage Analytics
              </CardTitle>
              <CardDescription>Your activity and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-pink-50 border border-pink-200">
                  <MessageSquare className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-pink-600">{usageStats.totalMessages.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Messages Sent</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <Phone className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{usageStats.totalCalls}</div>
                  <div className="text-sm text-gray-600">Voice Calls</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <Timer className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{Math.round(usageStats.totalMinutes / 60)}h</div>
                  <div className="text-sm text-gray-600">Talk Time</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{usageStats.favoriteCompanions}</div>
                  <div className="text-sm text-gray-600">Favorites</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                {isEditing ? 'Edit your personal information' : 'Your personal details and preferences'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred-name">Preferred Name</Label>
                  <Input
                    id="preferred-name"
                    value={profileData.preferredName}
                    onChange={(e) => handleInputChange('preferredName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="What should we call you?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Select
                    value={profileData.pronouns}
                    onValueChange={(value) => handleInputChange('pronouns', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pronouns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="she/her">She/Her</SelectItem>
                      <SelectItem value="he/him">He/Him</SelectItem>
                      <SelectItem value="they/them">They/Them</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={profileData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Your age"
                    type="number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship-status">Relationship Status</Label>
                  <Select
                    value={profileData.relationship_status}
                    onValueChange={(value) => handleInputChange('relationship_status', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="taken">In a relationship</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="complicated">It's complicated</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatment-style">Treatment Style</Label>
                  <Select
                    value={profileData.treatmentStyle}
                    onValueChange={(value) => handleInputChange('treatmentStyle', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select treatment style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="romantic">💕 Romantic</SelectItem>
                      <SelectItem value="friendly">😊 Friendly</SelectItem>
                      <SelectItem value="playful">😏 Playful</SelectItem>
                      <SelectItem value="caring">🤗 Caring</SelectItem>
                      <SelectItem value="flirty">😉 Flirty</SelectItem>
                      <SelectItem value="intellectual">🤓 Intellectual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests & Hobbies</Label>
                <Textarea
                  id="interests"
                  value={profileData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  disabled={!isEditing}
                  placeholder="What do you enjoy? (e.g., reading, gaming, travel, cooking...)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar"
                    value={profileData.avatar}
                    onChange={(e) => handleInputChange('avatar', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://example.com/your-avatar.jpg"
                  />
                  {isEditing && (
                    <Button variant="outline" size="icon" disabled>
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Management Tab */}
        <TabsContent value="plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 rounded-lg border-2 border-dashed border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentPlan.name}</h3>
                  <p className="text-gray-600">
                    {currentPlan.price === 0 ? 'Free during launch week' : `$${currentPlan.price}/month`}
                  </p>
                  {currentPlan.nextBilling && (
                    <p className="text-sm text-gray-500 mt-1">
                      Next billing: {new Date(currentPlan.nextBilling).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge className={`${getPlanBadgeColor(currentPlan.tier)} text-lg px-3 py-1`}>
                    <Crown className="w-4 h-4 mr-1" />
                    {currentPlan.tier.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Usage Limits</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Companions</span>
                    <span className="text-sm font-medium">
                      {usageStats.favoriteCompanions} / {currentPlan.limits.companions === -1 ? '∞' : currentPlan.limits.companions}
                    </span>
                  </div>
                  <Progress 
                    value={currentPlan.limits.companions === -1 ? 30 : (usageStats.favoriteCompanions / currentPlan.limits.companions) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Voice Call Minutes</span>
                    <span className="text-sm font-medium">
                      {Math.round(usageStats.totalMinutes)} / {currentPlan.limits.voiceCalls === -1 ? '∞' : currentPlan.limits.voiceCalls}
                    </span>
                  </div>
                  <Progress 
                    value={currentPlan.limits.voiceCalls === -1 ? 45 : (usageStats.totalMinutes / currentPlan.limits.voiceCalls) * 100} 
                    className="h-2"
                  />
                </div>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Launch Week Special!</strong> Enjoy unlimited access during our launch week. 
                  Premium plans starting at $9.99/month will be available soon.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={handleUpgradePlan} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button variant="outline" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your payment methods and billing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-600">Expires 12/25</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Primary</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
                <Button variant="outline" disabled>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Payment methods will be available when billing begins after launch week.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Billing History
              </CardTitle>
              <CardDescription>View your past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No billing history yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Your billing history will appear here once your subscription begins.
                </p>
                <Button variant="outline" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Download All Invoices
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Subscription Management
              </CardTitle>
              <CardDescription>Control your subscription settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Auto-renewal</h4>
                  <p className="text-sm text-gray-600">Automatically renew your subscription</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Usage alerts</h4>
                  <p className="text-sm text-gray-600">Get notified when approaching limits</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Billing reminders</h4>
                  <p className="text-sm text-gray-600">Email reminders before billing</p>
                </div>
                <Switch checked={false} disabled />
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Subscription
                </Button>
                <Button variant="destructive" className="w-full" disabled>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Subscription management will be available when billing begins after launch week.
                  Contact support if you need assistance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                App Preferences
              </CardTitle>
              <CardDescription>Customize your LoveAI experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Content Filter</Label>
                    <p className="text-sm text-gray-600">Filter inappropriate content</p>
                  </div>
                  <Switch
                    checked={settings.preferences.contentFilter}
                    onCheckedChange={(checked) => handleSettingChange('preferences', 'contentFilter', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Explicit Content</Label>
                    <p className="text-sm text-gray-600">Allow mature conversations (18+)</p>
                  </div>
                  <Switch
                    checked={settings.preferences.explicitContent}
                    onCheckedChange={(checked) => handleSettingChange('preferences', 'explicitContent', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Voice Volume: {settings.preferences.voiceVolume}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.preferences.voiceVolume}
                    onChange={(e) => handleSettingChange('preferences', 'voiceVolume', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.preferences.theme}
                    onValueChange={(value) => handleSettingChange('preferences', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) => handleSettingChange('preferences', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Control what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">New Messages</Label>
                  <p className="text-sm text-gray-600">Get notified of new messages</p>
                </div>
                <Switch
                  checked={settings.notifications.messages}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'messages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Voice Call Requests</Label>
                  <p className="text-sm text-gray-600">Notifications for incoming calls</p>
                </div>
                <Switch
                  checked={settings.notifications.calls}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'calls', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">App Updates</Label>
                  <p className="text-sm text-gray-600">News about new features</p>
                </div>
                <Switch
                  checked={settings.notifications.updates}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Marketing</Label>
                  <p className="text-sm text-gray-600">Promotional offers and tips</p>
                </div>
                <Switch
                  checked={settings.notifications.marketing}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'marketing', checked)}
                />
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
              <CardDescription>Control your privacy and data sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Profile Visibility</Label>
                  <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                </div>
                <Switch
                  checked={settings.privacy.profileVisible}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'profileVisible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Online Status</Label>
                  <p className="text-sm text-gray-600">Show when you're online</p>
                </div>
                <Switch
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'showOnlineStatus', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Voice Calls</Label>
                  <p className="text-sm text-gray-600">Allow voice call requests</p>
                </div>
                <Switch
                  checked={settings.privacy.allowVoiceCalls}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'allowVoiceCalls', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Usage Analytics</Label>
                  <p className="text-sm text-gray-600">Help improve LoveAI with anonymous usage data</p>
                </div>
                <Switch
                  checked={settings.privacy.shareUsageData}
                  onCheckedChange={(checked) => handleSettingChange('privacy', 'shareUsageData', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your personal data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center gap-2" disabled>
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2" disabled>
                  <Upload className="w-4 h-4" />
                  Import Data
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Data export and import features will be available soon. 
                  Contact support if you need assistance with your data.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Management
              </CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <h4 className="font-medium mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Created:</span>
                      <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{new Date(user.updated_at || user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account ID:</span>
                      <span className="font-mono text-xs">{user.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Account Deletion:</strong> This action cannot be undone. 
                    All your data, conversations, and companions will be permanently deleted.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
