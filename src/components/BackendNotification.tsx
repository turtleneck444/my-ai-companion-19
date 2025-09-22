import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database, Zap, Mic } from "lucide-react";

interface BackendNotificationProps {
  onDismiss: () => void;
}

export const BackendNotification = ({ onDismiss }: BackendNotificationProps) => {
  return (
    <Card className="mx-4 mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 shadow-romance">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <AlertCircle className="w-5 h-5" />
          Connect Supabase for Full Functionality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          To unlock the complete AI girlfriend experience, connect your project to Supabase:
        </p>
        
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <Database className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p>Memory Storage</p>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p>OpenAI Chat</p>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <Mic className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p>Voice Calls</p>
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="romance" 
            size="sm" 
            className="flex-1"
            onClick={() => window.open('https://docs.lovable.dev/integrations/supabase/', '_blank')}
          >
            Connect Now
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};