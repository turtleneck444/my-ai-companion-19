# Interactive Games System

## Overview
The Interactive Games System provides a comprehensive suite of engaging games that users can play with their AI companions. All games feature memory persistence, scoring systems, achievements, and seamless integration with the chat interface.

## Features

### 🎮 Available Games

1. **Chess** - Strategic board game with AI opponent
2. **20 Questions** - Mind game where users guess what the AI is thinking
3. **Word Chain** - Collaborative word-building game
4. **Truth or Dare** - Interactive question and challenge game
5. **Riddles** - Puzzle-solving with scoring system
6. **Role Play** - Creative storytelling scenarios

### 🧠 Memory Persistence
- **Local Storage**: Game states are saved locally for immediate persistence
- **Supabase Integration**: Cloud storage for cross-device synchronization
- **Auto-save**: Game states are automatically saved on every action
- **Resume Capability**: Games can be resumed exactly where they left off

### 🏆 Scoring & Achievements
- **Dynamic Scoring**: Points awarded for various game actions
- **Level System**: Players level up based on total score
- **Achievements**: Unlockable rewards for specific accomplishments
- **Progress Tracking**: Comprehensive statistics and progress monitoring

### 💬 Chat Integration
- **Seamless Communication**: All game interactions flow through the chat system
- **AI Responses**: Contextual responses based on game state
- **Real-time Updates**: Immediate feedback and state updates

## Technical Architecture

### Core Components

#### `InteractiveGames.tsx`
Main component that renders all games and manages game state.

#### `game-memory.ts`
Service class for handling game state persistence and memory management.

#### `useGameMemory.ts`
React hook for easy integration of game memory functionality.

### Database Schema

```sql
CREATE TABLE game_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Game State Structure

```typescript
interface GameState {
  gameType: string;
  state: any;
  score: number;
  level: number;
  lastPlayed: string;
  achievements: string[];
  progress: Record<string, any>;
}
```

## Game Details

### Chess Game
- **Features**: Interactive board, move validation, AI responses
- **Scoring**: 10 points per move
- **Memory**: Board state, move history, current player
- **AI**: Simulated opponent moves with contextual responses

### 20 Questions Game
- **Features**: Question handling, AI responses, progress tracking
- **Scoring**: 5 points per question asked
- **Memory**: Questions asked, secret word, attempts remaining
- **AI**: Dynamic responses based on question content

### Word Chain Game
- **Features**: Word validation, AI word generation, streak tracking
- **Scoring**: 10 points per valid word
- **Memory**: Word chain, used words, current letter
- **AI**: Intelligent word selection based on last letter

### Truth or Dare Game
- **Features**: Turn management, question/dare selection, scoring
- **Scoring**: 15 points for truth, 20 points for dare
- **Memory**: Current turn, round number, scores
- **AI**: Contextual responses and own truth/dare selections

### Riddles Game
- **Features**: Answer validation, scoring system, achievement unlocking
- **Scoring**: 50 points per correct answer
- **Memory**: Current riddle, attempts, total score
- **AI**: Hints and encouragement based on attempts

### Role Play Game
- **Features**: Scenario selection, choice handling, story building
- **Scoring**: 25 points per choice made
- **Memory**: Current scenario, story progress, choices made
- **AI**: Dynamic responses based on user choices

## Usage

### Basic Integration

```tsx
import { InteractiveGames } from '@/components/InteractiveGames';

<InteractiveGames
  characterName="Your AI Companion"
  onBack={() => setShowGames(false)}
  onSendMessage={(message) => handleChatMessage(message)}
/>
```

### Using Game Memory Hook

```tsx
import { useGameMemory } from '@/hooks/useGameMemory';

const { saveGameState, loadGameState, addAchievement } = useGameMemory();

// Save game state
await saveGameState('chess', gameState, score, achievements);

// Load game state
const savedState = loadGameState('chess');

// Add achievement
addAchievement('chess', 'First Win');
```

## Memory Persistence

### Local Storage
Games are automatically saved to localStorage with keys like:
- `gameMemory_guest` (for non-authenticated users)
- `gameMemory_{userId}` (for authenticated users)

### Supabase Sync
For authenticated users, game states are synced to Supabase:
- Automatic sync on state changes
- Cross-device synchronization
- Backup and recovery

### Data Structure
```json
{
  "userId": "user-id",
  "games": {
    "chess": {
      "gameType": "chess",
      "state": { /* game state */ },
      "score": 100,
      "level": 2,
      "lastPlayed": "2024-01-01T00:00:00.000Z",
      "achievements": ["First Move", "Strategic Thinker"],
      "progress": { /* progress data */ }
    }
  },
  "totalScore": 500,
  "totalGamesPlayed": 10,
  "favoriteGame": "chess",
  "lastActive": "2024-01-01T00:00:00.000Z"
}
```

## Testing

### Test Suite
A comprehensive test suite is available in `GameTestSuite.tsx`:
- Individual game testing
- Memory persistence testing
- Integration testing
- Performance testing

### Manual Testing
1. Start a game
2. Make some moves/actions
3. Navigate away and back
4. Verify state is preserved
5. Check scoring and achievements

## Performance Considerations

### Optimization
- Lazy loading of game components
- Efficient state management
- Minimal re-renders
- Optimized memory usage

### Caching
- Game states cached in memory
- Local storage for immediate access
- Supabase for long-term storage

## Future Enhancements

### Planned Features
- Multiplayer games
- Tournament mode
- Custom game creation
- Advanced AI opponents
- Social features
- Leaderboards

### Technical Improvements
- WebSocket integration for real-time multiplayer
- Advanced AI algorithms
- Performance optimizations
- Enhanced mobile support

## Troubleshooting

### Common Issues
1. **Game state not saving**: Check localStorage permissions
2. **Supabase sync failing**: Verify authentication and network
3. **Games not loading**: Check component imports and dependencies

### Debug Mode
Enable debug logging by setting `localStorage.setItem('debug-games', 'true')`

## Contributing

### Adding New Games
1. Add game type to `GameType` enum
2. Implement game logic in `InteractiveGames.tsx`
3. Add memory persistence support
4. Update test suite
5. Add documentation

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error handling
- Add comprehensive comments

## License
This games system is part of the AI Companion application and follows the same licensing terms.
