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
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "��", "🙂", "🙃", "😉", "😊", "😇",
      "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑",
      "🤗", "🤭", "🤫", "🤔", "��", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
      "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵",
      "🥶", "��", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️",
      "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "��",
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
      "🎸", "��", "🎺", "🎷", "🪗", "🎹", "🎻", "🪕", "🥳", "🎉", "🎊", "🎈", "🎀",
      "🎁", "🎃", "🎄", "🎆", "🎇", "🧨", "✨", "🎟️", "🎫", "🏆", "🥇", "🥈", "��",
      "🏅", "🎖️", "🏵️", "🎗️", "🎀", "🎊", "🎉", "🎈", "🎁", "🎀", "🎊", "🎉", "🎈"
    ]
  },
  nature: {
    icon: Zap,
    name: "Nature",
    emojis: [
      "🌱", "🌿", "🍀", "🌾", "🌵", "��", "🌳", "🌴", "🌰", "🌰", "🌰", "🌰", "🌰",
      "🌸", "🌺", "🌻", "🌷", "🌹", "🥀", "🌼", "🌻", "🌺", "🌸", "🌷", "🌹", "🥀",
      "🌞", "🌝", "��", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔",
      "🌍", "🌎", "🌏", "🌐", "🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🌑"
    ]
  },
  food: {
    icon: Pizza,
    name: "Food",
    emojis: [
      "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
      "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄",
      "🧅", "��", "🍠", "🥐", "🥖", "🍞", "🥨", "🥯", "🧀", "🥚", "🍳", "🧈", "🥞",
      "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🌮", "🌯", "��"
    ]
  },
  travel: {
    icon: Car,
    name: "Travel",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "��", "🚛",
      "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🛼", "🛺", "🚁", "✈️", "🛩️", "🛫", "🛬",
      "🪂", "💺", "🚀", "🛸", "🚉", "🚊", "🚝", "🚞", "🚋", "🚃", "🚋", "🚞", "🚝",
      "🚄", "🚅", "��", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🪂", "💺"
    ]
  },
  music: {
    icon: Music,
    name: "Music",
    emojis: [
      "🎵", "🎶", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎤", "🎧", "📻",
      "🎚️", "🎛️", "🎙️", "📻", "🎧", "🎤", "🎻", "🪕", "🎸", "🎺", "🎷", "🥁", "🎹"
    ]
  },
  flags: {
    icon: Flag,
    name: "Flags",
    emojis: [
      "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇩🇪",
      "🇫🇷", "🇮��", "🇪🇸", "🇯🇵", "🇰🇷", "🇨🇳", "🇮🇳", "🇧🇷", "🇷🇺", "🇲🇽", "🇳🇱", "🇸🇪", "🇳🇴"
    ]
  }
};

// Popular emojis that show by default
const popularEmojis = [
  "😀", "😂", "🥰", "😍", "🤔", "😮", "😢", "😭", "🤣", "😊", "😘", "🥺", "😎", "��", "😉",
  "❤️", "💕", "💖", "💗", "💘", "💙", "��", "💛", "🧡", "💜", "🖤", "🤍", "🤎", "💝", "💟",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚",
  "🎉", "🎊", "🎈", "🎁", "🎀", "✨", "🌟", "💫", "⭐", "🔥", "💯", "💥", "⚡", "🌈", "☀️"
];

export const EmojiPicker = ({ onEmojiSelect, onClose }: EmojiPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent emojis from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recent-emojis');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentEmojis(parsed);
        // Update the recent category with loaded emojis
        emojiCategories.recent.emojis = parsed;
      } catch (error) {
        console.error('Error loading recent emojis:', error);
      }
    } else {
      // If no recent emojis, show popular ones by default
      emojiCategories.recent.emojis = popularEmojis;
      setRecentEmojis(popularEmojis);
    }
  }, []);

  // Focus search input when picker opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(newRecent);
    emojiCategories.recent.emojis = newRecent;
    
    // Save to localStorage
    localStorage.setItem('recent-emojis', JSON.stringify(newRecent));
  };

  const filteredEmojis = Object.entries(emojiCategories).reduce((acc, [key, category]) => {
    if (searchTerm) {
      const filtered = category.emojis.filter(emoji => 
        emoji.includes(searchTerm) || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[key] = { ...category, emojis: filtered };
      }
    } else {
      acc[key] = category;
    }
    return acc;
  }, {} as typeof emojiCategories);

  const renderEmojiGrid = (emojis: string[]) => (
    <div className="grid grid-cols-8 gap-1 p-2">
      {emojis.map((emoji, index) => (
        <Button
          key={`${emoji}-${index}`}
          variant="ghost"
          size="sm"
          onClick={() => handleEmojiClick(emoji)}
          className="h-8 w-8 p-0 text-lg hover:bg-primary/10 transition-colors"
        >
          {emoji}
        </Button>
      ))}
    </div>
  );

  return (
    <Card className="w-80 max-h-96 bg-background border shadow-lg">
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8">
            {Object.entries(emojiCategories).slice(0, 5).map(([key, category]) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger 
                  key={key} 
                  value={key} 
                  className="text-xs px-2 py-1 h-6"
                >
                  <IconComponent className="w-3 h-3" />
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <div className="mt-2">
            {Object.entries(filteredEmojis).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <ScrollArea className="h-48">
                  {category.emojis.length > 0 ? (
                    renderEmojiGrid(category.emojis)
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Smile className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No emojis found</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
      
      <div className="p-2 border-t bg-muted/20">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {searchTerm ? 'Search results' : `${emojiCategories[activeTab as keyof typeof emojiCategories]?.name} emojis`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 px-2 text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </Card>
  );
};
