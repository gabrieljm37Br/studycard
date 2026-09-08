import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export const OfflineSyncBanner: React.FC = () => {
    const { t } = useTranslation('banner');
    const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

    // If online with nothing pending and not syncing, no need to show anything
    if (isOnline && pendingCount === 0 && !isSyncing) {
        return null;
    }

    return (
        <aside
            role="status"
            aria-live="polite"
            className={`
                w-full px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-between flex-wrap gap-2 z-50
                ${!isOnline
                    ? 'bg-amber-500 text-slate-950 dark:bg-amber-600 dark:text-white'
                    : isSyncing
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-600 text-white'
                }
            `}
        >
            <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
                {!isOnline ? (
                    <>
                        <WifiOff size={16} className="shrink-0" />
                        <span>
                            <strong>{t('offlineNoticeStrong', 'Modo Offline Ativo:')}</strong> {t('offlineNotice', 'Você pode continuar estudando normalmente. Suas revisões SM-2 estão seguras localmente no dispositivo.')}
                        </span>
                        {pendingCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/15 text-xs font-bold">
                                {pendingCount} {pendingCount === 1 ? t('pendingReviews_one', 'revisão pendente') : t('pendingReviews_other', 'revisões pendentes')}
                            </span>
                        )}
                    </>
                ) : isSyncing ? (
                    <>
                        <RefreshCw size={16} className="shrink-0 animate-spin" />
                        <span>{t('syncing', 'Sincronizando')} {pendingCount} {t('syncingSuffix', 'revisões locais com a nuvem...')}</span>
                    </>
                ) : (
                    <>
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>{t('reconnected', 'Conexão restabelecida.')} {pendingCount} {t('readyToSend', 'revisões prontas para envio.')}</span>
                    </>
                )}
            </div>

            {isOnline && pendingCount > 0 && !isSyncing && (
                <button
                    onClick={() => syncNow()}
                    className="px-2.5 py-1 bg-white text-emerald-800 rounded font-semibold text-xs hover:bg-emerald-50 transition shadow-sm"
                >
                    {t('syncNow', 'Sincronizar agora')}
                </button>
            )}
        </aside>
    );
};
