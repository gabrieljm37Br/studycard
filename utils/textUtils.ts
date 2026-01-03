const ALLOWED_TAGS = new Set([
    'b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'span', 'a', 'code', 'pre', 'sub', 'sup', 'mark',
    // Tags para fórmulas matemáticas (KaTeX)
    'annotation', 'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mtext', 'semantics',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
    a: new Set(['href', 'title', 'target', 'rel']),
    span: new Set(['style', 'data-color', 'class', 'data-latex', 'data-type']),
    mark: new Set(['style', 'data-color']),
    // Atributos para elementos matemáticos
    math: new Set(['xmlns']),
    annotation: new Set(['encoding']),
};

/**
 * Sanitiza HTML removendo tags perigosas e atributos inline on*.
 * Mantém apenas tags/atributos da allowlist e força rel/target seguros em links.
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

        // Remover atributos on* e não permitidos
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
 * Helper para dangerouslySetInnerHTML com sanitização defensiva.
 */
export const renderHTML = (text: string | null | undefined) => {
    return { __html: sanitizeHTML(text) };
};
