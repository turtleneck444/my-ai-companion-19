import { useState, useEffect, useCallback } from 'react';
import { gameMemoryService, GameState, GameMemory } from '@/lib/game-memory';
import { useAuth } from '@/contexts/AuthContext';

export const useGameMemory = () => {
  const { user } = useAuth();
  const [gameMemory, setGameMemory] = useState<GameMemory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load game memory on mount and when user changes
  useEffect(() => {
    loadGameMemory();
  }, [user]);

  const loadGameMemory = async () => {
    try {
      setIsLoading(true);
      
      if (user?.id) {
        // Sync with Supabase for authenticated users
        await gameMemoryService.syncWithSupabase(user.id);
      }
      
      const memory = gameMemoryService.loadGameMemory();
      setGameMemory(memory);
    } catch (error) {
      console.error('Failed to load game memory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameState = useCallback(async (
    gameType: string, 
    state: any, 
    score: number = 0, 
    achievements: string[] = []
  ) => {
    try {
      const gameState = await gameMemoryService.saveGameState(gameType, state, score, achievements);
      if (gameState) {
        // Reload memory to get updated state
        await loadGameMemory();
      }
      return gameState;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return null;
    }
  }, []);

  const loadGameState = useCallback((gameType: string): GameState | null => {
    return gameMemoryService.loadGameState(gameType);
  }, []);

  const addAchievement = useCallback((gameType: string, achievement: string) => {
    gameMemoryService.addAchievement(gameType, achievement);
    loadGameMemory(); // Reload to get updated achievements
  }, []);

  const getGameStats = useCallback(() => {
    return gameMemoryService.getGameStats();
  }, []);

  const clearGameData = useCallback(() => {
    gameMemoryService.clearGameData();
    setGameMemory(null);
  }, []);

  return {
    gameMemory,
    isLoading,
    saveGameState,
    loadGameState,
    addAchievement,
    getGameStats,
    clearGameData,
    loadGameMemory
  };
};
