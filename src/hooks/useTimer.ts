import { useState, useEffect, useCallback } from 'react';

export interface TimerEvent {
  type: string;
  time_left: number;
  timestamp: number;
}

export interface ScoreResetEvent {
  type: string;
  timestamp: number;
}

export const useTimer = () => {
  const [timeLeft, setTimeLeft] = useState<number>(600); // Default to 10 minutes
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial timer value from backend
  const fetchTimerValue = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8081/timer');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('⏰ Fetched initial timer value:', data.time_left);
      setTimeLeft(data.time_left);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timer value');
      console.error('Error fetching timer value:', err);
      // Fallback to 10 minutes if fetch fails
      setTimeLeft(600);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle timer events from WebSocket
  const handleTimerUpdate = useCallback((message: any) => {
    if (message.type === 'timer_tick') {
      console.log('⏰ Timer tick:', message.time_left);
      setTimeLeft(message.time_left);
    } else if (message.type === 'score_reset') {
      console.log('🔄 Score reset event received');
      // Timer will be reset to 10 minutes by the backend
      setTimeLeft(600);
    }
  }, []);

  // Start local countdown when timer value changes
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Fetch initial timer value on mount
  useEffect(() => {
    fetchTimerValue();
  }, [fetchTimerValue]);

  return {
    timeLeft,
    isLoading,
    error,
    refresh: fetchTimerValue,
    onTimerUpdate: handleTimerUpdate,
  };
};
