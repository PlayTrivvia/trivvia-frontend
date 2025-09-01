import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { useWebSocket } from './useWebSocket';

export const useUserStatus = () => {
  const { sessionId } = useAppSelector((state) => state.username);
  const { sendStatusUpdate } = useWebSocket(() => {}, () => {}, () => {});
  const statusIntervalRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<'online' | 'away'>('online');

  // Send status update to backend via websocket
  const updateUserStatus = useCallback((status: 'online' | 'away') => {
    if (!sessionId) {
      return;
    }
    
    try {
      sendStatusUpdate(status);
      console.log(`📤 Status update sent: ${status}`);
    } catch (error) {
      console.error('❌ Failed to send status update:', error);
    }
  }, [sessionId, sendStatusUpdate]);

  // Track user activity
  const updateActivity = useCallback(() => {
    const now = Date.now();
    const wasAway = currentStatusRef.current === 'away';
    lastActivityRef.current = now;
    
    // If user was away and becomes active, send online status
    if (wasAway) {
      currentStatusRef.current = 'online';
      updateUserStatus('online');
    }
  }, [updateUserStatus]);

  // Start status monitoring interval
  const startStatusMonitoring = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    statusIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Mark as away after 2 minutes of inactivity
      if (timeSinceLastActivity > 120000 && currentStatusRef.current === 'online') {
        currentStatusRef.current = 'away';
        updateUserStatus('away');
        console.log('⏰ User marked as away due to inactivity (2 minutes)');
      }
    }, 30000); // Check every 30 seconds
  }, [updateUserStatus]);

  // Stop status monitoring interval
  const stopStatusMonitoring = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!sessionId) return;

    // Reset status when session changes
    currentStatusRef.current = 'online';
    lastActivityRef.current = Date.now();
    
    // Start status monitoring when session is available
    startStatusMonitoring();

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Cleanup
    return () => {
      stopStatusMonitoring();
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      // Reset status when component unmounts
      currentStatusRef.current = 'online';
    };
  }, [sessionId, startStatusMonitoring, stopStatusMonitoring, updateActivity]);

  return {
    isActive: currentStatusRef.current === 'online',
    currentStatus: currentStatusRef.current,
    lastActivity: lastActivityRef.current,
  };
};
