import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';

export interface WebSocketMessage {
  type: string;
  session_id?: string;
  data?: any;
}

export const useWebSocket = (
  room: string,
  onSessionDropped: () => void,
  onLeaderboardUpdate?: (data: any) => void,
  onChatMessage?: (data: any) => void,
  onTimerUpdate?: (data: any) => void
) => {
  const { sessionId } = useAppSelector((state) => state.username);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const effectRunCountRef = useRef(0);
  const lastSessionIdRef = useRef<string | null>(null);
  const hasConnectedRef = useRef(false);
  const roomRef = useRef(room);

  // Store callbacks in refs to prevent unnecessary reconnections
  const onSessionDroppedRef = useRef(onSessionDropped);
  const onLeaderboardUpdateRef = useRef(onLeaderboardUpdate);
  const onChatMessageRef = useRef(onChatMessage);
  const onTimerUpdateRef = useRef(onTimerUpdate);

  // Keep room ref up to date
  useEffect(() => {
    roomRef.current = room;
  }, [room]);
  
  useEffect(() => {
    if (lastSessionIdRef.current !== sessionId) {
      lastSessionIdRef.current = sessionId;
      // Reset connection state when sessionId changes
      hasConnectedRef.current = false;
    }
  });

  // Update refs when callbacks change
  useEffect(() => {               
    onSessionDroppedRef.current = onSessionDropped;
    onLeaderboardUpdateRef.current = onLeaderboardUpdate;
    onChatMessageRef.current = onChatMessage;
    onTimerUpdateRef.current = onTimerUpdate;
  }, [onSessionDropped, onLeaderboardUpdate, onChatMessage, onTimerUpdate]);

  const connect = useCallback(() => {
    if (!sessionId) {
      return;
    }

    // Prevent duplicate connections
    if (isConnectingRef.current) {
      return;
    }

    // Don't create a new connection if one already exists
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8081';
    const wsUrl = `${wsBase}/ws?session_id=${sessionId}&room=${roomRef.current}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnectingRef.current = false;
      hasConnectedRef.current = true;
    };

    // Handle WebSocket protocol-level ping frames
    // Browser automatically responds with pong
    if ('addEventListener' in ws) {
      try {
        ws.addEventListener('ping', () => {
          // Ping received, browser auto-responds with pong
        });
      } catch (e) {
        // Ping event not supported, but pong responses are automatic
      }
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'user_left') {
          // Check if this user_left event is for the current user
          if (message.session_id === sessionId) {
            // Current user was removed, redirect to landing page
            onSessionDroppedRef.current();
          } else {
            // Another user left, update leaderboard
            if (onLeaderboardUpdateRef.current) {
              onLeaderboardUpdateRef.current(message);
            }
          }
        } else if (message.type === 'user_joined' || message.type === 'user_offline' || message.type === 'user_online' || message.type === 'user_away') {
          if (onLeaderboardUpdateRef.current) {
            onLeaderboardUpdateRef.current(message);
          }
        } else if (message.type === 'chat_message') {
          if (onChatMessageRef.current) {
            onChatMessageRef.current(message);
          }
        } else if (message.type === 'trivia_question') {
          // Handle trivia question from backend (data structure: { type, category, question, difficulty })
          if (onChatMessageRef.current) {
            onChatMessageRef.current(message);
          }
        } else if (message.type === 'score_update') {
          // Handle score update from backend
          if (onChatMessageRef.current) {
            onChatMessageRef.current(message);
          }
        } else if (message.type === 'streak_update') {
          // Handle streak update from backend
          if (onLeaderboardUpdateRef.current) {
            onLeaderboardUpdateRef.current(message);
          }
        } else if (message.type === 'trivia_hint') {
          // Handle hint from backend
          if (onChatMessageRef.current) {
            onChatMessageRef.current(message);
          }
        } else if (message.type === 'timer_tick' || message.type === 'score_reset') {
          // Handle timer events
          if (onTimerUpdateRef.current) {
            onTimerUpdateRef.current(message);
          }
        } else {
          // Unknown message type
        }
      } catch (error) {
        
      }
    };

    ws.onclose = () => {
      isConnectingRef.current = false;
      wsRef.current = null;
    };

    ws.onerror = () => {
      isConnectingRef.current = false;
    };

    wsRef.current = ws;
  }, [sessionId]);

  const disconnect = useCallback(() => {
    // Don't disconnect if we just connected (prevents React StrictMode cycling)
    if (!hasConnectedRef.current) {
      return;
    }
    
    if (wsRef.current) {
      // Send user_left event instead of client_disconnect
      try {
        wsRef.current.send(JSON.stringify({
          type: 'user_left',
          session_id: sessionId
        }));
      } catch (error) {
        // Could not send user_left message
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
    
    // Prevent multiple effect runs with the same sessionId
    if (lastSessionIdRef.current === sessionId && hasConnectedRef.current) {
      return;
    }
    
    if (sessionId) {
      // Only connect if we don't already have a connection
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect();
      }
    } else {
      disconnect();
    }

    // Add beforeunload listener for graceful tab close
    const handleBeforeUnload = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({
            type: 'user_left',
            session_id: sessionId
          }));
        } catch (error) {
          // Could not send user_left message before tab close
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup only when component unmounts or sessionId changes
    return () => {
      // Remove beforeunload listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Only cleanup if we're actually changing sessions or unmounting
      if (sessionId && hasConnectedRef.current) {
        disconnect();
      }
    };
  }, [sessionId]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connectionState: wsRef.current?.readyState,
    sessionId,
    sendMessage: (message: any) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    },
    sendStatusUpdate: (status: 'online' | 'away') => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: status === 'online' ? 'user_online' : 'user_away',
          status: status
        }));
      }
    },
  };
};
