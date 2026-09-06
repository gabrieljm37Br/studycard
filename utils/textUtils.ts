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
 * Validação rigorosa de URLs para links <a>.
 * Bloqueia protocolos perigosos como javascript:, vbscript:, data:, etc.
 */
export const isSafeLinkUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // Remove caracteres de controle ASCII e espaços invisíveis
    const normalized = url.trim().replace(/[\x00-\x20\x7F-\x9F\u200B-\u200D\uFEFF]/g, '');

    // Bloqueia expressamente javascript:, vbscript:, data:, etc.
    if (/^(?:javascript|vbscript|data):/i.test(normalized)) {
        return false;
    }

    // Permitir caminhos relativos seguros (/ ou #), impedindo protocol-relative (//)
    if (normalized.startsWith('/') || normalized.startsWith('#')) {
        return !normalized.startsWith('//');
    }

    // Permitir apenas protocolos HTTP, HTTPS e mailto
    try {
        const parsed = new URL(normalized, 'https://studycard.local');
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
    } catch {
        return false;
    }
};

/**
 * Validação rigorosa de URLs para imagens <img>.
 * Bloqueia javascript:, vbscript:, e data:image/svg+xml (vetor conhecido de XSS).
 */
export const isSafeImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const normalized = url.trim().replace(/[\x00-\x20\x7F-\x9F\u200B-\u200D\uFEFF]/g, '');

    if (/^(?:javascript|vbscript):/i.test(normalized)) {
        return false;
    }

    // Permitir imagens estáticas em base64 (PNG, JPEG, WebP, GIF), EXCLUINDO SVG
    if (/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i.test(normalized)) {
        return true;
    }

    // Bloquear qualquer outro data: URI
    if (/^data:/i.test(normalized)) {
        return false;
    }

    if (normalized.startsWith('/') || normalized.startsWith('./')) {
        return !normalized.startsWith('//');
    }

    try {
        const parsed = new URL(normalized, 'https://studycard.local');
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Validação defensiva de estilos inline CSS.
 * Bloqueia exfiltração via url(), expressões, scripts ou posicionamento malicioso.
 */
export const isSafeCssStyle = (style: string | null | undefined): boolean => {
    if (!style) return true;
    const lower = style.toLowerCase();
    if (/(?:url\s*\(|expression\s*\(|javascript\s*:|@import|position\s*:|behavior\s*:|-moz-binding)/i.test(lower)) {
        return false;
    }
    return true;
};

/**
 * Garante que spans com data-latex recebam data-type esperado pelo editor/math renderer.
 * Usa regex pura para evitar modificações inesperadas do DOMParser.
 * - span data-latex sem data-type => data-type="inline-math"
 * - preserva block-math se já existir
 */
export const ensureMathDataType = (html: string | null | undefined): string => {
    if (!html) return '';

    return html.replace(
        /<span\s+data-latex="([^"]*)"(?!\s+data-type)/gi,
        '<span data-latex="$1" data-type="inline-math"'
    );
};

/**
 * Sanitiza HTML removendo tags perigosas, scripts, manipuladores on* e esquemas de URI inseguros.
 * Mantem apenas tags/atributos da allowlist e forca rel/target seguros em links.
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
                continue;
            }

            // Validação estrita de valores para atributos sensíveis
            if (name === 'style' && !isSafeCssStyle(attr.value)) {
                el.removeAttribute(attr.name);
            }
        }

        // Validação e ajuste de segurança para links <a>
        if (tag === 'a') {
            const href = el.getAttribute('href');
            if (!isSafeLinkUrl(href)) {
                // Neutraliza o link caso a URL contenha javascript: ou outro protocolo não autorizado
                el.removeAttribute('href');
            }
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
        }

        // Validação de segurança para imagens <img>
        if (tag === 'img') {
            const src = el.getAttribute('src');
            if (!isSafeImageUrl(src)) {
                nodesToRemove.push(el);
                continue;
            }
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
    const withLatexSpans = processLatexDelimiters(text || '');
    const normalized = ensureMathDataType(withLatexSpans);
    return { __html: sanitizeHTML(normalized) };
};
