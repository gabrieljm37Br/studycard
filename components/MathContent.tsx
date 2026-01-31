import React, { useEffect, useRef, useMemo } from 'react';
import { renderHTML } from '@/utils/textUtils';
import { renderMathInElement } from '@/utils/mathRender';

interface MathContentProps {
    content: string;
    className?: string; // Permite estilização externa (ex: 'text-xl font-bold')
    tag?: 'div' | 'span' | 'p' | 'h3'; // Flexibilidade de tag container
}

export const MathContent: React.FC<MathContentProps> = ({ content, className, tag: Tag = 'div' }) => {
    const rootRef = useRef<HTMLElement>(null);

    // Memoriza o HTML para evitar que o React re-renderize o DOM se o conteúdo for idêntico
    // Isso é CRUCIAL para evitar que o React sobrescreva o LaTeX renderizado
    const sanitizedHtml = useMemo(() => renderHTML(content), [content]);

    // Aplica o KaTeX após o render do React
    useEffect(() => {
        const el = rootRef.current;
        if (el) {
            // Pequeno delay para garantir que o DOM esteja pronto em casos complexos,
            // mas geralmente direto funciona. requestAnimationFrame é seguro.
            requestAnimationFrame(() => {
                renderMathInElement(el);
            });
        }
    }, [sanitizedHtml]); // Só roda se o HTML mudar de fato

    return (
        <Tag
            ref={rootRef as any}
            className={`math-content ${className || ''}`}
            dangerouslySetInnerHTML={sanitizedHtml}
        />
    );
};
