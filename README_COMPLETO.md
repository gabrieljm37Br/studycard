# 🎓 StudyCard - Guia Completo

## 📋 Índice
1. [Visão Geral](#-visão-geral)
2. [Status Atual](#-status-atual)
3. [Configuração Necessária](#-configuração-necessária)
4. [Como Usar](#-como-usar)
5. [Recursos Disponíveis](#-recursos-disponíveis)
6. [Solução de Problemas](#-solução-de-problemas)

---

## 🎯 Visão Geral

Aplicativo SaaS completo para criar e estudar flashcards usando **Inteligência Artificial**. 

### Tecnologias Utilizadas
- ⚛️ **Frontend**: React + TypeScript + Vite
- 🤖 **IA**: Google Gemini AI (geração de flashcards)
- 🗄️ **Backend**: Supabase (banco de dados + autenticação)
- 🎨 **UI**: Design moderno com gradientes e animações

---

## ✅ Status Atual

### O que está funcionando:
- ✅ Servidor rodando em `http://localhost:3000`
- ✅ Interface do Dashboard carregando
- ✅ Interface do Gerador de Flashcards carregando
- ✅ Autenticação com Supabase
- ✅ Criação de decks e subdecks
- ✅ Sistema de gamificação (XP, níveis, badges, streaks)
- ✅ Código da IA implementado

### O que precisa ser configurado:
- ⚠️ **API do Gemini** - Adicionar chave da API
- ⚠️ **Política de exclusão** - Executar script SQL no Supabase

---

## 🔧 Configuração Necessária

### 1️⃣ Configurar a API do Google Gemini

A IA precisa de uma chave da API para funcionar.

#### Passo a Passo:

1. **Obter a chave da API**:
   - Acesse: https://aistudio.google.com/app/apikey
   - Faça login com sua conta Google
   - Clique em "Create API Key"
   - Copie a chave gerada (começa com `AIza...`)

2. **Adicionar no arquivo `.env.local`**:
   - Abra o arquivo `.env.local` na raiz do projeto
   - Adicione ou edite a linha:
   ```env
   GEMINI_API_KEY=SUA_CHAVE_AQUI
   ```
   - Salve o arquivo

3. **Reiniciar o servidor**:
   - Pressione `Ctrl+C` no terminal
   - Execute novamente: `npm run dev`

> 💡 **Dica**: O Gemini tem um plano gratuito generoso (15 req/min, 1.500 req/dia)

📖 **Guia detalhado**: Veja `GUIA_CONFIGURACAO_AI.md`

---

### 2️⃣ Habilitar Exclusão de Decks e Flashcards

Atualmente, você não consegue excluir decks/flashcards por falta de uma política de segurança no banco.

#### Passo a Passo:

1. **Acesse o Supabase**:
   - Vá para: https://supabase.com/dashboard/project/ixpkbgmrqftmokdyydsl

2. **Abra o SQL Editor**:
   - Menu lateral → "SQL Editor"
   - Clique em "New Query"

3. **Execute o script**:
   - Abra o arquivo `fix_delete_policy.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em "Run" (ou `Ctrl+Enter`)

4. **Aguarde a confirmação** ✅

📖 **Guia detalhado**: Veja `LEIA-ME_EXCLUSAO_DECKS.md`

---

## 🚀 Como Usar

### Iniciar o Aplicativo

```powershell
# Instalar dependências (primeira vez)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em: **http://localhost:3000**

---

### Fluxo de Uso

#### 1. **Login/Cadastro**
- Acesse `http://localhost:3000/login`
- Crie uma conta ou faça login

#### 2. **Dashboard**
- Visualize seus decks
- Veja suas conquistas (badges)
- Acompanhe seu progresso (XP, nível, streak)

#### 3. **Criar Decks**
- No Dashboard, digite o nome do deck
- Clique em "Criar"
- Você pode criar subdecks clicando em um deck

#### 4. **Gerar Flashcards com IA**

![Interface do Gerador](C:/Users/Gabriel/.gemini/antigravity/brain/d7709733-6e7d-44ff-9325-5fbe05f64992/generator_page_1763655809392.png)

**Opções de entrada**:

- **🔍 Tópico**: Digite um assunto (ex: "Fotossíntese")
  - A IA pesquisa e cria flashcards sobre o tema

- **📝 Texto**: Cole qualquer texto
  - A IA extrai conceitos e cria flashcards

- **📄 PDF**: Faça upload de um arquivo PDF
  - A IA analisa o conteúdo e cria flashcards

**Tipos de flashcards**:

1. **Pergunta e Resposta** - Formato clássico
2. **Verdadeiro ou Falso** - Com explicação
3. **Múltipla Escolha** - 4 opções + explicação
4. **Exemplo Prático** - Usa Google Search para encontrar aplicações reais

#### 5. **Estudar**
- No Dashboard, clique em "📚 Estudar" em um deck
- Responda as perguntas
- Ganhe XP e badges!

#### 6. **Gerenciar Flashcards**
- Clique em "⚙️ Gerenciar" em um deck
- Visualize todos os flashcards
- Exclua flashcards individuais (após configurar o SQL)

#### 7. **Excluir Decks**
- No Dashboard, clique em "Excluir" no canto superior direito do card
- Confirme a exclusão (após configurar o SQL)

---

## 🎮 Recursos Disponíveis

### Sistema de Gamificação

- **🏆 XP (Experiência)**:
  - Ganhe XP ao estudar flashcards
  - Respostas corretas = mais XP

- **📊 Níveis**:
  - Suba de nível conforme ganha XP
  - Cada nível requer mais XP

- **🔥 Streak (Sequência)**:
  - Estude todos os dias para manter sua sequência
  - Visível no header do Dashboard

- **🎖️ Badges (Conquistas)**:
  - Desbloqueie badges ao atingir marcos
  - Exemplos: "Primeira Vitória", "Estudioso", etc.

### Organização

- **📁 Decks e Subdecks**:
  - Organize flashcards hierarquicamente
  - Navegação por breadcrumbs

- **🎯 Tipos de Flashcards**:
  - 4 formatos diferentes
  - Cada um otimizado para diferentes tipos de conteúdo

### Geração com IA

- **🤖 Google Gemini 2.5 Flash**:
  - Modelo de IA de última geração
  - Rápido e preciso

- **🔍 Google Search Integration**:
  - Modo "Exemplo Prático" usa pesquisa web
  - Encontra aplicações reais dos conceitos

---

## 🐛 Solução de Problemas

### Servidor não inicia

**Erro**: `npm run dev` não funciona

**Solução**:
```powershell
# Reinstalar dependências
rm -r node_modules
npm install
npm run dev
```

---

### Não consigo gerar flashcards

**Erro**: "A variável de ambiente API_KEY não está definida"

**Solução**:
1. Verifique se `GEMINI_API_KEY` está no `.env.local`
2. Reinicie o servidor (`Ctrl+C` e `npm run dev`)

**Erro**: "Não foi possível gerar os flashcards"

**Possíveis causas**:
- Chave da API inválida
- Limite de requisições excedido
- Texto muito curto
- Sem conexão com internet

**Solução**:
- Verifique a chave no Google AI Studio
- Aguarde alguns minutos
- Tente com texto mais longo

---

### Não consigo excluir decks/flashcards

**Erro**: Botão "Excluir" não funciona

**Solução**:
1. Execute o script `fix_delete_policy.sql` no Supabase
2. Veja instruções em `LEIA-ME_EXCLUSAO_DECKS.md`

---

### Página em branco ou erro 404

**Problema**: Página não carrega

**Solução**:
1. Verifique se o servidor está rodando
2. Acesse `http://localhost:3000/login` primeiro
3. Limpe o cache do navegador (`Ctrl+Shift+Delete`)

---

## 📁 Estrutura do Projeto

```
gerador-de-flashcards-ai/
├── pages/                    # Páginas da aplicação
│   ├── Dashboard.tsx         # Página principal (lista de decks)
│   ├── DeckDetails.tsx       # Gerenciar flashcards de um deck
│   ├── Generator.tsx         # Gerador de flashcards com IA
│   ├── Login.tsx             # Autenticação
│   └── Study.tsx             # Modo de estudo
├── services/                 # Serviços externos
│   ├── geminiService.ts      # Integração com Google Gemini AI
│   └── supabaseClient.ts     # Cliente do Supabase
├── contexts/                 # Contextos React
│   └── AuthContext.tsx       # Contexto de autenticação
├── components/               # Componentes reutilizáveis
├── .env.local                # Variáveis de ambiente (NÃO COMMITAR!)
├── .env.local.example        # Exemplo de configuração
├── fix_delete_policy.sql     # Script SQL para habilitar exclusão
├── supabase_schema.sql       # Schema completo do banco
├── gamification_schema.sql   # Schema de gamificação
├── GUIA_CONFIGURACAO_AI.md   # Guia detalhado da IA
├── LEIA-ME_EXCLUSAO_DECKS.md # Guia de exclusão
└── README_COMPLETO.md        # Este arquivo
```

---

## 🔒 Segurança

### Variáveis de Ambiente

- ✅ `.env.local` está no `.gitignore`
- ✅ Chaves da API não são expostas no código
- ❌ **NUNCA** faça commit do `.env.local`
- ❌ **NUNCA** compartilhe suas chaves publicamente

### Row Level Security (RLS)

O Supabase usa RLS para proteger seus dados:
- Cada usuário só vê seus próprios decks/flashcards
- Políticas de segurança impedem acesso não autorizado

---

## 📚 Recursos Adicionais

### Documentação

- **Google Gemini**: https://ai.google.dev/docs
- **Supabase**: https://supabase.com/docs
- **React**: https://react.dev
- **Vite**: https://vitejs.dev

### Links Úteis

- **Google AI Studio**: https://aistudio.google.com/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ixpkbgmrqftmokdyydsl
- **Preços Gemini**: https://ai.google.dev/pricing

---

## 🎯 Próximos Passos

1. ✅ Configure a API do Gemini (`GUIA_CONFIGURACAO_AI.md`)
2. ✅ Execute o script SQL (`fix_delete_policy.sql`)
3. ✅ Teste a geração de flashcards
4. ✅ Explore os diferentes tipos de flashcards
5. ✅ Comece a estudar e ganhar XP! 📚

---

## 💡 Dicas de Uso

### Para melhores resultados com a IA:

- **Texto claro e estruturado**: A IA funciona melhor com textos bem formatados
- **Tamanho adequado**: Nem muito curto (< 100 palavras) nem muito longo (> 5000 palavras)
- **Tópicos específicos**: "Ciclo de Krebs" é melhor que "Biologia"
- **PDFs com texto**: PDFs escaneados (imagens) não funcionam bem

### Para estudar melhor:

- **Estude diariamente**: Mantenha seu streak ativo
- **Misture tipos**: Use diferentes formatos de flashcards
- **Revise regularmente**: Flashcards marcados como "incorretos" aparecem mais
- **Organize bem**: Use decks e subdecks para categorizar

---

## ❓ Suporte

Se encontrar problemas:

1. Verifique os logs do console (F12 no navegador)
2. Verifique o terminal onde o servidor está rodando
3. Consulte a seção "Solução de Problemas" acima
4. Revise os guias específicos (`GUIA_CONFIGURACAO_AI.md`, `LEIA-ME_EXCLUSAO_DECKS.md`)

---

**Desenvolvido com ❤️ usando React, TypeScript, Google Gemini AI e Supabase**
