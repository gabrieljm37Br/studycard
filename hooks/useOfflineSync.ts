import { useState, useEffect, useCallback } from 'react';
import { isOnline as checkIsOnline, getPendingSyncCount, syncPendingQueue } from '../services/offlineSyncService';

export interface UseOfflineSyncReturn {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    syncNow: () => Promise<{ synced: number; failed: number }>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
    const [isOnline, setIsOnline] = useState<boolean>(checkIsOnline());
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);

    const refreshPendingCount = useCallback(async () => {
        try {
            const count = await getPendingSyncCount();
            setPendingCount(count);
        } catch {
            setPendingCount(0);
        }
    }, []);

    const syncNow = useCallback(async () => {
        if (!checkIsOnline()) {
            return { synced: 0, failed: 0 };
        }

        setIsSyncing(true);
        try {
            const result = await syncPendingQueue();
            await refreshPendingCount();
            return result;
        } finally {
            setIsSyncing(false);
        }
    }, [refreshPendingCount]);

    useEffect(() => {
        refreshPendingCount();

        const handleOnline = async () => {
            setIsOnline(true);
            await syncNow();
        };

        const handleOffline = () => {
            setIsOnline(false);
            refreshPendingCount();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [refreshPendingCount, syncNow]);

    return {
        isOnline,
        pendingCount,
        isSyncing,
        syncNow
    };
}
