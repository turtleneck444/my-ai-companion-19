import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Smile, Heart, Gamepad2, Zap, Car, Pizza, Music, Flag } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

// Enhanced emoji categories with more variety
const emojiCategories = {
  recent: {
    icon: Clock,
    name: "Recent",
    emojis: [] as string[]
  },
  people: {
    icon: Smile,
    name: "People",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇",
      "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑",
      "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
      "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵",
      "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️",
      "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱",
      "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿"
    ]
  },
  love: {
    icon: Heart,
    name: "Love",
    emojis: [
      "💕", "💖", "💗", "💘", "💙", "💚", "💛", "🧡", "💜", "🖤", "🤍", "🤎", "💝",
      "💟", "❣️", "💔", "❤️‍🔥", "❤️‍🩹", "❤️", "🩷", "💋", "👄", "💌", "💐", "🌹",
      "🌷", "🌺", "🌸", "🌻", "🥀", "💒", "👰", "🤵", "💍", "💎", "🎀", "🎁", "🍫",
      "🍰", "🧸", "💏", "💑", "👫", "👬", "👭", "🤝", "🫶", "🤗", "🫂"
    ]
  },
  fun: {
    icon: Gamepad2,
    name: "Fun",
    emojis: [
      "🎮", "🕹️", "🎯", "🎲", "🃏", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧", "🎵", "🎶",
      "🎸", "🥁", "🎺", "🎷", "🪗", "🎹", "🎻", "🪕", "🥳", "🎉", "🎊", "🎈", "🎀",
      "🎁", "🎃", "🎄", "🎆", "🎇", "🧨", "✨", "🎟️", "🎫", "🏆", "🥇", "🥈", "🥉",
      "🏅", "🎖️", "🏵️", "🎗️", "🎀", "🎪", "🤹", "🎨", "🖌️", "🖍️", "🖊️", "✏️"
    ]
  },
  gestures: {
    icon: Zap,
    name: "Gestures",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏",
      "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶",
      "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋"
    ]
  },
  objects: {
    icon: Car,
    name: "Objects",
    emojis: [
      "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💾", "💿", "📀", "📼", "📷", "📸",
      "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️",
      "🧭", "⏰", "⏲️", "⏱️", "⏳", "⌛", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔",
      "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "💰", "💳", "💎", "⚖️", "🧰", "🔧"
    ]
  },
  food: {
    icon: Pizza,
    name: "Food",
    emojis: [
      "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍",
      "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒",
      "🧄", "🧅", "🥔", "🍠", "🥐", "🥖", "🍞", "🥨", "🥯", "🧀", "🥚", "🍳", "🧈",
      "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🫓", "🥙",
      "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱"
    ]
  },
  travel: {
    icon: Car,
    name: "Travel",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛",
      "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘",
      "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆",
      "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶",
      "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "⛽", "🚧", "🚥", "🚦", "🗺️", "🗿"
    ]
  },
  nature: {
    icon: Flag,
    name: "Nature",
    emojis: [
      "🌍", "🌎", "🌏", "🌐", "🗺️", "🗾", "🧭", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️",
      "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱", "🪨", "🪵", "🛖", "🏘️", "🏚️",
      "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭",
      "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋", "⛲", "⛱️",
      "🌸", "🌺", "🌻", "🌷", "🌹", "🥀", "🌲", "🌳", "🌴", "🌵", "🌶️", "🌽", "🌾"
    ]
  }
};

export const EmojiPicker = ({ onEmojiSelect, onClose }: EmojiPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-emojis');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentEmojis(parsed.slice(0, 24)); // Keep only 24 most recent
        emojiCategories.recent.emojis = parsed.slice(0, 24);
      } catch (error) {
        console.warn('Failed to parse recent emojis:', error);
      }
    }
  }, []);

  // Auto-focus search on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current && window.innerWidth > 768) {
        searchInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const addToRecent = (emoji: string) => {
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 24);
    setRecentEmojis(newRecent);
    emojiCategories.recent.emojis = newRecent;
    localStorage.setItem('recent-emojis', JSON.stringify(newRecent));
  };

  const handleEmojiClick = (emoji: string) => {
    addToRecent(emoji);
    onEmojiSelect(emoji);
    
    // Add haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const filteredEmojis = searchTerm
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => {
          // Simple emoji search - could be enhanced with names
          return true; // For now, show all emojis when searching
        })
    : emojiCategories[activeCategory as keyof typeof emojiCategories]?.emojis || [];

  const categoryKeys = Object.keys(emojiCategories).filter(key => 
    key === 'recent' ? recentEmojis.length > 0 : true
  );

  return (
    <Card className="w-full max-w-sm mx-auto bg-background/95 backdrop-blur-xl border shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
      {/* Header with Search */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Search emojis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>

        {/* Category Tabs */}
        {!searchTerm && (
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {categoryKeys.map((categoryKey) => {
              const category = emojiCategories[categoryKey as keyof typeof emojiCategories];
              const Icon = category.icon;
              return (
                <Button
                  key={categoryKey}
                  variant={activeCategory === categoryKey ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(categoryKey)}
                  className={`flex-shrink-0 transition-all duration-200 ${
                    activeCategory === categoryKey 
                      ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                      : 'hover:bg-primary/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Emoji Grid */}
      <ScrollArea className="h-64 p-2">
        <div className="grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, index) => (
            <Button
              key={`${emoji}-${index}`}
              variant="ghost"
              size="sm"
              onClick={() => handleEmojiClick(emoji)}
              className="h-10 w-10 p-0 text-lg hover:bg-primary/10 hover:scale-110 transition-all duration-150 active:scale-95"
              aria-label={`Emoji ${emoji}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
        
        {filteredEmojis.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Smile className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchTerm ? 'No emojis found' : 'No recent emojis yet'}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Quick Access Emojis */}
      <div className="p-3 border-t bg-gradient-to-r from-accent/5 to-primary/5">
        <div className="flex justify-center gap-2">
          {['❤️', '😘', '😍', '🥰', '😊', '😂', '🔥', '✨'].map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => handleEmojiClick(emoji)}
              className="h-8 w-8 p-0 text-sm hover:bg-primary/10 hover:scale-110 transition-all duration-150 active:scale-95"
              aria-label={`Quick emoji ${emoji}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};
