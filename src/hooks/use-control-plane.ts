'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useControlPlane() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  const fetchControlPlaneStatus = async () => {
    try {
      const response = await fetch('/api/admin/control-plane');
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled);
      } else {
        // If not authenticated or other error, default to false
        setEnabled(false);
      }
    } catch (error) {
      console.error('Error fetching control plane status:', error);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have a session
    if (status === 'loading') return;
    if (!session) {
      setEnabled(false);
      setLoading(false);
      return;
    }

    fetchControlPlaneStatus();
  }, [session, status]);

  // Listen for control plane changes from other components
  useEffect(() => {
    const handleControlPlaneChange = () => {
      fetchControlPlaneStatus();
    };

    window.addEventListener('controlPlaneChanged', handleControlPlaneChange);
    return () => {
      window.removeEventListener(
        'controlPlaneChanged',
        handleControlPlaneChange
      );
    };
  }, []);

  // Add a refresh function that can be called when the toggle changes
  const refresh = () => {
    setLoading(true);
    fetchControlPlaneStatus();
  };

  return { enabled, loading, refresh };
}
