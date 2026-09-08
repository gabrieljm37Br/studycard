import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import * as offlineSyncService from '../services/offlineSyncService';

describe('useOfflineSync Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve inicializar com estado online e buscar contagem inicial de pendências', async () => {
        vi.spyOn(offlineSyncService, 'isOnline').mockReturnValue(true);
        vi.spyOn(offlineSyncService, 'getPendingSyncCount').mockResolvedValue(3);

        const { result } = renderHook(() => useOfflineSync());

        expect(result.current.isOnline).toBe(true);
        expect(result.current.isSyncing).toBe(false);

        await act(async () => {
            // aguardar useEffect de inicialização
        });

        expect(result.current.pendingCount).toBe(3);
    });

    it('deve tratar erro ao carregar contagem de pendências fallback para 0', async () => {
        vi.spyOn(offlineSyncService, 'isOnline').mockReturnValue(true);
        vi.spyOn(offlineSyncService, 'getPendingSyncCount').mockRejectedValue(new Error('IndexedDB error'));

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            // aguardar useEffect
        });

        expect(result.current.pendingCount).toBe(0);
    });

    it('deve atualizar status ao disparar evento offline na janela', async () => {
        vi.spyOn(offlineSyncService, 'isOnline').mockReturnValue(true);
        vi.spyOn(offlineSyncService, 'getPendingSyncCount').mockResolvedValue(2);

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            window.dispatchEvent(new Event('offline'));
        });

        expect(result.current.isOnline).toBe(false);
    });

    it('deve sincronizar automaticamente ao retornar conectividade (evento online)', async () => {
        vi.spyOn(offlineSyncService, 'isOnline').mockReturnValue(true);
        const syncSpy = vi.spyOn(offlineSyncService, 'syncPendingQueue').mockResolvedValue({ synced: 2, failed: 0 });
        vi.spyOn(offlineSyncService, 'getPendingSyncCount').mockResolvedValue(0);

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOnline).toBe(true);
        expect(syncSpy).toHaveBeenCalled();
    });

    it('syncNow não deve executar sincronização se estiver offline', async () => {
        vi.spyOn(offlineSyncService, 'isOnline').mockReturnValue(false);
        const syncSpy = vi.spyOn(offlineSyncService, 'syncPendingQueue');

        const { result } = renderHook(() => useOfflineSync());

        let syncResult = { synced: -1, failed: -1 };
        await act(async () => {
            syncResult = await result.current.syncNow();
        });

        expect(syncResult).toEqual({ synced: 0, failed: 0 });
        expect(syncSpy).not.toHaveBeenCalled();
    });

    it('syncNow deve sincronizar e atualizar contador quando online', async () => {
        vi.spyOn(offlineSyncService, 'isOnline').mockReturnValue(true);
        const syncSpy = vi.spyOn(offlineSyncService, 'syncPendingQueue').mockResolvedValue({ synced: 4, failed: 0 });
        const countSpy = vi.spyOn(offlineSyncService, 'getPendingSyncCount').mockResolvedValue(0);

        const { result } = renderHook(() => useOfflineSync());

        let syncResult = { synced: 0, failed: 0 };
        await act(async () => {
            syncResult = await result.current.syncNow();
        });

        expect(syncResult).toEqual({ synced: 4, failed: 0 });
        expect(syncSpy).toHaveBeenCalled();
        expect(countSpy).toHaveBeenCalled();
        expect(result.current.pendingCount).toBe(0);
        expect(result.current.isSyncing).toBe(false);
    });
});
