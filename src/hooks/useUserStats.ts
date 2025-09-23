import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStats {
  // Basic stats
  totalChats: number;
  totalCalls: number;
  totalFavorites: number;
  
  // Experience and level system
  xp: number;
  level: number;
  xpToNextLevel: number;
  
  // Engagement metrics
  streakDays: number;
  longestStreak: number;
  totalMinutesSpent: number;
  
  // Achievement-based stats
  messagesThisWeek: number;
  callsThisWeek: number;
  companionsCreated: number;
  
  // User activity patterns
  lastActiveDate: Date;
  favoriteTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  mostTalkedToCompanion: string;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

// XP calculation constants
const XP_PER_MESSAGE = 5;
const XP_PER_CALL_MINUTE = 10;
const XP_PER_FAVORITE = 25;
const XP_PER_COMPANION_CREATED = 100;
const XP_PER_STREAK_DAY = 50;

// Level calculation (exponential growth)
const getXPRequiredForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const getLevelFromXP = (xp: number): number => {
  let level = 1;
  let totalXPRequired = 0;
  
  while (totalXPRequired <= xp) {
    totalXPRequired += getXPRequiredForLevel(level);
    if (totalXPRequired <= xp) level++;
  }
  
  return level;
};

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalChats: 0,
    totalCalls: 0,
    totalFavorites: 0,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    streakDays: 0,
    longestStreak: 0,
    totalMinutesSpent: 0,
    messagesThisWeek: 0,
    callsThisWeek: 0,
    companionsCreated: 0,
    lastActiveDate: new Date(),
    favoriteTimeOfDay: 'evening',
    mostTalkedToCompanion: 'Luna'
  });

  const [achievements] = useState<UserAchievement[]>([
    {
      id: 'first_chat',
      title: 'First Connection',
      description: 'Send your first message',
      icon: '💬',
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'chatty',
      title: 'Chatty',
      description: 'Send 100 messages',
      icon: '🗣️',
      progress: 0,
      maxProgress: 100
    },
    {
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Chat with 5 different companions',
      icon: '🦋',
      progress: 0,
      maxProgress: 5
    },
    {
      id: 'loyal_friend',
      title: 'Loyal Friend',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      progress: 0,
      maxProgress: 7
    },
    {
      id: 'voice_lover',
      title: 'Voice Lover',
      description: 'Make 10 voice calls',
      icon: '📞',
      progress: 0,
      maxProgress: 10
    }
  ]);

  // Load stats from localStorage or user data
  useEffect(() => {
    const savedStats = localStorage.getItem(`userStats_${user?.id || 'guest'}`);
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      const updatedStats = {
        ...parsed,
        lastActiveDate: new Date(parsed.lastActiveDate)
      };
      
      // Recalculate level and XP to next level
      updatedStats.level = getLevelFromXP(updatedStats.xp);
      const currentLevelXP = getXPRequiredForLevel(updatedStats.level);
      const nextLevelXP = getXPRequiredForLevel(updatedStats.level + 1);
      updatedStats.xpToNextLevel = nextLevelXP - (updatedStats.xp % currentLevelXP);
      
      setStats(updatedStats);
    }
  }, [user]);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem(`userStats_${user?.id || 'guest'}`, JSON.stringify(stats));
  }, [stats, user]);

  // Add XP and update level
  const addXP = (amount: number, reason: string) => {
    setStats(prev => {
      const newXP = prev.xp + amount;
      const newLevel = getLevelFromXP(newXP);
      const leveledUp = newLevel > prev.level;
      
      if (leveledUp) {
        // Show level up notification
        console.log(`🎉 Level up! You're now level ${newLevel}!`);
      }
      
      const currentLevelXP = getXPRequiredForLevel(newLevel);
      const nextLevelXP = getXPRequiredForLevel(newLevel + 1);
      const xpToNextLevel = nextLevelXP - (newXP % currentLevelXP);
      
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNextLevel: xpToNextLevel
      };
    });
  };

  // Update specific stats with XP rewards
  const updateStats = {
    addMessage: () => {
      setStats(prev => ({ ...prev, totalChats: prev.totalChats + 1, messagesThisWeek: prev.messagesThisWeek + 1 }));
      addXP(XP_PER_MESSAGE, 'message sent');
    },
    
    addCall: (durationMinutes: number) => {
      setStats(prev => ({ ...prev, totalCalls: prev.totalCalls + 1, callsThisWeek: prev.callsThisWeek + 1, totalMinutesSpent: prev.totalMinutesSpent + durationMinutes }));
      addXP(XP_PER_CALL_MINUTE * durationMinutes, 'voice call');
    },
    
    addFavorite: () => {
      setStats(prev => ({ ...prev, totalFavorites: prev.totalFavorites + 1 }));
      addXP(XP_PER_FAVORITE, 'companion favorited');
    },
    
    removeFavorite: () => {
      setStats(prev => ({ ...prev, totalFavorites: Math.max(0, prev.totalFavorites - 1) }));
    },
    
    addCompanion: () => {
      setStats(prev => ({ ...prev, companionsCreated: prev.companionsCreated + 1 }));
      addXP(XP_PER_COMPANION_CREATED, 'companion created');
    },
    
    updateStreak: () => {
      const today = new Date().toDateString();
      const lastActive = stats.lastActiveDate.toDateString();
      
      if (today !== lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive === yesterday.toDateString()) {
          // Continue streak
          setStats(prev => {
            const newStreak = prev.streakDays + 1;
            const newLongestStreak = Math.max(prev.longestStreak, newStreak);
            addXP(XP_PER_STREAK_DAY, 'daily streak');
            return {
              ...prev,
              streakDays: newStreak,
              longestStreak: newLongestStreak,
              lastActiveDate: new Date()
            };
          });
        } else {
          // Streak broken, reset
          setStats(prev => ({
            ...prev,
            streakDays: 1,
            lastActiveDate: new Date()
          }));
        }
      }
    }
  };

  // Calculate completion percentage for achievements
  const getAchievementProgress = (achievement: UserAchievement): number => {
    switch (achievement.id) {
      case 'first_chat':
        return stats.totalChats > 0 ? 100 : 0;
      case 'chatty':
        return Math.min((stats.totalChats / 100) * 100, 100);
      case 'social_butterfly':
        return Math.min((stats.companionsCreated / 5) * 100, 100);
      case 'loyal_friend':
        return Math.min((stats.streakDays / 7) * 100, 100);
      case 'voice_lover':
        return Math.min((stats.totalCalls / 10) * 100, 100);
      default:
        return 0;
    }
  };

  return {
    stats,
    achievements: achievements.map(a => ({
      ...a,
      progress: getAchievementProgress(a)
    })),
    updateStats,
    addXP
  };
}; 