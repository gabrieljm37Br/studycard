import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Help from '../pages/Help';

describe('Help Page - Otimização, Navegação e Modularidade', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.location.hash = '';
        window.scrollTo = vi.fn();
    });

    it('deve renderizar a tela de ajuda com o tópico inicial "Introdução"', () => {
        render(
            <MemoryRouter>
                <Help />
            </MemoryRouter>
        );

        // Header geral
        expect(screen.getByText(/Central de Ajuda & Documentação/i)).toBeDefined();
        // Indicador de tópico atual
        expect(screen.getByText(/Tópico 1 de/i)).toBeDefined();
        // Tab ativa
        const activeTab = screen.getByRole('tab', { selected: true });
        expect(activeTab.textContent).toContain('Introdução');
        // Conteúdo da introdução
        expect(screen.getByText(/Geração automática de flashcards usando IA/i)).toBeDefined();
    });

    it('deve alternar a seção ativa ao clicar em um item da navegação lateral', () => {
        render(
            <MemoryRouter>
                <Help />
            </MemoryRouter>
        );

        // Clicar em "Importar CSV" no menu lateral
        const csvBtn = screen.getByRole('tab', { name: /Importar CSV/i });
        fireEvent.click(csvBtn);

        // Aba agora deve estar selecionada
        expect(csvBtn.getAttribute('aria-selected')).toBe('true');
        // Conteúdo da seção CSV deve estar no documento
        expect(screen.getByText(/O que é a Importação CSV?/i)).toBeDefined();
        expect(screen.getByText(/Formato do Arquivo CSV/i)).toBeDefined();
    });

    it('deve filtrar os tópicos do menu lateral ao digitar na caixa de busca', () => {
        render(
            <MemoryRouter>
                <Help />
            </MemoryRouter>
        );

        const searchInput = screen.getByPlaceholderText(/Buscar tópico ou guia/i);
        fireEvent.change(searchInput, { target: { value: 'anki' } });

        // Apenas tópicos relacionados devem permanecer no menu
        expect(screen.getByRole('tab', { name: /Importar TXT Anki/i })).toBeDefined();
        expect(screen.queryByRole('tab', { name: /Gamificação/i })).toBeNull();
    });

    it('deve navegar sequencialmente usando os botões de paginação Próximo e Anterior', () => {
        render(
            <MemoryRouter>
                <Help />
            </MemoryRouter>
        );

        // Tópico inicial é 1 (Introdução). Clicar no botão 'Próximo'
        const nextButton = screen.getByRole('button', { name: /Próximo/i });
        fireEvent.click(nextButton);

        // Deve navegar para o segundo tópico
        expect(screen.getByText(/Tópico 2 de/i)).toBeDefined();
        const activeTab = screen.getByRole('tab', { selected: true });
        expect(activeTab.textContent).toContain('Texto Estruturado');

        // Clicar no botão 'Anterior'
        const prevButton = screen.getByRole('button', { name: /Anterior/i });
        fireEvent.click(prevButton);

        // Deve retornar para Introdução
        expect(screen.getByText(/Tópico 1 de/i)).toBeDefined();
    });

    it('deve respeitar a URL hash inicial para carregar seção diretamente', () => {
        window.location.hash = '#simulado';

        render(
            <MemoryRouter>
                <Help />
            </MemoryRouter>
        );

        // Deve iniciar com tab Modo Simulado ativa e renderizar seu conteúdo
        const activeTab = screen.getByRole('tab', { selected: true });
        expect(activeTab.textContent).toContain('Modo Simulado');
        expect(screen.getByText(/Como criar um simulado/i)).toBeDefined();
    });

    it('deve copiar prompts ou textos quando acionado e invocar alerta', () => {
        const alertMock = vi.fn();
        window.alert = alertMock;
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock
            }
        });

        // Abrir seção com botões de cópia (Texto Estruturado)
        window.location.hash = '#texto-estruturado';

        render(
            <MemoryRouter>
                <Help />
            </MemoryRouter>
        );

        const copyButtons = screen.getAllByRole('button', { name: /Copiar/i });
        expect(copyButtons.length).toBeGreaterThan(0);

        fireEvent.click(copyButtons[0]);
        expect(writeTextMock).toHaveBeenCalled();
        expect(alertMock).toHaveBeenCalled();
    });
});
