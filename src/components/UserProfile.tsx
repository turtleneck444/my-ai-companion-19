import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Mail, Settings, LogOut, Heart, Star, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const UserProfile = () => {
  const { user, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    preferredName: '',
    treatmentStyle: 'romantic',
    bio: '',
    avatar: ''
  });

  useEffect(() => {
    if (user?.user_metadata) {
      setProfileData({
        preferredName: user.user_metadata.preferred_name || '',
        treatmentStyle: user.user_metadata.treatment_style || 'romantic',
        bio: user.user_metadata.bio || '',
        avatar: user.user_metadata.avatar || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await updateProfile({
        preferred_name: profileData.preferredName,
        treatment_style: profileData.treatmentStyle,
        bio: profileData.bio,
        avatar: profileData.avatar
      });
      
      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile updated!",
          description: "Your changes have been saved.",
        });
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
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  const getTreatmentStyleEmoji = (style: string) => {
    switch (style) {
      case 'romantic': return '💕';
      case 'friendly': return '😊';
      case 'playful': return '😏';
      case 'caring': return '🤗';
      default: return '💕';
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profileData.avatar} alt={profileData.preferredName} />
              <AvatarFallback className="text-lg">
                {profileData.preferredName?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profileData.preferredName || 'User'}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{getTreatmentStyleEmoji(profileData.treatmentStyle)} {profileData.treatmentStyle}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Profile Settings</span>
          </CardTitle>
          <CardDescription>
            Customize your AI companion experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-name">Preferred Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preferred-name"
                  value={profileData.preferredName}
                  onChange={(e) => handleInputChange('preferredName', e.target.value)}
                  className="pl-10"
                  placeholder="What should we call you?"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment-style">Treatment Style</Label>
              <Select
                value={profileData.treatmentStyle}
                onValueChange={(value) => handleInputChange('treatmentStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="romantic">💕 Romantic</SelectItem>
                  <SelectItem value="friendly">😊 Friendly</SelectItem>
                  <SelectItem value="playful">😏 Playful</SelectItem>
                  <SelectItem value="caring">🤗 Caring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={profileData.avatar}
              onChange={(e) => handleInputChange('avatar', e.target.value)}
              placeholder="https://example.com/your-avatar.jpg"
            />
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Account Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Companions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Days Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
