import { useState, useEffect, useCallback } from 'react';

export interface LeaderboardUser {
  username: string;
  session_id: string;
  joined_at?: number;
  last_seen_at?: number;
  status: 'online' | 'away';
  best_streak: number;
}

export const useLeaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/active_users`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Ensure all users have proper status values and sort by best streak
      const usersWithStatus = data.users
        .filter((user: any) => user.status !== 'offline') // Remove offline users completely
        .map((user: any) => ({
          ...user,
          status: user.status === 'away' ? 'away' : 'online', // Map remaining statuses
          joined_at: user.joined_at || 0,
          last_seen_at: user.last_seen_at || 0
        }))
        .sort((a: LeaderboardUser, b: LeaderboardUser) => b.best_streak - a.best_streak); // Sort by best streak in descending order
      setUsers(usersWithStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLeaderboardUpdate = useCallback((message: any) => { 
    try {
      if (message.type === 'user_joined') {
        // Get username from the top level (not nested under data)
        const username = message.username || 'Unknown User';
        
        if (!username || username === 'Unknown User') {
          
          return; // Don't add user without username
        }
        
        const newUser: LeaderboardUser = {
          username: username,
          session_id: message.session_id,
          status: 'online', // Default to online when joining
          best_streak: 0,
          joined_at: Math.floor(Date.now() / 1000), // Use Unix timestamp
          last_seen_at: Math.floor(Date.now() / 1000) // Use Unix timestamp
        };
        
        setUsers(prevUsers => {
          // Check if user already exists
          const exists = prevUsers.find(u => u.session_id === message.session_id);
          if (!exists) {
            return [...prevUsers, newUser];
          } else {
            return prevUsers;
          }
        });
      } else if (message.type === 'user_offline') {
        // Remove user from the list when they go offline
        setUsers(prevUsers => prevUsers.filter(u => u.session_id !== message.session_id));
      } else if (message.type === 'user_online') {
        // Update existing user status to online
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => 
            user.session_id === message.session_id 
              ? { ...user, status: 'online' as const }
              : user
          );
          return updatedUsers;
        });
      } else if (message.type === 'user_away') {
        // Update existing user status to away
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => 
            user.session_id === message.session_id 
              ? { ...user, status: 'away' as const }
              : user
          );
          return updatedUsers;
        });
      } else if (message.type === 'user_left') {
        // Remove user from the list (tab close, navigation, reload)
        setUsers(prevUsers => prevUsers.filter(u => u.session_id !== message.session_id));
      } else if (message.type === 'streak_update') {
        // Update user streak and resort the list
        
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => 
            user.session_id === message.session_id 
              ? { ...user, best_streak: message.best_streak }
              : user
          );
          
          // If this is a new personal best, log it
          
          
          // Sort by best streak in descending order
          return updatedUsers.sort((a: LeaderboardUser, b: LeaderboardUser) => b.best_streak - a.best_streak);
        });
      }
    } catch (error) {
      
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []); // Only run once on mount

  return {
    users,
    isLoading,
    error,
    refresh: fetchUsers,
    onLeaderboardUpdate: handleLeaderboardUpdate,
  };
};
