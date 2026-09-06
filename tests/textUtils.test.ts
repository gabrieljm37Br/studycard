import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  ensureMathDataType,
  renderHTML,
  isSafeLinkUrl,
  isSafeImageUrl,
  isSafeCssStyle
} from '../utils/textUtils';

describe('textUtils', () => {
  describe('sanitizeHTML', () => {
    it('deve remover tags perigosas como <script> e <iframe>', () => {
      const malicious = '<p>Texto seguro</p><script>alert("hack")</script><iframe src="x"></iframe>';
      const clean = sanitizeHTML(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<iframe>');
      expect(clean).toContain('Texto seguro');
    });

    it('deve remover manipuladores de evento on* (onclick, onload, etc.)', () => {
      const malicious = '<b onclick="doSomething()" onmouseover="alert(1)">Clique aqui</b>';
      const clean = sanitizeHTML(malicious);
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('onmouseover');
      expect(clean).toContain('Clique aqui');
    });

    it('deve preservar tags e atributos permitidos como <b>, <i>, <code>, <span>', () => {
      const safe = '<p>Este é um <b>texto em negrito</b> e <i>itálico</i> com <code>código</code>.</p>';
      const clean = sanitizeHTML(safe);
      expect(clean).toContain('<b>texto em negrito</b>');
      expect(clean).toContain('<i>itálico</i>');
      expect(clean).toContain('<code>código</code>');
    });

    it('deve forçar target="_blank" e rel="noopener noreferrer" em links <a> válidos', () => {
      const htmlWithLink = '<a href="https://google.com">Link</a>';
      const clean = sanitizeHTML(htmlWithLink);
      expect(clean).toContain('href="https://google.com"');
      expect(clean).toContain('target="_blank"');
      expect(clean).toContain('rel="noopener noreferrer"');
    });

    // --- TESTES DE SEGURANÇA (SEC-03: XSS) ---

    it('deve neutralizar links com esquema javascript: e vbscript:', () => {
      const maliciousJs = '<a href="javascript:alert(document.cookie)">Clique aqui</a>';
      const maliciousVb = '<a href="vbscript:msgbox(1)">Clique aqui</a>';
      
      const cleanJs = sanitizeHTML(maliciousJs);
      const cleanVb = sanitizeHTML(maliciousVb);

      expect(cleanJs).not.toContain('href');
      expect(cleanJs).toContain('Clique aqui');

      expect(cleanVb).not.toContain('href');
      expect(cleanVb).toContain('Clique aqui');
    });

    it('deve neutralizar links com esquema data:text/html', () => {
      const maliciousData = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Link malicioso</a>';
      const clean = sanitizeHTML(maliciousData);
      expect(clean).not.toContain('href');
      expect(clean).toContain('Link malicioso');
    });

    it('deve remover imagens com esquema javascript: ou SVG em data: URI', () => {
      const xssImgJs = '<img src="javascript:alert(1)" alt="xss" />';
      const xssImgSvg = '<img src="data:image/svg+xml;utf8,<svg onload=alert(1)>" alt="svg" />';
      
      const cleanJs = sanitizeHTML(xssImgJs);
      const cleanSvg = sanitizeHTML(xssImgSvg);

      expect(cleanJs).not.toContain('<img');
      expect(cleanSvg).not.toContain('<img');
    });

    it('deve permitir imagens com URLs HTTP/HTTPS e imagens base64 legítimas', () => {
      const safeHttpImg = '<img src="https://example.com/logo.png" alt="Logo" />';
      const safeDataImg = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" alt="Pixel" />';
      
      const cleanHttp = sanitizeHTML(safeHttpImg);
      const cleanData = sanitizeHTML(safeDataImg);

      expect(cleanHttp).toContain('src="https://example.com/logo.png"');
      expect(cleanData).toContain('src="data:image/png;base64,');
    });

    it('deve remover estilos inline que contenham CSS injection perigoso', () => {
      const leakStyle = '<span style="background: url(\'https://attacker.com/leak\'); color: blue;">Texto</span>';
      const posStyle = '<span style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;">Fake overlay</span>';
      
      const cleanLeak = sanitizeHTML(leakStyle);
      const cleanPos = sanitizeHTML(posStyle);

      expect(cleanLeak).not.toContain('style');
      expect(cleanLeak).toContain('Texto');

      expect(cleanPos).not.toContain('style');
      expect(cleanPos).toContain('Fake overlay');
    });

    it('deve preservar estilos inline inofensivos (cores, fontes)', () => {
      const safeStyle = '<span style="color: red; font-weight: bold;">Importante</span>';
      const clean = sanitizeHTML(safeStyle);
      expect(clean).toContain('style="color: red; font-weight: bold;"');
    });
  });

  describe('validadores individuais de URL e CSS', () => {
    it('isSafeLinkUrl valida esquemas autorizados e rejeita perigosos', () => {
      expect(isSafeLinkUrl('https://example.com')).toBe(true);
      expect(isSafeLinkUrl('http://example.com')).toBe(true);
      expect(isSafeLinkUrl('mailto:suporte@studycard.app')).toBe(true);
      expect(isSafeLinkUrl('/deck/123')).toBe(true);
      expect(isSafeLinkUrl('#top')).toBe(true);

      expect(isSafeLinkUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeLinkUrl('  JAVASCRIPT:alert(1)')).toBe(false);
      expect(isSafeLinkUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeLinkUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeLinkUrl('//attacker.com/fake')).toBe(false);
      expect(isSafeLinkUrl('')).toBe(false);
      expect(isSafeLinkUrl(null)).toBe(false);
    });

    it('isSafeImageUrl aceita URLs seguras e rejeita SVGs e scripts', () => {
      expect(isSafeImageUrl('https://example.com/pic.jpg')).toBe(true);
      expect(isSafeImageUrl('/assets/icon.png')).toBe(true);
      expect(isSafeImageUrl('data:image/png;base64,ABCD')).toBe(true);

      expect(isSafeImageUrl('data:image/svg+xml;utf8,<svg>')).toBe(false);
      expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeImageUrl('//attacker.com/leak')).toBe(false);
      expect(isSafeImageUrl('')).toBe(false);
    });

    it('isSafeCssStyle bloqueia ataques clássicos de injeção CSS', () => {
      expect(isSafeCssStyle('color: green; background-color: #f0f0f0')).toBe(true);
      expect(isSafeCssStyle('font-size: 16px')).toBe(true);

      expect(isSafeCssStyle('background: url("https://evil.com")')).toBe(false);
      expect(isSafeCssStyle('width: expression(alert(1))')).toBe(false);
      expect(isSafeCssStyle('position: fixed')).toBe(false);
      expect(isSafeCssStyle('@import "https://evil.com"')).toBe(false);
    });
  });

  describe('ensureMathDataType', () => {
    it('deve adicionar data-type="inline-math" em spans com data-latex sem data-type', () => {
      const input = '<span data-latex="x^2"></span>';
      const output = ensureMathDataType(input);
      expect(output).toContain('data-type="inline-math"');
      expect(output).toContain('data-latex="x^2"');
    });

    it('deve preservar data-type="block-math" se já existir', () => {
      const input = '<span data-latex="\\frac{1}{2}" data-type="block-math"></span>';
      const output = ensureMathDataType(input);
      expect(output).toContain('data-type="block-math"');
    });
  });

  describe('renderHTML', () => {
    it('deve converter delimitadores LaTeX $...$ e $$...$$ para spans com data-latex', () => {
      const input = 'Equação $x + y = z$ e bloco $${E = mc^2}$$';
      const rendered = renderHTML(input);
      expect(rendered.__html).toContain('data-latex="x + y = z"');
      expect(rendered.__html).toContain('data-latex="{E = mc^2}"');
    });

    it('deve tratar strings vazias ou nulas graciosamente', () => {
      expect(renderHTML('').__html).toBe('');
      expect(renderHTML(null).__html).toBe('');
      expect(renderHTML(undefined).__html).toBe('');
    });
  });
});
