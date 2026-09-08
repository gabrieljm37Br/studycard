import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import '../services/i18n';
import { changeLanguage } from '../services/i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

describe('LanguageSwitcher Component', () => {
    beforeEach(async () => {
        localStorage.clear();
        await changeLanguage('pt');
    });

    it('deve renderizar o botão com o idioma ativo (PT)', () => {
        render(<LanguageSwitcher />);
        const button = screen.getByRole('button', { name: /selecionar idioma/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('PT');
    });

    it('deve abrir o menu ao clicar no botão do switcher', () => {
        render(<LanguageSwitcher />);
        const button = screen.getByRole('button', { name: /selecionar idioma/i });
        
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        fireEvent.click(button);
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        // Deve exibir as três opções de idioma
        expect(screen.getByRole('option', { name: /português/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /inglês|english/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /espanhol|español/i })).toBeInTheDocument();
    });

    it('deve alternar para Inglês ao clicar na opção English', async () => {
        render(<LanguageSwitcher />);
        const button = screen.getByRole('button', { name: /selecionar idioma/i });
        fireEvent.click(button);

        const enOption = screen.getByRole('option', { name: /inglês|english/i });
        fireEvent.click(enOption);

        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            expect(button).toHaveTextContent('EN');
        });
        expect(localStorage.getItem('studycard_language')).toBe('en');

        // Resetar para PT
        await changeLanguage('pt');
    });

    it('deve fechar o dropdown ao pressionar a tecla Escape', () => {
        render(<LanguageSwitcher />);
        const button = screen.getByRole('button', { name: /selecionar idioma/i });
        fireEvent.click(button);

        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('deve fechar o dropdown ao clicar fora do componente', () => {
        render(
            <div>
                <div data-testid="outside">Fora</div>
                <LanguageSwitcher />
            </div>
        );
        const button = screen.getByRole('button', { name: /selecionar idioma/i });
        fireEvent.click(button);

        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
