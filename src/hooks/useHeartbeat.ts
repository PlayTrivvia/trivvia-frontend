import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearUsername } from '../store/usernameSlice';

export const useUserStatus = (
  isGuest: boolean,
  sendStatusUpdate: (status: 'online' | 'away') => void,
  sendMessage: (message: any) => void,
) => {
  const { sessionId } = useAppSelector((state) => state.username);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const statusIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<'online' | 'away'>('online');
  const modalShownRef = useRef(false);
  const showWarningModalRef = useRef(false);

  // Keep sendMessage in a ref so the countdown effect can access it without stale closures
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [guestTimedOut, setGuestTimedOut] = useState(false);

  // When countdown reaches 0, kick the guest (state flag avoids stale closure in interval)
  useEffect(() => {
    if (!guestTimedOut) return;
    sendMessageRef.current({ type: 'user_left', session_id: sessionId });
    dispatch(clearUsername());
    navigate('/');
    setGuestTimedOut(false);
  }, [guestTimedOut, sessionId, dispatch, navigate]);

  // Sync showWarningModal state and ref together — ref is needed inside event callbacks
  const setShowWarningModalSync = useCallback((val: boolean) => {
    showWarningModalRef.current = val;
    setShowWarningModal(val);
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    stopCountdown();
    setCountdown(60);
    setShowWarningModalSync(true);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          setShowWarningModalSync(false);
          setGuestTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopCountdown, setShowWarningModalSync]);

  // Send status update to backend via websocket
  const updateUserStatus = useCallback((status: 'online' | 'away') => {
    if (!sessionId) return;
    try {
      sendStatusUpdate(status);
    } catch (error) {}
  }, [sessionId, sendStatusUpdate]);

  // Track user activity — ignored while warning modal is visible so only the button dismisses it
  const updateActivity = useCallback(() => {
    if (showWarningModalRef.current) return;
    const now = Date.now();
    const wasAway = currentStatusRef.current === 'away';
    lastActivityRef.current = now;
    if (wasAway) {
      currentStatusRef.current = 'online';
      updateUserStatus('online');
    }
  }, [updateUserStatus]);

  // "I'm here" button: reset idle timer, clear countdown, send online heartbeat
  const handleStayActive = useCallback(() => {
    stopCountdown();
    setShowWarningModalSync(false);
    setCountdown(60);
    modalShownRef.current = false;
    lastActivityRef.current = Date.now();
    currentStatusRef.current = 'online';
    updateUserStatus('online');
  }, [stopCountdown, setShowWarningModalSync, updateUserStatus]);

  // Start status monitoring interval
  const startStatusMonitoring = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    statusIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      // Mark as away after 5 minutes of inactivity
      if (timeSinceLastActivity > 300000 && currentStatusRef.current === 'online') {
        currentStatusRef.current = 'away';
        updateUserStatus('away');

        // Guests only: show warning modal and start 60s countdown before removing them
        if (isGuest && !modalShownRef.current) {
          modalShownRef.current = true;
          startCountdown();
        }
      }
    }, 30000); // Check every 30 seconds
  }, [updateUserStatus, isGuest, startCountdown]);

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

    // Reset state when session changes
    currentStatusRef.current = 'online';
    lastActivityRef.current = Date.now();
    modalShownRef.current = false;

    startStatusMonitoring();

    // Track various user activities (visibilitychange is document-based, same as the rest)
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'visibilitychange'];

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      stopStatusMonitoring();
      stopCountdown();
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      currentStatusRef.current = 'online';
    };
  }, [sessionId, startStatusMonitoring, stopStatusMonitoring, stopCountdown, updateActivity]);

  return {
    isActive: currentStatusRef.current === 'online',
    currentStatus: currentStatusRef.current,
    lastActivity: lastActivityRef.current,
    showWarningModal,
    countdown,
    handleStayActive,
  };
};
