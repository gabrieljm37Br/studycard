import React, { Component, ErrorInfo, ReactNode, useEffect, useRef, useMemo } from 'react';
import { renderHTML } from '@/utils/textUtils';
import { renderMathInElement } from '@/utils/mathRender';

interface MathErrorBoundaryProps {
    children: ReactNode;
    fallbackContent?: string;
}

interface MathErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary para isolar falhas de parsing ou renderização de fórmulas KaTeX/LaTeX.
 * Garante que fórmulas malformadas nunca quebrem a tela do flashcard ou a sessão de estudo.
 */
export class MathErrorBoundary extends Component<MathErrorBoundaryProps, MathErrorBoundaryState> {
    constructor(props: MathErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): MathErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('MathErrorBoundary capturou erro ao renderizar fórmula:', error, errorInfo);
    }

    componentDidUpdate(prevProps: MathErrorBoundaryProps) {
        if (prevProps.fallbackContent !== this.props.fallbackContent && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <span
                    data-testid="math-error-fallback"
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-mono"
                    title="Não foi possível processar a fórmula matemática."
                >
                    <span>⚠️</span>
                    <span>{this.props.fallbackContent || '(fórmula indisponível)'}</span>
                </span>
            );
        }

        return this.props.children;
    }
}

export interface MathContentProps {
    content: string;
    className?: string; // Permite estilização externa (ex: 'text-xl font-bold')
    tag?: 'div' | 'span' | 'p' | 'h3'; // Flexibilidade de tag container
}

const MathContentInner: React.FC<MathContentProps> = ({ content, className, tag: Tag = 'div' }) => {
    const rootRef = useRef<HTMLElement>(null);

    // Memoriza o HTML para evitar que o React re-renderize o DOM se o conteúdo for idêntico
    // Isso é CRUCIAL para evitar que o React sobrescreva o LaTeX renderizado
    const sanitizedHtml = useMemo(() => {
        try {
            return renderHTML(content);
        } catch (err) {
            console.error('Erro ao sanitizar HTML em MathContent:', err);
            return { __html: content || '' };
        }
    }, [content]);

    // Aplica o KaTeX após o render do React
    useEffect(() => {
        const el = rootRef.current;
        if (el) {
            requestAnimationFrame(() => {
                try {
                    renderMathInElement(el);
                } catch (err) {
                    console.error('Erro na renderização KaTeX no elemento:', err);
                }
            });
        }
    }, [sanitizedHtml]);

    return (
        <Tag
            ref={rootRef as any}
            className={`math-content ${className || ''}`}
            dangerouslySetInnerHTML={sanitizedHtml}
        />
    );
};

export const MathContent: React.FC<MathContentProps> = (props) => {
    return (
        <MathErrorBoundary fallbackContent={props.content}>
            <MathContentInner {...props} />
        </MathErrorBoundary>
    );
};
