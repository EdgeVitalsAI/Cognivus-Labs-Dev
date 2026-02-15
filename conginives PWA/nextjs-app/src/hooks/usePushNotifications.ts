'use client';

import { useState, useEffect, useCallback } from 'react';

interface PushSubscriptionState {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscription: PushSubscription | null;
  isLoading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    permission: 'unsupported',
    subscription: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'PushManager' in window && 'serviceWorker' in navigator;
      const permission = 'Notification' in window ? Notification.permission : 'unsupported';

      let subscription = null;
      if (isSupported) {
        try {
          const registration = await navigator.serviceWorker.ready;
          subscription = await registration.pushManager.getSubscription();
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }

      setState({
        isSupported,
        permission,
        subscription,
        isLoading: false,
      });
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    setState((prev) => ({ ...prev, permission }));
    return permission === 'granted';
  }, []);

  const subscribe = useCallback(async (vapidPublicKey: string): Promise<PushSubscription | null> => {
    if (!state.isSupported) {
      throw new Error('Push notifications not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      setState((prev) => ({ ...prev, subscription }));
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  }, [state.isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return false;
    }

    try {
      await state.subscription.unsubscribe();
      
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: state.subscription.toJSON() }),
      });

      setState((prev) => ({ ...prev, subscription: null }));
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }, [state.subscription]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      type ExtendedNotificationOptions = NotificationOptions & { vibrate?: number[] };
      const notificationOptions: ExtendedNotificationOptions = {
        icon: '/icons/icon-512x512.svg',
        badge: '/icons/icon-512x512.svg',
        vibrate: [200, 100, 200],
        ...options,
      };

      await registration.showNotification(title, notificationOptions);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, [state.permission]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
