import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const EnhancedIndex = () => {
  const { user } = useAuth();
  const [currentView] = useState('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to LoveAI! 🌟</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your AI companions are ready to chat
          </p>
          
          {user && (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-2">Hello, {user.email || 'User'}!</h2>
              <p className="text-muted-foreground">Ready for some quality time together?</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">💬 Start Chatting</h3>
              <p className="text-sm text-muted-foreground">Connect with your AI companions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">📞 Voice Calls</h3>
              <p className="text-sm text-muted-foreground">Talk to your companions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">⭐ Favorites</h3>
              <p className="text-sm text-muted-foreground">Your favorite companions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;
