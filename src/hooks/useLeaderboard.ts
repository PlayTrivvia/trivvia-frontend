import { useState, useEffect, useCallback } from 'react';

export interface LeaderboardUser {
  username: string;
  session_id: string;
  joined_at: number;
  last_seen_at: number;
  status: 'online' | 'away';
  score: number;
}

export const useLeaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8081/active_users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 Fetched initial users:', data.users);
      
      // Ensure all users have proper status values
      const usersWithStatus = data.users.map((user: any) => ({
        ...user,
        status: user.status === 'offline' ? 'away' : 'online' // Map backend status to frontend status
      }));
      
      console.log('📊 Users with mapped status:', usersWithStatus);
      setUsers(usersWithStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error fetching leaderboard users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLeaderboardUpdate = useCallback((message: any) => { 
    console.log('📨 useLeaderboard received message:', message);
    
    try {
      if (message.type === 'user_joined') {
        // Add new user to the list
        console.log('🆕 Processing user_joined message:', message);
        console.log('🆕 Message keys:', Object.keys(message));
        console.log('🆕 Username field:', message.username);
        console.log('🆕 Session ID field:', message.session_id);
        
        // Try to get username from multiple possible fields
        const username = message.username || message.Username || message.data?.username || 'Unknown User';
        console.log('🆕 Extracted username:', username);
        
        if (!username || username === 'Unknown User') {
          console.error('❌ Could not extract username from message:', message);
          return; // Don't add user without username
        }
        
        const newUser: LeaderboardUser = {
          username: username,
          session_id: message.session_id,
          status: 'online', // Default to online when joining
          score: 0,
          joined_at: Date.now(),
          last_seen_at: Date.now()
        };
        
        console.log('🆕 Created new user object:', newUser);
        
        setUsers(prevUsers => {
          // Check if user already exists
          const exists = prevUsers.find(u => u.session_id === message.session_id);
          if (!exists) {
            console.log('🆕 Adding new user to leaderboard');
            return [...prevUsers, newUser];
          } else {
            console.log('🆕 User already exists, not adding');
            return prevUsers;
          }
        });
      } else if (message.type === 'user_offline') {
        // Update existing user status to offline
        console.log('🔄 Updating user to offline:', message.session_id);
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => 
            user.session_id === message.session_id 
              ? { ...user, status: 'away' as const } // Map offline to 'away' status
              : user
          );
          console.log('📊 Users after offline update:', updatedUsers);
          return updatedUsers;
        });
      } else if (message.type === 'user_online') {
        // Update existing user status to online
        console.log('🔄 Updating user to online:', message.session_id);
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => 
            user.session_id === message.session_id 
              ? { ...user, status: 'online' as const }
              : user
          );
          console.log('📊 Users after online update:', updatedUsers);
          return updatedUsers;
        });
      } else if (message.type === 'user_left') {
        // Remove user from the list
        setUsers(prevUsers => prevUsers.filter(u => u.session_id !== message.session_id));
      }
    } catch (error) {
      console.error('❌ Error processing leaderboard update:', error, 'Message:', message);
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
