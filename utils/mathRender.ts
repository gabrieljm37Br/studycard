import { render as renderKatex } from 'katex';

/**
 * Renderiza todos os spans com data-latex dentro de root.
 * - Aplica displayMode quando data-type="block-math".
 * - Garante fallback de texto para o caso do KaTeX falhar.
 */
export function renderMathInElement(root: HTMLElement) {
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>('span[data-latex], span[data-type="inline-math"], span[data-type="block-math"]');
    nodes.forEach(node => {
        const latex = node.getAttribute('data-latex') || node.textContent || '';
        if (!latex) return;
        node.textContent = latex; // fallback visível
        try {
            renderKatex(latex, node, {
                throwOnError: false,
                displayMode: node.getAttribute('data-type') === 'block-math',
                errorColor: '#dc2626'
            });
        } catch (err) {
            console.error('KaTeX render error:', err);
            node.innerHTML = `<span class="katex-error text-red-600 dark:text-red-400 font-mono text-xs px-1.5 py-0.5 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800" title="Erro de sintaxe LaTeX">${latex}</span>`;
        }
    });
}
