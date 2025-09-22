import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Heart, 
  Shield, 
  Clock,
  Download,
  Trash2
} from "lucide-react";

interface UserProfileProps {
  onBack: () => void;
  userPreferences: {
    preferredName: string;
    treatmentStyle: string;
    age: string;
    contentFilter: boolean;
  };
  onUpdatePreferences: (preferences: any) => void;
}

export const UserProfile = ({ onBack, userPreferences, onUpdatePreferences }: UserProfileProps) => {
  const [preferences, setPreferences] = useState(userPreferences);
  const [memoryStats] = useState({
    totalChats: 127,
    totalMessages: 4293,
    favoriteMemories: 23,
    lastActive: '2 hours ago'
  });

  const handleSave = () => {
    onUpdatePreferences(preferences);
    onBack();
  };

  const treatmentStyles = [
    { value: 'friendly', label: 'Friendly & Casual' },
    { value: 'affectionate', label: 'Affectionate & Sweet' },
    { value: 'flirty', label: 'Flirty & Playful' },
    { value: 'supportive', label: 'Supportive & Caring' },
    { value: 'intellectual', label: 'Intellectual & Deep' },
    { value: 'formal', label: 'Formal & Respectful' }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 bg-card/90 backdrop-blur-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile Settings</h1>
        </div>
        <Button onClick={handleSave} className="gradient-romance text-white">
          Save Changes
        </Button>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Profile Avatar */}
        <Card className="shadow-romance border-0">
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src="/placeholder.svg" alt="User" />
              <AvatarFallback className="text-2xl">
                {preferences.preferredName[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{preferences.preferredName || 'User'}</h2>
            <p className="text-muted-foreground">Your AI companions know you as this name</p>
            <Button variant="outline" className="mt-3">
              Change Avatar
            </Button>
          </CardContent>
        </Card>

        {/* Personal Preferences */}
        <Card className="shadow-romance border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredName">Preferred Name</Label>
              <Input
                id="preferredName"
                value={preferences.preferredName}
                onChange={(e) => setPreferences(prev => ({ ...prev, preferredName: e.target.value }))}
                placeholder="How should your AI companions address you?"
                className="bg-background border-0"
              />
              <p className="text-xs text-muted-foreground">
                This is exactly how your AI girlfriends will call you in conversations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentStyle">Treatment Style</Label>
              <Select
                value={preferences.treatmentStyle}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, treatmentStyle: value }))}
              >
                <SelectTrigger className="bg-background border-0">
                  <SelectValue placeholder="How should they treat you?" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={preferences.age}
                onChange={(e) => setPreferences(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Your age (required for content filtering)"
                className="bg-background border-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Memory Statistics */}
        <Card className="shadow-romance border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Memory & Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{memoryStats.totalChats}</p>
                <p className="text-xs text-muted-foreground">Total Chats</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{memoryStats.totalMessages}</p>
                <p className="text-xs text-muted-foreground">Messages Sent</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Favorite Memories</span>
              <Badge variant="secondary">{memoryStats.favoriteMemories}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Active</span>
              <span className="text-sm text-muted-foreground">{memoryStats.lastActive}</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Safety */}
        <Card className="shadow-romance border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy & Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="contentFilter">Safe Content Only</Label>
                <p className="text-xs text-muted-foreground">Filter explicit content in conversations</p>
              </div>
              <Switch
                id="contentFilter"
                checked={preferences.contentFilter}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, contentFilter: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="shadow-romance border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </Button>
            
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Memories
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};