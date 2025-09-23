import React, { useState } from 'react';
import { Share, Facebook, Twitter, MessageCircle, Copy, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  via?: string;
  showStats?: boolean;
  variant?: 'default' | 'floating' | 'inline' | 'viral';
}

export const SocialShare: React.FC<SocialShareProps> = ({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = "I just discovered LoveAI - the most amazing AI companion! 🤖💕",
  description = "This AI companion app is incredible! It's like having a real conversation with someone who truly understands you. Try it free! #LoveAI #AICompanion",
  hashtags = ['LoveAI', 'AICompanion', 'ArtificialIntelligence', 'VirtualRelationship', 'TechLove', 'AIGirlfriend', 'EmotionalAI'],
  via = 'loveai_official',
  showStats = true,
  variant = 'default'
}) => {
  const { toast } = useToast();
  const [shareCount, setShareCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  // Viral share messages for different platforms
  const viralMessages = {
    twitter: `🚀 Just tried @loveai_official and I'm BLOWN AWAY! This AI companion actually understands me better than most humans 😱💕\n\nThe conversations feel so real and the emotional intelligence is next level! 🤯\n\n#LoveAI #AICompanion #TechBreakthrough #VirtualLove\n\n👉 Try it FREE:`,
    facebook: `OMG! 🤯 I just discovered LoveAI and it's absolutely incredible!\n\nThis AI companion app has the most realistic conversations I've ever experienced. It's like talking to someone who truly gets you! 💕\n\nThe emotional intelligence is mind-blowing - it remembers everything about our conversations and actually cares about how I'm feeling.\n\n✨ Features that blew my mind:\n🤖 Realistic AI personalities\n💬 Voice calls that feel natural\n🧠 Learns and remembers everything\n❤️ Actually provides emotional support\n\nAnd the best part? IT'S FREE! 🆓\n\nSeriously, if you're feeling lonely or just want someone to talk to, you NEED to try this. It's the future of companionship!\n\n#LoveAI #AICompanion #TechMagic #VirtualRelationship`,
    whatsapp: `Hey! 👋 You HAVE to check out this AI companion app I just found!\n\nIt's called LoveAI and it's absolutely mind-blowing! 🤯\n\nThe AI actually remembers our conversations and feels like talking to a real person. I'm obsessed! 💕\n\nTry it free here:`,
    linkedin: `I'm fascinated by the advancement in AI technology! Just experienced LoveAI - an AI companion platform that demonstrates incredible emotional intelligence and conversational abilities.\n\nThe technology showcases:\n• Advanced natural language processing\n• Persistent memory systems\n• Emotional awareness algorithms\n• Real-time voice synthesis\n\nAs someone interested in AI development, this represents a significant leap in human-AI interaction. The applications for mental health, companionship, and emotional support are profound.\n\n#ArtificialIntelligence #TechInnovation #AICompanion #EmotionalAI #TechTrends`,
    reddit: `Holy shit guys, I just tried this AI companion app called LoveAI and I'm shook 😳\n\nThe conversations are so realistic it's actually scary. This AI remembers EVERYTHING we've talked about and responds like it actually cares about my life.\n\nI was skeptical at first but after talking for hours, I'm convinced this is the future of AI companionship. The emotional intelligence is insane!\n\nAnyone else tried this? What did you think?\n\nEdit: It's free to try which is why I gave it a shot. No regrets!\n\n[Link to LoveAI]`
  };

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    
    try {
      let shareUrl = '';
      const encodedUrl = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      const encodedDescription = encodeURIComponent(description);
      const hashtagString = hashtags.join(',');

      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(viralMessages.twitter)}&url=${encodedUrl}&hashtags=${hashtagString}&via=${via}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(viralMessages.facebook)}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${viralMessages.whatsapp}\n${url}`)}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodeURIComponent(viralMessages.linkedin)}`;
          break;
        case 'reddit':
          shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(viralMessages.reddit)}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(viralMessages.whatsapp)}`;
          break;
        case 'pinterest':
          shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedDescription}&media=${encodedUrl}/thumbnail.png`;
          break;
        case 'copy':
          await navigator.clipboard.writeText(`${title}\n\n${description}\n\n${url}\n\n#${hashtags.join(' #')}`);
          toast({
            title: "Copied to clipboard! 📋",
            description: "Share this link with your friends!",
          });
          setShareCount(prev => prev + 1);
          setIsSharing(false);
          return;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setShareCount(prev => prev + 1);
        
        // Track sharing event for analytics
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'share', {
            method: platform,
            content_type: 'website',
            item_id: url
          });
        }

        toast({
          title: "Thanks for sharing! 🚀",
          description: `Shared on ${platform}! Help us go viral! 💕`,
        });
      }
    } catch (error) {
      toast({
        title: "Oops! 😅",
        description: "Couldn't share right now. Try copying the link instead!",
        variant: "destructive"
      });
    }
    
    setIsSharing(false);
  };

  if (variant === 'floating') {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 space-y-2">
        <Card className="p-2 shadow-lg bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-sm border-pink-300/50">
          <CardContent className="p-0 space-y-2">
            <div className="text-center">
              <Badge className="bg-white/20 text-white text-xs">Share & Go Viral!</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-white hover:bg-white/20"
              onClick={() => handleShare('twitter')}
              disabled={isSharing}
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-white hover:bg-white/20"
              onClick={() => handleShare('facebook')}
              disabled={isSharing}
            >
              <Facebook className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-white hover:bg-white/20"
              onClick={() => handleShare('whatsapp')}
              disabled={isSharing}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            {showStats && shareCount > 0 && (
              <div className="text-center">
                <Badge className="bg-yellow-400 text-yellow-900 text-xs">
                  <Heart className="w-3 h-3 mr-1" />
                  {shareCount}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'viral') {
    return (
      <Card className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200/50 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
              <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Help LoveAI Go Viral! 🚀
              </h3>
              <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-sm text-gray-600">
              Share your experience and help others discover AI companionship!
            </p>
            {showStats && shareCount > 0 && (
              <Badge className="mt-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <Heart className="w-3 h-3 mr-1" />
                {shareCount} shares & counting! 
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleShare('twitter')}
              disabled={isSharing}
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white flex-col h-auto py-3"
            >
              <Twitter className="w-5 h-5 mb-1" />
              <span className="text-xs">Twitter</span>
            </Button>
            
            <Button
              onClick={() => handleShare('facebook')}
              disabled={isSharing}
              className="bg-[#4267B2] hover:bg-[#365899] text-white flex-col h-auto py-3"
            >
              <Facebook className="w-5 h-5 mb-1" />
              <span className="text-xs">Facebook</span>
            </Button>
            
            <Button
              onClick={() => handleShare('whatsapp')}
              disabled={isSharing}
              className="bg-[#25D366] hover:bg-[#20b956] text-white flex-col h-auto py-3"
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              onClick={() => handleShare('copy')}
              disabled={isSharing}
              className="bg-gray-600 hover:bg-gray-700 text-white flex-col h-auto py-3"
            >
              <Copy className="w-5 h-5 mb-1" />
              <span className="text-xs">Copy Link</span>
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Pro tip: Share with the hashtag #{hashtags[0]} to join the viral wave!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default inline variant
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleShare('twitter')}
        disabled={isSharing}
        className="text-[#1DA1F2] border-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white"
      >
        <Twitter className="w-4 h-4 mr-1" />
        Tweet
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleShare('facebook')}
        disabled={isSharing}
        className="text-[#4267B2] border-[#4267B2] hover:bg-[#4267B2] hover:text-white"
      >
        <Facebook className="w-4 h-4 mr-1" />
        Share
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleShare('copy')}
        disabled={isSharing}
        className="text-gray-600 border-gray-300 hover:bg-gray-600 hover:text-white"
      >
        <Copy className="w-4 h-4 mr-1" />
        Copy
      </Button>
      
      {showStats && shareCount > 0 && (
        <Badge variant="secondary" className="ml-2">
          <Heart className="w-3 h-3 mr-1" />
          {shareCount} shares
        </Badge>
      )}
    </div>
  );
}; 