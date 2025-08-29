import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';

export const useUserStatus = () => {
  const { sessionId } = useAppSelector((state) => state.username);
  const statusIntervalRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<'online' | 'offline'>('online');

  // Track user activity
  const updateActivity = useCallback(() => {
    const now = Date.now();
    const wasOffline = currentStatusRef.current === 'offline';
    
    console.log('🔄 updateActivity called - wasOffline:', wasOffline, 'currentStatus:', currentStatusRef.current);
    
    lastActivityRef.current = now;
    
    // If user was offline and becomes active, send online status
    if (wasOffline) {
      console.log('🔄 User was offline, sending online status update');
      currentStatusRef.current = 'online';
      sendStatusUpdate('online');
    } else {
    }
  }, []);

  // Send status update to backend
  const sendStatusUpdate = useCallback(async (status: 'online' | 'offline') => {
    if (!sessionId) {
      console.log('❌ No sessionId, skipping status update');
      return;
    }
    
    console.log(`📤 Sending status update to backend: ${status} for session: ${sessionId}`);
    
    try {
      const response = await fetch('http://localhost:8081/update_user_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          status: status,
        }),
      });
      
      if (response.ok) {
        console.log(`✅ Status updated to: ${status}`);
      } else {
        console.error(`❌ Failed to update status to: ${status}`);
      }
    } catch (error) {
      console.error('Failed to send status update:', error);
    }
  }, [sessionId]);

  // Start status monitoring interval
  const startStatusMonitoring = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    statusIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Mark as offline after 1 minute of inactivity
      if (timeSinceLastActivity > 60000 && currentStatusRef.current === 'online') {
        currentStatusRef.current = 'offline';
        sendStatusUpdate('offline');
        console.log('⏰ User marked as offline due to inactivity');
      }
    }, 30000); // Check every 30 seconds
  }, [sendStatusUpdate]);

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

    // Start status monitoring when session is available
    startStatusMonitoring();

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Track tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Don't immediately mark as offline when tab is hidden
        // Let the inactivity timer handle it
      } else {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track window focus/blur
    const handleFocus = () => {
      updateActivity();
    };

    const handleBlur = () => {
      // Don't immediately mark as offline when window loses focus
      // Let the inactivity timer handle it
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      stopStatusMonitoring();
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [sessionId, startStatusMonitoring, stopStatusMonitoring, updateActivity]);

  return {
    isActive: currentStatusRef.current === 'online',
    currentStatus: currentStatusRef.current,
    lastActivity: lastActivityRef.current,
  };
};
