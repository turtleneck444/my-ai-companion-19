import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Gamepad2, 
  Trophy, 
  Heart, 
  Brain, 
  Zap, 
  Target,
  MessageSquare,
  Sparkles,
  Crown,
  Star,
  ArrowLeft,
  Shuffle,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InteractiveGamesProps {
  characterName: string;
  onBack: () => void;
  onSendMessage: (message: string) => void;
}

type GameType = 'none' | 'chess' | '20questions' | 'wordchain' | 'truthordare' | 'riddles' | 'roleplay';

// Chess piece representation
const chessPieces = {
  'white': { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  'black': { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

// Game data
const riddleQuestions = [
  { question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", answer: "map" },
  { question: "What has keys but no locks, space but no room, and you can enter but not go inside?", answer: "keyboard" },
  { question: "The more you take, the more you leave behind. What am I?", answer: "footsteps" },
  { question: "What gets wet while drying?", answer: "towel" },
  { question: "I'm tall when I'm young, and short when I'm old. What am I?", answer: "candle" }
];

const truthQuestions = [
  "What's your biggest dream?",
  "What's your favorite memory?",
  "If you could have dinner with anyone, who would it be?",
  "What's something you've never told anyone?",
  "What's your biggest fear?"
];

const dareQuestions = [
  "Sing your favorite song!",
  "Do a silly dance!",
  "Tell me a funny story!",
  "Give me your best compliment!",
  "Share your most embarrassing moment!"
];

export const InteractiveGames = ({ characterName, onBack, onSendMessage }: InteractiveGamesProps) => {
  const [currentGame, setCurrentGame] = useState<GameType>('none');
  const [gameState, setGameState] = useState<any>({});
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const { toast } = useToast();

  // Game selection screen
  const renderGameSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Games with {characterName}</h2>
        </div>
        <p className="text-muted-foreground">Choose a fun game to play together!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" 
              onClick={() => startGame('chess')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              <CardTitle className="text-lg">Chess</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Strategic chess game with your AI companion
            </p>
            <Badge variant="secondary">Strategy • Challenging</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => startGame('20questions')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-500" />
              <CardTitle className="text-lg">20 Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Guess what {characterName} is thinking of!
            </p>
            <Badge variant="secondary">Mind Games • Fun</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => startGame('wordchain')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-500" />
              <CardTitle className="text-lg">Word Chain</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Build words together in a creative chain
            </p>
            <Badge variant="secondary">Creative • Collaborative</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => startGame('truthordare')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              <CardTitle className="text-lg">Truth or Dare</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Get to know each other better
            </p>
            <Badge variant="secondary">Intimate • Personal</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => startGame('riddles')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-500" />
              <CardTitle className="text-lg">Riddles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Solve challenging riddles together
            </p>
            <Badge variant="secondary">Puzzle • Clever</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => startGame('roleplay')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-500" />
              <CardTitle className="text-lg">Role Play</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Create stories and scenarios together
            </p>
            <Badge variant="secondary">Creative • Imaginative</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Initialize game
  const startGame = (gameType: GameType) => {
    setCurrentGame(gameType);
    
    switch (gameType) {
      case 'chess':
        setGameState({
          board: initializeChessBoard(),
          currentPlayer: 'white',
          moves: []
        });
        onSendMessage(`🎮 Let's play chess! I'll be white and you'll be black. Your move! ♟️`);
        break;
        
      case '20questions':
        setGameState({
          questionsLeft: 20,
          guessedCorrectly: false,
          secretWord: 'unicorn', // AI would think of this
          hints: []
        });
        onSendMessage(`🧠 I'm thinking of something magical... You have 20 questions to guess what it is! Ask me yes/no questions. ✨`);
        break;
        
      case 'wordchain':
        setGameState({
          words: ['love'],
          currentPlayer: 'user',
          lastLetter: 'e'
        });
        onSendMessage(`📝 Let's play word chain! I'll start with "LOVE" - now you need a word that starts with 'E'! 💕`);
        break;
        
      case 'truthordare':
        setGameState({
          currentTurn: 'user',
          round: 1
        });
        onSendMessage(`💕 Truth or Dare time! I'll go first - Truth or Dare? Choose wisely! 😘`);
        break;
        
      case 'riddles':
        const randomRiddle = riddleQuestions[Math.floor(Math.random() * riddleQuestions.length)];
        setGameState({
          currentRiddle: randomRiddle,
          attempts: 0,
          solved: false
        });
        onSendMessage(`🧩 Here's a riddle for you: "${randomRiddle.question}" What's your answer? 🤔`);
        break;
        
      case 'roleplay':
        setGameState({
          scenario: 'cafe',
          character: 'stranger'
        });
        onSendMessage(`🎭 Let's roleplay! I'm a mysterious stranger at a cozy café. You just walked in... What do you do? ☕✨`);
        break;
    }
    
    toast({
      title: `🎮 Game Started!`,
      description: `Playing ${gameType} with ${characterName}`,
    });
  };

  const initializeChessBoard = () => {
    // Simple 8x8 board representation
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up initial pieces (simplified)
    const pieces = ['♜','♞','♝','♛','♚','♝','♞','♜'];
    const pawns = '♟'.repeat(8).split('');
    
    // Black pieces
    board[0] = pieces;
    board[1] = pawns;
    
    // White pieces  
    board[6] = '♙'.repeat(8).split('');
    board[7] = ['♖','♘','♗','♕','♔','♗','♘','♖'];
    
    return board;
  };

  const renderGame = () => {
    switch (currentGame) {
      case 'chess':
        return renderChessGame();
      case '20questions':
        return render20QuestionsGame();
      case 'wordchain':
        return renderWordChainGame();
      case 'truthordare':
        return renderTruthOrDareGame();
      case 'riddles':
        return renderRiddlesGame();
      case 'roleplay':
        return renderRolePlayGame();
      default:
        return renderGameSelection();
    }
  };

  const renderChessGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          <h3 className="text-xl font-bold">Chess with {characterName}</h3>
        </div>
        <Badge variant="outline">
          Turn: {gameState.currentPlayer === 'white' ? 'You' : characterName}
        </Badge>
      </div>

      {/* Chess board */}
      <Card className="p-4">
        <div className="grid grid-cols-8 gap-1 aspect-square max-w-md mx-auto">
          {gameState.board?.map((row: any[], rowIndex: number) =>
            row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`aspect-square flex items-center justify-center text-2xl border cursor-pointer hover:bg-primary/10 transition-colors ${
                  (rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-200'
                }`}
                onClick={() => toast({ title: "🎯", description: "AI will make the best move!" })}
              >
                {piece}
              </div>
            ))
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Click any piece to let {characterName} make the perfect move! ♟️
        </p>
      </Card>
    </div>
  );

  const render20QuestionsGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold">20 Questions</h3>
        </div>
        <Badge variant="outline">
          {gameState.questionsLeft} questions left
        </Badge>
      </div>

      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🤔</div>
          <p className="text-lg">I'm thinking of something magical...</p>
          <Progress value={(20 - gameState.questionsLeft) * 5} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Ask me yes/no questions to guess what I'm thinking of!
          </p>
          <Button 
            onClick={() => onSendMessage("Is it bigger than a house?")}
            className="w-full"
          >
            Ask a Question 💭
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderWordChainGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-bold">Word Chain</h3>
        </div>
        <Badge variant="outline">
          Next: {gameState.lastLetter?.toUpperCase()}
        </Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {gameState.words?.map((word: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-lg p-2">
                {word.toUpperCase()}
              </Badge>
            ))}
          </div>
          <Separator />
          <div className="text-center">
            <p className="mb-4">Your turn! Find a word starting with <strong>"{gameState.lastLetter?.toUpperCase()}"</strong></p>
            <Input 
              placeholder={`Enter a word starting with "${gameState.lastLetter?.toUpperCase()}"`}
              className="max-w-xs mx-auto"
            />
            <Button className="mt-2 w-full max-w-xs">
              Submit Word 📝
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTruthOrDareGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-bold">Truth or Dare</h3>
        </div>
        <Badge variant="outline">Round {gameState.round}</Badge>
      </div>

      <Card className="p-6">
        <div className="text-center space-y-6">
          <div className="text-6xl">💕</div>
          <p className="text-lg">Your turn to choose!</p>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 text-lg hover:bg-blue-500/10"
              onClick={() => {
                const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
                onSendMessage(`Truth: ${question}`);
              }}
            >
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                Truth
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 text-lg hover:bg-red-500/10"
              onClick={() => {
                const dare = dareQuestions[Math.floor(Math.random() * dareQuestions.length)];
                onSendMessage(`Dare: ${dare}`);
              }}
            >
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-red-500" />
                Dare
              </div>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderRiddlesGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold">Riddles</h3>
        </div>
        <Badge variant="outline">Attempt {gameState.attempts + 1}</Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🧩</div>
            <p className="text-lg font-medium mb-4">
              "{gameState.currentRiddle?.question}"
            </p>
          </div>
          <Input 
            placeholder="Your answer..."
            className="text-center"
          />
          <Button className="w-full">
            Submit Answer 🤔
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              const newRiddle = riddleQuestions[Math.floor(Math.random() * riddleQuestions.length)];
              setGameState(prev => ({ ...prev, currentRiddle: newRiddle, attempts: 0 }));
            }}
          >
            <Shuffle className="w-4 h-4 mr-2" />
            New Riddle
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderRolePlayGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-pink-500" />
          <h3 className="text-xl font-bold">Role Play</h3>
        </div>
        <Badge variant="outline">Café Scene</Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">☕</div>
            <p className="text-lg font-medium mb-4">
              Scene: Cozy neighborhood café
            </p>
            <p className="text-muted-foreground mb-4">
              I'm sitting alone at a corner table, reading a book. You just walked in...
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              onClick={() => onSendMessage("I walk up and ask what book you're reading 📚")}
            >
              Ask about the book
            </Button>
            <Button 
              variant="outline"
              onClick={() => onSendMessage("I order a coffee and sit at a nearby table ☕")}
            >
              Sit nearby quietly
            </Button>
            <Button 
              variant="outline"
              onClick={() => onSendMessage("I accidentally bump into your table 😅")}
            >
              Accidentally bump into table
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-xl border-b shadow-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => currentGame === 'none' ? onBack() : setCurrentGame('none')}
            className="hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold">
              {currentGame === 'none' ? 'Games' : `Playing ${currentGame}`}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{score}</span>
          </div>
          <Badge variant="outline">Level {level}</Badge>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderGame()}
      </div>
    </div>
  );
}; 