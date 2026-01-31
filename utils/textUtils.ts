const ALLOWED_TAGS = new Set([
    'b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'span', 'a', 'code', 'pre', 'sub', 'sup', 'mark', 'img',
    // Tags para formulas matematicas (KaTeX)
    'annotation', 'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mtext', 'semantics',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
    a: new Set(['href', 'title', 'target', 'rel']),
    span: new Set(['style', 'data-color', 'class', 'data-latex', 'data-type']),
    mark: new Set(['style', 'data-color']),
    img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
    // Atributos para elementos matematicos
    math: new Set(['xmlns']),
    annotation: new Set(['encoding']),
};

/**
 * Garante que spans com data-latex recebam data-type esperado pelo editor/math renderer.
 * Usa regex pura para evitar modificações inesperadas do DOMParser.
 * - span data-latex sem data-type => data-type="inline-math"
 * - preserva block-math se já existir
 */
export const ensureMathDataType = (html: string | null | undefined): string => {
    if (!html) return '';

    // Adicionar data-type="inline-math" a spans que têm data-latex mas não têm data-type
    // Regex procura: <span data-latex="..." mas NÃO seguido por data-type
    return html.replace(
        /<span\s+data-latex="([^"]*)"(?!\s+data-type)/gi,
        '<span data-latex="$1" data-type="inline-math"'
    );
};

/**
 * Sanitiza HTML removendo tags perigosas e atributos inline on*.
 * Mantem apenas tags/atributos da allowlist e forcando rel/target seguros em links.
 */
export const sanitizeHTML = (html: string | null | undefined): string => {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null);

    const nodesToRemove: Element[] = [];

    while (walker.nextNode()) {
        const el = walker.currentNode as Element;
        const tag = el.tagName.toLowerCase();

        // Remove tags fora da allowlist ou perigosas
        if (!ALLOWED_TAGS.has(tag)) {
            nodesToRemove.push(el);
            continue;
        }

        // Remover atributos on* e nao permitidos
        for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
                continue;
            }
            const allowedAttrs = ALLOWED_ATTRS[tag];
            if (!allowedAttrs || !allowedAttrs.has(name)) {
                el.removeAttribute(attr.name);
            }
        }

        // Ajustar links para abrir em nova aba com noopener
        if (tag === 'a') {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
        }
    }

    nodesToRemove.forEach(node => node.remove());
    return doc.body.innerHTML;
};

/**
 * Processa delimitadores LaTeX ($...$ e $$...$$) convertendo-os em spans com data-latex.
 * Usa regex pura para evitar modificações inesperadas do DOMParser.
 * Isso garante que expressões matemáticas sejam renderizadas mesmo após navegação entre telas.
 */
const processLatexDelimiters = (text: string): string => {
    if (!text) return '';

    let processed = text;

    // Processar blocos de LaTeX ($$...$$) primeiro para evitar conflitos
    processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
        const trimmed = latex.trim();
        if (!trimmed) return match;
        // Escapar aspas para evitar quebrar o atributo HTML
        const escaped = trimmed.replace(/"/g, '&quot;');
        return `<span data-latex="${escaped}" data-type="block-math"></span>`;
    });

    // Processar LaTeX inline ($...$)
    processed = processed.replace(/\$([^$]+)\$/g, (match, latex) => {
        const trimmed = latex.trim();
        if (!trimmed) return match;
        // Escapar aspas para evitar quebrar o atributo HTML
        const escaped = trimmed.replace(/"/g, '&quot;');
        return `<span data-latex="${escaped}" data-type="inline-math"></span>`;
    });

    return processed;
};

/**
 * Helper para dangerouslySetInnerHTML com sanitizacao defensiva.
 * Processa delimitadores LaTeX antes de sanitizar para garantir renderização correta.
 */
export const renderHTML = (text: string | null | undefined) => {
    // Primeiro, processar delimitadores LaTeX ($...$ e $$...$$)
    const withLatexSpans = processLatexDelimiters(text || '');
    // Garantir data-type para spans math existentes (usando regex, não DOMParser)
    const normalized = ensureMathDataType(withLatexSpans);
    // Sanitizar HTML mantendo spans com data-latex
    return { __html: sanitizeHTML(normalized) };
};
