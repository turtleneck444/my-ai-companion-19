import { supabase } from './supabase';

export interface GameState {
  gameType: string;
  state: any;
  score: number;
  level: number;
  lastPlayed: string;
  achievements: string[];
  progress: Record<string, any>;
}

export interface GameMemory {
  userId: string;
  games: Record<string, GameState>;
  totalScore: number;
  totalGamesPlayed: number;
  favoriteGame: string;
  lastActive: string;
}

class GameMemoryService {
  private memoryKey = 'gameMemory';
  
  // Save game state to localStorage and Supabase
  async saveGameState(gameType: string, state: any, score: number = 0, achievements: string[] = []) {
    try {
      const userId = this.getCurrentUserId();
      const gameMemory = this.loadGameMemory();
      
      const gameState: GameState = {
        gameType,
        state,
        score,
        level: this.calculateLevel(score),
        lastPlayed: new Date().toISOString(),
        achievements,
        progress: state.progress || {}
      };
      
      // Update memory
      gameMemory.games[gameType] = gameState;
      gameMemory.totalScore += score;
      gameMemory.totalGamesPlayed += 1;
      gameMemory.lastActive = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem(`${this.memoryKey}_${userId}`, JSON.stringify(gameMemory));
      
      // Save to Supabase if available
      if (supabase) {
        await this.saveToSupabase(userId, gameMemory);
      }
      
      return gameState;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return null;
    }
  }
  
  // Load game state from localStorage
  loadGameState(gameType: string): GameState | null {
    try {
      const userId = this.getCurrentUserId();
      const gameMemory = this.loadGameMemory();
      return gameMemory.games[gameType] || null;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }
  
  // Load all game memory
  loadGameMemory(): GameMemory {
    try {
      const userId = this.getCurrentUserId();
      const stored = localStorage.getItem(`${this.memoryKey}_${userId}`);
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      return {
        userId,
        games: {},
        totalScore: 0,
        totalGamesPlayed: 0,
        favoriteGame: '',
        lastActive: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to load game memory:', error);
      return {
        userId: this.getCurrentUserId(),
        games: {},
        totalScore: 0,
        totalGamesPlayed: 0,
        favoriteGame: '',
        lastActive: new Date().toISOString()
      };
    }
  }
  
  // Save to Supabase
  private async saveToSupabase(userId: string, gameMemory: GameMemory) {
    try {
      const { error } = await supabase
        .from('game_memory')
        .upsert({
          user_id: userId,
          memory_data: gameMemory,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Supabase save error:', error);
      }
    } catch (error) {
      console.error('Failed to save to Supabase:', error);
    }
  }
  
  // Load from Supabase
  async loadFromSupabase(userId: string): Promise<GameMemory | null> {
    try {
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('game_memory')
        .select('memory_data')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Supabase load error:', error);
        return null;
      }
      
      return data?.memory_data || null;
    } catch (error) {
      console.error('Failed to load from Supabase:', error);
      return null;
    }
  }
  
  // Calculate level based on score
  private calculateLevel(score: number): number {
    return Math.floor(score / 100) + 1;
  }
  
  // Get current user ID
  private getCurrentUserId(): string {
    // Try to get from auth context or use guest ID
    try {
      const authData = localStorage.getItem('loveai-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id || 'guest';
      }
    } catch (error) {
      console.warn('Failed to parse auth data:', error);
    }
    return 'guest';
  }
  
  // Add achievement
  addAchievement(gameType: string, achievement: string) {
    const gameState = this.loadGameState(gameType);
    if (gameState && !gameState.achievements.includes(achievement)) {
      gameState.achievements.push(achievement);
      this.saveGameState(gameType, gameState.state, gameState.score, gameState.achievements);
    }
  }
  
  // Get game statistics
  getGameStats() {
    const memory = this.loadGameMemory();
    return {
      totalScore: memory.totalScore,
      totalGamesPlayed: memory.totalGamesPlayed,
      favoriteGame: memory.favoriteGame,
      lastActive: memory.lastActive,
      games: Object.keys(memory.games).map(gameType => ({
        gameType,
        ...memory.games[gameType]
      }))
    };
  }
  
  // Clear all game data
  clearGameData() {
    const userId = this.getCurrentUserId();
    localStorage.removeItem(`${this.memoryKey}_${userId}`);
  }
  
  // Sync with Supabase (for when user logs in)
  async syncWithSupabase(userId: string) {
    try {
      if (!supabase) return;
      
      // Load from Supabase
      const cloudMemory = await this.loadFromSupabase(userId);
      const localMemory = this.loadGameMemory();
      
      if (cloudMemory && cloudMemory.lastActive > localMemory.lastActive) {
        // Cloud is newer, use cloud data
        localStorage.setItem(`${this.memoryKey}_${userId}`, JSON.stringify(cloudMemory));
      } else if (localMemory.lastActive > cloudMemory?.lastActive) {
        // Local is newer, save to cloud
        await this.saveToSupabase(userId, localMemory);
      }
    } catch (error) {
      console.error('Failed to sync with Supabase:', error);
    }
  }
}

export const gameMemoryService = new GameMemoryService();
