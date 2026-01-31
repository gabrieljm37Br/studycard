import { useEffect } from 'react';
import { renderMathInElement } from '@/utils/mathRender';
import { useLocation } from 'react-router-dom';

/**
 * Hook para re-renderizar fórmulas (KaTeX) em um container sempre que:
 * - as dependências informadas mudam,
 * - a rota atual muda,
 * - a aba volta a ficar visível.
 */
export function useMathRender(ref: React.RefObject<HTMLElement>, deps: any[] = []) {
    const location = useLocation();

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const raf = requestAnimationFrame(() => renderMathInElement(el));
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const raf = requestAnimationFrame(() => renderMathInElement(el));
        return () => cancelAnimationFrame(raf);
    }, [location.pathname]);

    useEffect(() => {
        const handler = () => {
            if (document.visibilityState === 'visible') {
                const el = ref.current;
                if (!el) return;
                requestAnimationFrame(() => renderMathInElement(el));
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, []);
}
