# 🤖 Guia de Configuração da IA (Google Gemini)

## 📋 Visão Geral

Seu aplicativo usa o **Google Gemini AI** para gerar flashcards automaticamente a partir de:
- 🔍 **Tópicos** - Digite um assunto e a IA pesquisa e cria flashcards
- 📝 **Texto** - Cole qualquer texto e a IA extrai conceitos importantes
- 📄 **PDF** - Faça upload de um PDF e a IA analisa o conteúdo

---

## ✅ Status Atual

- ✅ Código da IA já está implementado
- ✅ Arquivo `.env.local` existe
- ⚠️ **Você precisa adicionar sua chave da API do Gemini**

---

## 🔑 Como Obter a Chave da API do Gemini

### Passo 1: Acesse o Google AI Studio
1. Vá para: **https://aistudio.google.com/app/apikey**
2. Faça login com sua conta Google

### Passo 2: Crie uma API Key
1. Clique em **"Create API Key"** (Criar chave de API)
2. Selecione um projeto do Google Cloud (ou crie um novo)
3. Clique em **"Create API key in existing project"**
4. Copie a chave gerada (começa com `AIza...`)

> **💡 Dica**: A API do Gemini tem um plano **GRATUITO** generoso:
> - 15 requisições por minuto
> - 1 milhão de tokens por minuto
> - 1.500 requisições por dia

---

## ⚙️ Configurar a Chave no Aplicativo

### Opção 1: Editar o arquivo `.env.local` manualmente

1. **Abra o arquivo** `.env.local` na raiz do projeto
2. **Adicione ou edite** a linha com sua chave:

```env
GEMINI_API_KEY=SUA_CHAVE_AQUI
```

3. **Salve o arquivo**
4. **Reinicie o servidor** (Ctrl+C no terminal e depois `npm run dev`)

### Opção 2: Usar o terminal (mais rápido)

Execute este comando no terminal (substitua `SUA_CHAVE_AQUI` pela sua chave real):

```powershell
# Adiciona a chave ao arquivo .env.local
Add-Content -Path .env.local -Value "`nGEMINI_API_KEY=SUA_CHAVE_AQUI"
```

Depois reinicie o servidor:
```powershell
# Pare o servidor atual (Ctrl+C) e reinicie
npm run dev
```

---

## 🧪 Testar a Conexão

1. **Acesse**: http://localhost:3000/dashboard
2. **Clique em**: "✨ Gerar Flashcards"
3. **Escolha um modo**:
   - Digite um tópico simples (ex: "Fotossíntese")
   - Ou cole um texto curto
4. **Selecione o tipo**: "Pergunta e Resposta"
5. **Clique em**: "✨ Gerar Flashcards"

### ✅ Se funcionar:
- Você verá "⏳ Gerando..." por alguns segundos
- Será redirecionado para o Dashboard
- Os flashcards aparecerão no deck

### ❌ Se der erro:
- Verifique se a chave está correta no `.env.local`
- Certifique-se de que reiniciou o servidor
- Verifique o console do navegador (F12) para mensagens de erro

---

## 🎯 Tipos de Flashcards Disponíveis

### 1. 📝 Pergunta e Resposta (Q&A)
- Extrai conceitos e definições
- Formato: Pergunta → Resposta

### 2. ✅ Verdadeiro ou Falso
- Cria afirmações para avaliar
- Inclui explicação da resposta

### 3. 🎯 Múltipla Escolha
- Gera perguntas com 4 opções
- Marca a resposta correta
- Inclui explicação

### 4. 💡 Exemplo Prático
- Usa Google Search para encontrar aplicações reais
- Apresenta problema → solução
- Ideal para aprendizado aplicado

---

## 🔒 Segurança da API Key

> **⚠️ IMPORTANTE**: Nunca compartilhe sua API key publicamente!

- ✅ O arquivo `.env.local` está no `.gitignore` (não vai para o Git)
- ✅ A chave fica apenas no seu computador
- ❌ Não coloque a chave diretamente no código
- ❌ Não faça commit do `.env.local`

---

## 🐛 Solução de Problemas

### Erro: "A variável de ambiente API_KEY não está definida"
**Solução**: Adicione `GEMINI_API_KEY` no arquivo `.env.local` e reinicie o servidor

### Erro: "Não foi possível gerar os flashcards"
**Possíveis causas**:
1. Chave da API inválida ou expirada
2. Limite de requisições excedido (plano gratuito)
3. Texto muito curto ou vazio
4. Problemas de conexão com a internet

**Solução**: 
- Verifique a chave no Google AI Studio
- Aguarde alguns minutos se atingiu o limite
- Tente com um texto mais longo e descritivo

### Erro: "A resposta da IA não estava no formato JSON esperado"
**Solução**: Isso é raro, mas pode acontecer. Simplesmente tente gerar novamente.

---

## 📚 Recursos Adicionais

- **Documentação do Gemini**: https://ai.google.dev/docs
- **Google AI Studio**: https://aistudio.google.com/
- **Preços e Limites**: https://ai.google.dev/pricing

---

## ✨ Próximos Passos

Depois de configurar a API:

1. ✅ Execute o script SQL no Supabase (`fix_delete_policy.sql`)
2. ✅ Teste a geração de flashcards
3. ✅ Explore os diferentes tipos de flashcards
4. ✅ Comece a estudar! 📚

---

**Dúvidas?** Verifique os logs do console (F12 no navegador) ou do terminal onde o servidor está rodando.
