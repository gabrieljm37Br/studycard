import { useEffect, useRef } from 'react';
import { renderMathInElement } from '@/utils/mathRender';
import { useLocation } from 'react-router-dom';

/**
 * Hook para re-renderizar fórmulas (KaTeX) em um container.
 * Usa MutationObserver para garantir que o LaTeX persista mesmo após atualizações do React.
 */
export function useMathRender(ref: React.RefObject<HTMLElement>, deps: any[] = []) {
    const location = useLocation();
    const observerRef = useRef<MutationObserver | null>(null);

    // Função central para processar o render
    const updateMath = () => {
        const el = ref.current;
        if (!el) return;

        // requestAnimationFrame para garantir execução suave visualmente
        requestAnimationFrame(() => {
            // Desconecta temporariamente para evitar loop infinito (renderização aciona observer)
            observerRef.current?.disconnect();

            try {
                renderMathInElement(el);
            } finally {
                // Reconecta o observer após a manipulação do DOM
                if (el && observerRef.current) {
                    observerRef.current.observe(el, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                }
            }
        });
    };

    // 1. Configurar MutationObserver na montagem (ou mudança de ref)
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Criar observer
        const observer = new MutationObserver((mutations) => {
            // Verifica se mudanças relevantes ocorreram
            const shouldUpdate = mutations.some(mutation =>
                mutation.type === 'childList' || mutation.type === 'characterData'
            );

            if (shouldUpdate) {
                updateMath();
            }
        });

        observerRef.current = observer;

        // Iniciar observação
        observer.observe(el, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Render inicial
        updateMath();

        return () => {
            observer.disconnect();
            observerRef.current = null;
        };
    }, [ref.current]);

    // 2. Trigger por dependências explícitas (mudança de card, navegação, etc)
    useEffect(() => {
        updateMath();
    }, [location.pathname, ...deps]);

    // 3. Trigger por visibilidade da página
    useEffect(() => {
        const handler = () => {
            if (document.visibilityState === 'visible') {
                updateMath();
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, []);
}
