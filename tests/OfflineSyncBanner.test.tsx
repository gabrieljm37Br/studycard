import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineSyncBanner } from '../components/OfflineSyncBanner';
import * as offlineHooks from '../hooks/useOfflineSync';

describe('OfflineSyncBanner - Banner de Status de Conectividade', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não deve renderizar nada quando o usuário estiver online e sem pendências', () => {
        vi.spyOn(offlineHooks, 'useOfflineSync').mockReturnValue({
            isOnline: true,
            pendingCount: 0,
            isSyncing: false,
            syncNow: vi.fn()
        });

        const { container } = render(<OfflineSyncBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('deve exibir mensagem de Modo Offline Ativo quando desconectado', () => {
        vi.spyOn(offlineHooks, 'useOfflineSync').mockReturnValue({
            isOnline: false,
            pendingCount: 3,
            isSyncing: false,
            syncNow: vi.fn()
        });

        render(<OfflineSyncBanner />);

        expect(screen.getByText(/Modo Offline Ativo:/i)).toBeDefined();
        expect(screen.getByText(/3 revisões pendentes/i)).toBeDefined();
    });

    it('deve exibir indicador de sincronização em andamento', () => {
        vi.spyOn(offlineHooks, 'useOfflineSync').mockReturnValue({
            isOnline: true,
            pendingCount: 5,
            isSyncing: true,
            syncNow: vi.fn()
        });

        render(<OfflineSyncBanner />);

        expect(screen.getByText(/Sincronizando 5 revisões locais com a nuvem/i)).toBeDefined();
    });

    it('deve fornecer botão "Sincronizar agora" quando reconectado com pendências', () => {
        const syncNowMock = vi.fn();
        vi.spyOn(offlineHooks, 'useOfflineSync').mockReturnValue({
            isOnline: true,
            pendingCount: 2,
            isSyncing: false,
            syncNow: syncNowMock
        });

        render(<OfflineSyncBanner />);

        const syncButton = screen.getByRole('button', { name: /Sincronizar agora/i });
        expect(syncButton).toBeDefined();

        fireEvent.click(syncButton);
        expect(syncNowMock).toHaveBeenCalled();
    });
});
