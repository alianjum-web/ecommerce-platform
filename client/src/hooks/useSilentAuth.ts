// hooks/useSilentAuth.tsx - WITH LOGGER
"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authLogger } from "@/utils/Logger";

export default function useSilentAuth() {
  const { refreshAccessToken, checkSession, getTokenExpiryInfo } = useAuthStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);

  const calculateRefreshTime = useCallback(async (): Promise<number | null> => {
    try {
      const expiryInfo = getTokenExpiryInfo();
      
      if (expiryInfo) {
        if (expiryInfo.shouldRefresh) {
          authLogger.debug('Token needs immediate refresh');
          return 0; // Refresh immediately
        }
        
        if (expiryInfo.timeUntilExpiry > 0) {
          // Refresh 1 minute before expiry (safety margin)
          const safetyMargin = 1 * 60 * 1000; // 1 minute
          const refreshTime = Math.max(expiryInfo.timeUntilExpiry - safetyMargin, 10000); // Min 10 seconds
          
          authLogger.debug(`Scheduled refresh in ${Math.round(refreshTime / 60000)}m ${Math.round((refreshTime % 60000) / 1000)}s`, {
            timeUntilExpiry: expiryInfo.timeUntilExpiry,
            safetyMargin,
            calculatedRefreshTime: refreshTime
          });
          
          return refreshTime;
        }
      }

      // If no stored info, check session
      const sessionInfo = await checkSession();
      
      if (!sessionInfo?.hasRefreshToken) {
        authLogger.warn('No refresh token available, skipping schedule');
        return null;
      }

      // ✅ CORRECTED: Default to 12 minutes (80% of 15 minutes)
      const DEFAULT_REFRESH_TIME = 12 * 60 * 1000; // 12 minutes
      authLogger.info('Using default refresh time', { defaultTime: '12 minutes' });
      
      return DEFAULT_REFRESH_TIME;
      
    } catch (error) {
      authLogger.error('Failed to calculate refresh time', error);
      // Fallback to 10 minutes if everything fails
      return 10 * 60 * 1000;
    }
  }, [checkSession, getTokenExpiryInfo]);

  const scheduleTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      authLogger.debug('Refresh already in progress, skipping');
      return;
    }

    try {
      const refreshTime = await calculateRefreshTime();
      
      if (refreshTime === null) {
        authLogger.info('No session detected, skipping refresh schedule');
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        authLogger.debug('Cleared existing refresh timeout');
      }

      // If refresh time is 0, refresh immediately
      if (refreshTime <= 0) {
        authLogger.info('Immediate token refresh required');
        await performTokenRefresh();
        return;
      }

      // Schedule future refresh
      authLogger.info(`Scheduled next token refresh`, {
        refreshInMinutes: Math.round(refreshTime / 60000),
        refreshInSeconds: Math.round(refreshTime / 1000),
        scheduledTime: new Date(Date.now() + refreshTime).toISOString()
      });

      timeoutRef.current = setTimeout(async () => {
        authLogger.debug('Executing scheduled token refresh');
        await performTokenRefresh();
      }, refreshTime);

    } catch (error) {
      authLogger.error('Token refresh scheduling failed', error);
    }
  }, [calculateRefreshTime]);

  const performTokenRefresh = async () => {
    if (isRefreshingRef.current) {
      authLogger.debug('Refresh already in progress, skipping duplicate');
      return;
    }
    
    isRefreshingRef.current = true;
    
    try {
      authLogger.info('Initiating token refresh...');
      const startTime = performance.now();
      
      const success = await refreshAccessToken();
      const duration = performance.now() - startTime;
      
      if (success) {
        authLogger.auth('Token refreshed successfully', {
          duration: `${duration.toFixed(2)}ms`,
          retryCount: retryCountRef.current
        });
        
        retryCountRef.current = 0; // Reset retry counter on success
        
        // Reschedule next refresh
        setTimeout(() => {
          authLogger.debug('Rescheduling next refresh after successful refresh');
          scheduleTokenRefresh();
        }, 1000);
        
      } else {
        authLogger.warn('Token refresh failed (no success)', {
          duration: `${duration.toFixed(2)}ms`,
          retryCount: retryCountRef.current + 1
        });
        
        // Exponential backoff for failed refreshes
        retryCountRef.current++;
        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // Max 30 seconds
        
        authLogger.info(`Scheduling retry with exponential backoff`, {
          backoffSeconds: Math.round(backoffTime / 1000),
          retryCount: retryCountRef.current
        });
        
        setTimeout(() => scheduleTokenRefresh(), backoffTime);
      }
      
    } catch (error) {
      authLogger.error('Token refresh operation failed with error', error, {
        retryCount: retryCountRef.current + 1
      });
      
      retryCountRef.current++;
      const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      
      authLogger.info(`Scheduling retry after error`, {
        backoffSeconds: Math.round(backoffTime / 1000),
        retryCount: retryCountRef.current
      });
      
      setTimeout(() => scheduleTokenRefresh(), backoffTime);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const checkAndRefreshIfNeeded = useCallback(async () => {
    try {
      authLogger.debug('Checking if token refresh is needed...');
      const expiryInfo = getTokenExpiryInfo();
      
      if (expiryInfo?.shouldRefresh) {
        authLogger.warn('Token requires immediate refresh', {
          timeUntilExpiry: expiryInfo.timeUntilExpiry,
          isExpired: expiryInfo.isValid
        });
        
        await performTokenRefresh();
        return;
      }

      // If no expiry info but we have session, schedule refresh
      if (!expiryInfo) {
        const sessionInfo = await checkSession();
        if (sessionInfo?.hasRefreshToken) {
          authLogger.info('Valid session found, scheduling refresh');
          await scheduleTokenRefresh();
        } else {
          authLogger.debug('No valid session found, not scheduling refresh');
        }
      } else {
        authLogger.debug('Token does not need immediate refresh', {
          timeUntilExpiry: expiryInfo.timeUntilExpiry,
          shouldRefresh: expiryInfo.shouldRefresh
        });
      }
    } catch (error) {
      authLogger.error('Session check failed', error);
    }
  }, [checkSession, scheduleTokenRefresh, getTokenExpiryInfo, performTokenRefresh]);

  useEffect(() => {
    authLogger.info('useSilentAuth hook initialized');
    
    // Initial check
    checkAndRefreshIfNeeded();

    // Safety check every 5 minutes
    intervalRef.current = setInterval(() => {
      authLogger.debug('Performing scheduled token health check');
      checkAndRefreshIfNeeded();
    }, 5 * 60 * 1000);

    // Refresh when tab becomes visible (if needed)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        authLogger.debug('Tab became visible, checking token status');
        setTimeout(() => checkAndRefreshIfNeeded(), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token_expiry' || e.key?.includes('auth-storage')) {
        authLogger.debug('Auth storage changed, syncing across tabs', {
          changedKey: e.key,
          newValue: e.newValue?.substring(0, 50) + '...' // Log truncated value
        });
        
        setTimeout(() => checkAndRefreshIfNeeded(), 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      authLogger.info('useSilentAuth hook cleaning up...');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        authLogger.debug('Cleared refresh timeout');
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        authLogger.debug('Cleared interval checker');
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAndRefreshIfNeeded]);

  return null; // This is a hook, doesn't render anything
}