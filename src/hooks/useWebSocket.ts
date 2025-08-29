import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';

export interface WebSocketMessage {
  type: string;
  session_id?: string;
  data?: any;
}

export const useWebSocket = (onSessionDropped: () => void, onLeaderboardUpdate?: (data: any) => void) => {
  const { sessionId } = useAppSelector((state) => state.username);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const effectRunCountRef = useRef(0);
  const lastSessionIdRef = useRef<string | null>(null);
  const hasConnectedRef = useRef(false);
  
  // Store callbacks in refs to prevent unnecessary reconnections
  const onSessionDroppedRef = useRef(onSessionDropped);
  const onLeaderboardUpdateRef = useRef(onLeaderboardUpdate);
  
  // Debug sessionId changes
  useEffect(() => {
    if (lastSessionIdRef.current !== sessionId) {
      console.log('🔄 sessionId changed from:', lastSessionIdRef.current, 'to:', sessionId);
      lastSessionIdRef.current = sessionId;
      // Reset connection state when sessionId changes
      hasConnectedRef.current = false;
    } else {
      console.log('🔄 sessionId unchanged:', sessionId);
    }
  });

  // Update refs when callbacks change
  useEffect(() => {
    console.log('🔄 Callback refs updated');
    onSessionDroppedRef.current = onSessionDropped;
    onLeaderboardUpdateRef.current = onLeaderboardUpdate;
  }, [onSessionDropped, onLeaderboardUpdate]);

  const connect = useCallback(() => {
    console.log('🔌 connect() called with sessionId:', sessionId);
    
    if (!sessionId) {
      console.log('No sessionId available, skipping WebSocket connection');
      return;
    }

    // Prevent duplicate connections
    if (isConnectingRef.current) {
      console.log('Already connecting, skipping duplicate connection attempt');
      return;
    }

    // Don't create a new connection if one already exists
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping new connection');
      return;
    }

    isConnectingRef.current = true;
    console.log('🔄 Creating WebSocket connection for session:', sessionId);
    const wsUrl = `ws://localhost:8081/ws?session_id=${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected for session:', sessionId);
      isConnectingRef.current = false;
      hasConnectedRef.current = true;
    };

    // Handle WebSocket protocol-level ping frames
    // Browser automatically responds with pong
    if ('addEventListener' in ws) {
      try {
        ws.addEventListener('ping', () => {
          console.log('🏓 Received ping from backend, browser auto-responds with pong');
        });
      } catch (e) {
        console.log('🏓 Ping event not supported, but pong responses are automatic');
      }
    }

    ws.onmessage = (event) => {
      console.log('📨 WebSocket message received:', event.data);
      
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'user_dropped') {
          console.log('🔄 User dropped by backend cleanup, redirecting to landing page');
          onSessionDroppedRef.current();
        } else if (message.type === 'user_left') {
          console.log('🔄 User left, updating leaderboard for everyone');
          // Update leaderboard for all clients (no need to check session_id)
          if (onLeaderboardUpdateRef.current) {
            onLeaderboardUpdateRef.current(message);
          }
        } else if (message.type === 'user_joined' || message.type === 'user_offline' || message.type === 'user_online') {
          console.log(`🔄 Leaderboard update: ${message.type} event`);
          if (onLeaderboardUpdateRef.current) {
            onLeaderboardUpdateRef.current(message);
          }
        } else {
          console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      isConnectingRef.current = false;
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      isConnectingRef.current = false;
    };

    wsRef.current = ws;
  }, [sessionId]);

  const disconnect = useCallback(() => {
    console.log('🔌 disconnect() called with sessionId:', sessionId, 'wsRef.current:', wsRef.current?.readyState, 'hasConnected:', hasConnectedRef.current);
    
    // Don't disconnect if we just connected (prevents React StrictMode cycling)
    if (!hasConnectedRef.current) {
      console.log('🔌 Skipping disconnect - connection not yet established');
      return;
    }
    
    if (wsRef.current) {
      console.log('🔌 Disconnecting WebSocket for session:', sessionId);
      
      // Send a proper close message before closing
      try {
        wsRef.current.send(JSON.stringify({
          type: 'client_disconnect',
          session_id: sessionId,
          reason: 'tab_closed'
        }));
        console.log('📤 Sent client_disconnect message to backend');
      } catch (error) {
        console.log('⚠️ Could not send disconnect message:', error);
      }
      
      // Close the WebSocket with a proper close code
      wsRef.current.close(1000, 'Client intentionally disconnected');
      wsRef.current = null;
    }
    
    hasConnectedRef.current = false;
  }, [sessionId]);

  // Main effect - only run when sessionId changes
  useEffect(() => {
    effectRunCountRef.current++;
    console.log(`🔄 useWebSocket effect #${effectRunCountRef.current} - sessionId:`, sessionId, 'wsRef.current:', wsRef.current?.readyState, 'hasConnected:', hasConnectedRef.current);
    
    // Prevent multiple effect runs with the same sessionId
    if (lastSessionIdRef.current === sessionId && hasConnectedRef.current) {
      console.log('🔄 Skipping effect - same sessionId and already connected');
      return;
    }
    
    if (sessionId) {
      // Only connect if we don't already have a connection
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect();
      } else {
        console.log('🔄 WebSocket already connected, skipping connection');
      }
    } else {
      disconnect();
    }

    // Add beforeunload listener for graceful tab close
    const handleBeforeUnload = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('🔄 Tab closing, sending graceful disconnect message');
        try {
          wsRef.current.send(JSON.stringify({
            type: 'client_disconnect',
            session_id: sessionId,
            reason: 'tab_closing'
          }));
          console.log('📤 Sent client_disconnect message before tab close');
        } catch (error) {
          console.log('⚠️ Could not send disconnect message before tab close:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup only when component unmounts or sessionId changes
    return () => {
      console.log(`🧹 useWebSocket cleanup #${effectRunCountRef.current} - sessionId:`, sessionId, 'wsRef.current:', wsRef.current?.readyState, 'hasConnected:', hasConnectedRef.current);
      
      // Remove beforeunload listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Only cleanup if we're actually changing sessions or unmounting
      if (sessionId && hasConnectedRef.current) {
        console.log('🧹 Cleaning up due to session change or unmount');
        disconnect();
      } else {
        console.log('🧹 Skipping cleanup - no established connection to clean up');
      }
    };
  }, [sessionId]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connectionState: wsRef.current?.readyState,
    sessionId,
  };
};
