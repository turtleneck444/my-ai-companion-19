import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const emojiCategories = {
  "Love & Hearts": ["💕", "❤️", "💖", "💗", "💘", "💝", "💞", "💟", "💌", "💋", "💍", "💎", "🌹", "🥀", "🌺", "🌸", "🌻", "🌷", "🌼", "🌿"],
  "Faces & Emotions": ["😊", "😍", "🥰", "😘", "😚", "😙", "😗", "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤫", "🤔", "🤨", "😐", "😑", "😶"],
  "Happy & Excited": ["😄", "😃", "😀", "😁", "🤣", "😂", "😆", "😅", "🤩", "🥳", "🎉", "🎊", "✨", "🌟", "💫", "⭐", "🔥", "💯", "🎯", "🏆"],
  "Cute & Playful": ["😇", "��", "😌", "😉", "😏", "😎", "🤓", "🧐", "🤤", "😴", "🤤", "😪", "😵", "🤯", "🤠", "🥴", "😵‍💫", "🤡", "👻", "💀"],
  "Hands & Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏"],
  "Activities": ["💃", "🕺", "👯", "👯‍♀️", "👯‍♂️", "🧘", "🧘‍♀️", "🧘‍♂️", "🏃", "🏃‍♀️", "🏃‍♂️", "🚶", "🚶‍♀️", "🚶‍♂️", "💪", "🤸", "🤸‍♀️", "🤸‍♂️", "🏋️", "🏋️‍♀️"],
  "Food & Drinks": ["🍕", "🍔", "🌭", "🥪", "🌮", "🌯", "🥙", "🧆", "🥚", "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟"],
  "Nature & Weather": ["🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "⭐", "🌟", "💫", "✨", "☄️", "🌠"],
  "Objects & Symbols": ["💎", "🔮", "🎁", "🎀", "🎂", "🍰", "🧁", "🍭", "🍬", "🍫", "🍩", "🍪", "🥧", "🍯", "🍯", "🍯", "🍯", "🍯", "��", "🍯"]
};

export const EmojiPicker = ({ onEmojiSelect, onClose }: EmojiPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Love & Hearts");

  const filteredEmojis = emojiCategories[selectedCategory as keyof typeof emojiCategories].filter(emoji =>
    emoji.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Card className="absolute bottom-full left-0 mb-2 w-80 max-h-96 overflow-hidden bg-card/95 backdrop-blur-xl border shadow-xl z-50">
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        
        <div className="flex gap-1 overflow-x-auto pb-2">
          {Object.keys(emojiCategories).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs whitespace-nowrap h-7 px-2"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 p-0 text-lg hover:bg-primary/20 transition-colors"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="p-2 border-t bg-muted/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Click emoji to add to message</span>
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
