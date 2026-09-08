import React from 'react';

export interface HelpSection {
    id: string;
    title: string;
    icon: string;
    description: string;
}

export interface HelpSectionProps {
    copyToClipboard?: (text: string, message?: string) => void;
}

export const HELP_SECTIONS: HelpSection[] = [
    {
        "id": "intro",
        "title": "Introdução",
        "icon": "👋",
        "description": "Visão geral da plataforma StudyCard e seus principais recursos."
    },
    {
        "id": "texto-estruturado",
        "title": "Texto Estruturado (Gerador)",
        "icon": "📝",
        "description": "Prompts para IA e formato para colar texto estruturado no Gerador."
    },
    {
        "id": "criacao",
        "title": "Criação de Flashcards",
        "icon": "✨",
        "description": "Geração por IA (tópico, PDF, resumo, YouTube) e criação manual."
    },
    {
        "id": "importar-csv",
        "title": "Importar CSV",
        "icon": "📥",
        "description": "Estrutura de colunas, exemplos, separadores e formatação para CSV."
    },
    {
        "id": "importar-txt-anki",
        "title": "Importar TXT Anki",
        "icon": "📄",
        "description": "Sintaxe Anki, Cloze deletion, compatibilidade e prompts de conversão."
    },
    {
        "id": "organizacao",
        "title": "Organização de Decks",
        "icon": "📁",
        "description": "Hierarquia de decks e subdecks, edição, tags e busca."
    },
    {
        "id": "estudo",
        "title": "Modo de Estudo",
        "icon": "📚",
        "description": "Sessão de estudo, atalhos de teclado, modos de exibição e avaliação."
    },
    {
        "id": "simulado",
        "title": "Modo Simulado",
        "icon": "🎯",
        "description": "Criação de simulados com tempo, modalidades e validações."
    },
    {
        "id": "srs",
        "title": "Repetição Espaçada (SRS)",
        "icon": "⏳",
        "description": "Algoritmo SuperMemo-2, intervalos, fator de facilidade e curva do esquecimento."
    },
    {
        "id": "calendario",
        "title": "Calendário de Estudo",
        "icon": "📅",
        "description": "Planejamento de revisões SM-2 e tarefas personalizadas por data."
    },
    {
        "id": "estatisticas",
        "title": "Estatísticas e Desempenho",
        "icon": "📊",
        "description": "KPIs de retenção, streak, mapa de calor e previsão de carga."
    },
    {
        "id": "gamificacao",
        "title": "Gamificação",
        "icon": "🏆",
        "description": "Pontuação de XP, cálculo de níveis, streak de dias e conquistas."
    },
    {
        "id": "permissoes",
        "title": "Permissões do Usuário",
        "icon": "🔒",
        "description": "Segurança com Row Level Security (RLS) e privacidade dos dados."
    },
    {
        "id": "dicas",
        "title": "Dicas e Melhores Práticas",
        "icon": "💡",
        "description": "Princípios de formulação de cards, formatação HTML e ergonomia."
    }
];
