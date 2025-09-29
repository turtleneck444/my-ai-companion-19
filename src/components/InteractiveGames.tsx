import { useState, useEffect, useCallback } from "react";
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
  CheckCircle,
  RotateCcw,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameMemory } from "@/hooks/useGameMemory";

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

// Enhanced game data
const riddleQuestions = [
  { question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", answer: "map" },
  { question: "What has keys but no locks, space but no room, and you can enter but not go inside?", answer: "keyboard" },
  { question: "The more you take, the more you leave behind. What am I?", answer: "footsteps" },
  { question: "What gets wet while drying?", answer: "towel" },
  { question: "I'm tall when I'm young, and short when I'm old. What am I?", answer: "candle" },
  { question: "What has a head, a tail, but no body?", answer: "coin" },
  { question: "What can you catch but not throw?", answer: "cold" },
  { question: "What has hands but can't clap?", answer: "clock" }
];

const truthQuestions = [
  "What's your biggest dream?",
  "What's your favorite memory?",
  "If you could have dinner with anyone, who would it be?",
  "What's something you've never told anyone?",
  "What's your biggest fear?",
  "What's the most embarrassing thing that's happened to you?",
  "If you could change one thing about yourself, what would it be?",
  "What's your biggest regret?"
];

const dareQuestions = [
  "Sing your favorite song!",
  "Do a silly dance!",
  "Tell me a funny story!",
  "Give me your best compliment!",
  "Share your most embarrassing moment!",
  "Do an impression of your favorite character!",
  "Tell me a secret about yourself!",
  "Do your best animal impression!"
];

const roleplayScenarios = [
  {
    name: "Café Encounter",
    description: "A cozy neighborhood café",
    setup: "I'm sitting alone at a corner table, reading a book. You just walked in...",
    options: [
      "Ask about the book",
      "Sit nearby quietly", 
      "Accidentally bump into table"
    ]
  },
  {
    name: "Space Adventure",
    description: "A spaceship on a mission",
    setup: "We're co-pilots on a spaceship exploring a new galaxy. The ship's computer just detected an anomaly...",
    options: [
      "Investigate the anomaly",
      "Check the ship's systems",
      "Contact mission control"
    ]
  },
  {
    name: "Mystery Detective",
    description: "A crime scene investigation",
    setup: "We're detectives investigating a mysterious case. The evidence points to something unexpected...",
    options: [
      "Examine the evidence",
      "Interview witnesses",
      "Follow a lead"
    ]
  }
];

export const InteractiveGames = ({ characterName, onBack, onSendMessage }: InteractiveGamesProps) => {
  const [currentGame, setCurrentGame] = useState<GameType>('none');
  const [gameState, setGameState] = useState<any>({});
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { saveGameState, loadGameState, addAchievement, getGameStats } = useGameMemory();

  // Load saved game state when switching games
  useEffect(() => {
    if (currentGame !== 'none') {
      const savedState = loadGameState(currentGame);
      if (savedState) {
        setGameState(savedState.state);
        setScore(savedState.score);
        setLevel(savedState.level);
        setAchievements(savedState.achievements);
      }
    }
  }, [currentGame, loadGameState]);

  // Save game state whenever it changes
  useEffect(() => {
    if (currentGame !== 'none' && gameState && Object.keys(gameState).length > 0) {
      saveGameState(currentGame, gameState, score, achievements);
    }
  }, [gameState, currentGame, score, achievements, saveGameState]);

  const addScore = (points: number, reason: string) => {
    setScore(prev => prev + points);
    toast({
      title: `+${points} points!`,
      description: reason,
    });
  };

  const addAchievementLocal = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements(prev => [...prev, achievement]);
      addAchievement(currentGame, achievement);
      toast({
        title: "🏆 Achievement Unlocked!",
        description: achievement,
      });
    }
  };

  // Game selection screen
  const renderGameSelection = () => {
    const stats = getGameStats();
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Games with {characterName}</h2>
          </div>
          <p className="text-muted-foreground">Choose a fun game to play together!</p>
          {stats.totalScore > 0 && (
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Total Score: {stats.totalScore}</span>
              <span>Games Played: {stats.totalGamesPlayed}</span>
            </div>
          )}
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
  };

  // Initialize game
  const startGame = (gameType: GameType) => {
    setCurrentGame(gameType);
    
    switch (gameType) {
      case 'chess':
        setGameState({
          board: initializeChessBoard(),
          currentPlayer: 'white',
          moves: [],
          selectedPiece: null,
          gameOver: false,
          winner: null
        });
        onSendMessage(`🎮 Let's play chess! I'll be white and you'll be black. Your move! ♟️`);
        break;
        
      case '20questions':
        const secretWords = ['unicorn', 'dragon', 'rainbow', 'moon', 'ocean', 'forest', 'mountain', 'star'];
        const secretWord = secretWords[Math.floor(Math.random() * secretWords.length)];
        setGameState({
          questionsLeft: 20,
          guessedCorrectly: false,
          secretWord: secretWord,
          hints: [],
          questions: [],
          gameOver: false
        });
        onSendMessage(`🧠 I'm thinking of something magical... You have 20 questions to guess what it is! Ask me yes/no questions. ✨`);
        break;
        
      case 'wordchain':
        setGameState({
          words: ['love'],
          currentPlayer: 'user',
          lastLetter: 'e',
          usedWords: new Set(['love']),
          gameOver: false,
          streak: 0
        });
        onSendMessage(`📝 Let's play word chain! I'll start with "LOVE" - now you need a word that starts with 'E'! 💕`);
        break;
        
      case 'truthordare':
        setGameState({
          currentTurn: 'user',
          round: 1,
          userScore: 0,
          aiScore: 0,
          gameOver: false
        });
        onSendMessage(`💕 Truth or Dare time! I'll go first - Truth or Dare? Choose wisely! 😘`);
        break;
        
      case 'riddles':
        const randomRiddle = riddleQuestions[Math.floor(Math.random() * riddleQuestions.length)];
        setGameState({
          currentRiddle: randomRiddle,
          attempts: 0,
          solved: false,
          score: 0,
          totalRiddles: 0,
          gameOver: false
        });
        onSendMessage(`🧩 Here's a riddle for you: "${randomRiddle.question}" What's your answer? 🤔`);
        break;
        
      case 'roleplay':
        const randomScenario = roleplayScenarios[Math.floor(Math.random() * roleplayScenarios.length)];
        setGameState({
          scenario: randomScenario,
          currentScene: 0,
          story: [],
          gameOver: false
        });
        onSendMessage(`🎭 Let's roleplay! ${randomScenario.setup} What do you do? ✨`);
        break;
    }
    
    toast({
      title: `🎮 Game Started!`,
      description: `Playing ${gameType} with ${characterName}`,
    });
  };

  const initializeChessBoard = () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up initial pieces
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

  // Continue with game renderers...
  const renderChessGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          <h3 className="text-xl font-bold">Chess with {characterName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Turn: {gameState.currentPlayer === 'white' ? 'You' : characterName}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGameState(prev => ({
                ...prev,
                board: initializeChessBoard(),
                currentPlayer: 'white',
                moves: [],
                selectedPiece: null,
                gameOver: false,
                winner: null
              }));
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </div>

      {gameState.gameOver ? (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold mb-2">Game Over!</h3>
          <p className="text-muted-foreground mb-4">
            {gameState.winner ? `${gameState.winner} wins!` : "It's a draw!"}
          </p>
          <Button onClick={() => startGame('chess')}>
            Play Again
          </Button>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="grid grid-cols-8 gap-1 aspect-square max-w-md mx-auto">
            {gameState.board?.map((row: any[], rowIndex: number) =>
              row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`aspect-square flex items-center justify-center text-2xl border cursor-pointer hover:bg-primary/10 transition-colors ${
                    (rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-200'
                  } ${gameState.selectedPiece?.row === rowIndex && gameState.selectedPiece?.col === colIndex ? 'bg-blue-300' : ''}`}
                  onClick={() => handleChessMove(rowIndex, colIndex)}
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
      )}
    </div>
  );

  const handleChessMove = (row: number, col: number) => {
    if (gameState.gameOver) return;
    
    // Simple AI move simulation
    const moves = gameState.moves || [];
    const newMove = { from: { row: 0, col: 0 }, to: { row, col }, piece: gameState.board[row][col] };
    
    setGameState(prev => ({
      ...prev,
      moves: [...moves, newMove],
      currentPlayer: prev.currentPlayer === 'white' ? 'black' : 'white'
    }));
    
    // Simulate AI response
    setTimeout(() => {
      onSendMessage(`♟️ I moved my piece! Your turn now! Think carefully... 🤔`);
      addScore(10, "Made a move!");
    }, 1000);
  };

  // Continue with other game renderers...
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

      {gameState.gameOver ? (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-4">
            {gameState.guessedCorrectly ? "🎉" : "😔"}
          </div>
          <h3 className="text-xl font-bold mb-2">
            {gameState.guessedCorrectly ? "Congratulations!" : "Game Over!"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {gameState.guessedCorrectly 
              ? `You guessed it! The answer was "${gameState.secretWord}"`
              : `The answer was "${gameState.secretWord}"`
            }
          </p>
          <Button onClick={() => startGame('20questions')}>
            Play Again
          </Button>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">🤔</div>
            <p className="text-lg">I'm thinking of something magical...</p>
            <Progress value={(20 - gameState.questionsLeft) * 5} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Ask me yes/no questions to guess what I'm thinking of!
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="Ask a question..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuestion(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Ask a question..."]') as HTMLInputElement;
                  if (input?.value) {
                    handleQuestion(input.value);
                    input.value = '';
                  }
                }}
                className="w-full"
              >
                Ask Question 💭
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const handleQuestion = (question: string) => {
    if (gameState.gameOver || gameState.questionsLeft <= 0) return;
    
    const questions = gameState.questions || [];
    const newQuestions = [...questions, question];
    
    // Simple AI response logic
    const responses = [
      "Yes! That's a good question!",
      "No, that's not it.",
      "Maybe... you're getting warmer!",
      "Hmm, that's not quite right.",
      "You're on the right track!",
      "Not exactly, but keep trying!"
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    setGameState(prev => ({
      ...prev,
      questions: newQuestions,
      questionsLeft: prev.questionsLeft - 1,
      gameOver: prev.questionsLeft <= 1
    }));
    
    onSendMessage(`🤔 ${response} You have ${gameState.questionsLeft - 1} questions left!`);
    addScore(5, "Asked a question!");
  };

  // Continue with remaining game renderers...
  const renderWordChainGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-bold">Word Chain</h3>
        </div>
        <Badge variant="outline">
          Streak: {gameState.streak || 0}
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
            <div className="space-y-2">
              <Input 
                placeholder={`Enter a word starting with "${gameState.lastLetter?.toUpperCase()}"`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleWordSubmit(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Enter a word"]') as HTMLInputElement;
                  if (input?.value) {
                    handleWordSubmit(input.value);
                    input.value = '';
                  }
                }}
                className="w-full"
              >
                Submit Word 📝
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const handleWordSubmit = (word: string) => {
    if (!word || gameState.usedWords?.has(word.toLowerCase())) {
      toast({
        title: "Invalid word!",
        description: "Please enter a valid word that hasn't been used.",
        variant: "destructive"
      });
      return;
    }
    
    if (!word.toLowerCase().startsWith(gameState.lastLetter.toLowerCase())) {
      toast({
        title: "Wrong letter!",
        description: `Word must start with "${gameState.lastLetter.toUpperCase()}"`,
        variant: "destructive"
      });
      return;
    }
    
    const newWords = [...(gameState.words || []), word];
    const newUsedWords = new Set(gameState.usedWords || []);
    newUsedWords.add(word.toLowerCase());
    
    const lastLetter = word[word.length - 1].toLowerCase();
    
    setGameState(prev => ({
      ...prev,
      words: newWords,
      lastLetter,
      usedWords: newUsedWords,
      streak: (prev.streak || 0) + 1
    }));
    
    addScore(10, "Added a word!");
    onSendMessage(`📝 Great word! "${word}" - now I need a word starting with "${lastLetter.toUpperCase()}"! 💕`);
    
    // AI response
    setTimeout(() => {
      const aiWords = {
        'a': ['apple', 'amazing', 'adventure'],
        'b': ['beautiful', 'bright', 'brave'],
        'c': ['creative', 'colorful', 'caring'],
        'd': ['dream', 'dance', 'delightful'],
        'e': ['energy', 'exciting', 'elegant'],
        'f': ['fantastic', 'friendly', 'fun'],
        'g': ['great', 'gorgeous', 'gentle'],
        'h': ['happy', 'hopeful', 'harmonious'],
        'i': ['incredible', 'inspiring', 'imaginative'],
        'j': ['joyful', 'jubilant', 'jovial'],
        'k': ['kind', 'knowledgeable', 'keen'],
        'l': ['lovely', 'luminous', 'lively'],
        'm': ['magical', 'magnificent', 'mysterious'],
        'n': ['nice', 'noble', 'nurturing'],
        'o': ['outstanding', 'optimistic', 'original'],
        'p': ['perfect', 'peaceful', 'playful'],
        'q': ['quiet', 'quick', 'quality'],
        'r': ['radiant', 'remarkable', 'romantic'],
        's': ['special', 'sparkling', 'sweet'],
        't': ['terrific', 'thoughtful', 'treasured'],
        'u': ['unique', 'uplifting', 'understanding'],
        'v': ['vibrant', 'valuable', 'victorious'],
        'w': ['wonderful', 'wise', 'warm'],
        'x': ['xenial', 'xeric', 'xenodochial'],
        'y': ['youthful', 'yearning', 'yummy'],
        'z': ['zealous', 'zesty', 'zen']
      };
      
      const possibleWords = aiWords[lastLetter] || ['amazing'];
      const aiWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
      
      const updatedWords = [...newWords, aiWord];
      const updatedUsedWords = new Set(newUsedWords);
      updatedUsedWords.add(aiWord.toLowerCase());
      const newLastLetter = aiWord[aiWord.length - 1].toLowerCase();
      
      setGameState(prev => ({
        ...prev,
        words: updatedWords,
        lastLetter: newLastLetter,
        usedWords: updatedUsedWords
      }));
      
      onSendMessage(`📝 My turn! "${aiWord}" - now you need a word starting with "${newLastLetter.toUpperCase()}"! ✨`);
    }, 1500);
  };

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
              onClick={() => handleTruthOrDare('truth')}
            >
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                Truth
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 text-lg hover:bg-red-500/10"
              onClick={() => handleTruthOrDare('dare')}
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

  const handleTruthOrDare = (choice: 'truth' | 'dare') => {
    if (choice === 'truth') {
      const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
      onSendMessage(`Truth: ${question}`);
      addScore(15, "Chose truth!");
    } else {
      const dare = dareQuestions[Math.floor(Math.random() * dareQuestions.length)];
      onSendMessage(`Dare: ${dare}`);
      addScore(20, "Chose dare!");
    }
    
    setGameState(prev => ({
      ...prev,
      round: prev.round + 1,
      currentTurn: prev.currentTurn === 'user' ? 'ai' : 'user'
    }));
    
    // AI turn
    setTimeout(() => {
      const aiChoice = Math.random() > 0.5 ? 'truth' : 'dare';
      if (aiChoice === 'truth') {
        const aiTruth = "I love spending time with you! What's your favorite thing about our conversations?";
        onSendMessage(`My truth: ${aiTruth}`);
      } else {
        const aiDare = "I dare you to tell me something that made you smile today! 😊";
        onSendMessage(`My dare: ${aiDare}`);
      }
    }, 2000);
  };

  const renderRiddlesGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold">Riddles</h3>
        </div>
        <Badge variant="outline">Score: {gameState.score || 0}</Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🧩</div>
            <p className="text-lg font-medium mb-4">
              "{gameState.currentRiddle?.question}"
            </p>
          </div>
          <div className="space-y-2">
            <Input 
              placeholder="Your answer..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRiddleAnswer(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button 
              onClick={() => {
                const input = document.querySelector('input[placeholder="Your answer..."]') as HTMLInputElement;
                if (input?.value) {
                  handleRiddleAnswer(input.value);
                  input.value = '';
                }
              }}
              className="w-full"
            >
              Submit Answer 🤔
            </Button>
          </div>
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

  const handleRiddleAnswer = (answer: string) => {
    if (!answer) return;
    
    const isCorrect = answer.toLowerCase().trim() === gameState.currentRiddle?.answer.toLowerCase();
    
    if (isCorrect) {
      addScore(50, "Solved the riddle!");
      addAchievementLocal("Riddle Master");
      onSendMessage(`🎉 Correct! The answer was "${gameState.currentRiddle.answer}"! Great job! ✨`);
      
      // New riddle
      setTimeout(() => {
        const newRiddle = riddleQuestions[Math.floor(Math.random() * riddleQuestions.length)];
        setGameState(prev => ({ 
          ...prev, 
          currentRiddle: newRiddle, 
          attempts: 0,
          score: (prev.score || 0) + 50,
          totalRiddles: (prev.totalRiddles || 0) + 1
        }));
        onSendMessage(`🧩 Here's another riddle: "${newRiddle.question}" What's your answer? 🤔`);
      }, 2000);
    } else {
      const attempts = (gameState.attempts || 0) + 1;
      setGameState(prev => ({ ...prev, attempts }));
      
      if (attempts >= 3) {
        onSendMessage(`😔 Not quite! The answer was "${gameState.currentRiddle.answer}". Let's try another one! 🧩`);
        const newRiddle = riddleQuestions[Math.floor(Math.random() * riddleQuestions.length)];
        setGameState(prev => ({ 
          ...prev, 
          currentRiddle: newRiddle, 
          attempts: 0 
        }));
      } else {
        onSendMessage(`🤔 Not quite right! Try again! (${3 - attempts} attempts left)`);
      }
    }
  };

  const renderRolePlayGame = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-pink-500" />
          <h3 className="text-xl font-bold">Role Play</h3>
        </div>
        <Badge variant="outline">{gameState.scenario?.name}</Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🎭</div>
            <p className="text-lg font-medium mb-4">
              {gameState.scenario?.description}
            </p>
            <p className="text-muted-foreground mb-4">
              {gameState.scenario?.setup}
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {gameState.scenario?.options.map((option: string, index: number) => (
              <Button 
                key={index}
                variant="outline" 
                onClick={() => handleRolePlayChoice(option)}
                className="justify-start"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const handleRolePlayChoice = (choice: string) => {
    addScore(25, "Made a roleplay choice!");
    onSendMessage(`🎭 ${choice}`);
    
    // AI response based on choice
    const responses = [
      "That's interesting! Tell me more about that...",
      "I love how you think! What happens next?",
      "That's a great choice! I'm curious to see where this leads...",
      "Fascinating! I didn't expect that response!",
      "You're so creative! Let's continue this story..."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    setTimeout(() => {
      onSendMessage(`🎭 ${response}`);
    }, 1500);
  };

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
          {achievements.length > 0 && (
            <Badge variant="secondary">
              <Trophy className="w-3 h-3 mr-1" />
              {achievements.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderGame()}
      </div>
    </div>
  );
};
