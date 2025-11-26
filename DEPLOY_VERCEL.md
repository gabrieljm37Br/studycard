# 🚀 Guia de Deploy na Vercel - StudyCard

Este guia fornece instruções passo a passo para fazer o deploy da aplicação StudyCard na Vercel.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Uma conta na [Vercel](https://vercel.com)
- ✅ Uma conta no [GitHub](https://github.com) (recomendado)
- ✅ Projeto Supabase configurado
- ✅ Chave da API do Google Gemini
- ✅ Git instalado localmente

## 🔧 Passo 1: Preparar o Repositório

### 1.1 Inicializar Git (se ainda não foi feito)

```bash
cd c:\Users\Gabriel\APP\studycard\studycard
git init
git add .
git commit -m "Initial commit - StudyCard application"
```

### 1.2 Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com/new)
2. Crie um novo repositório (ex: `studycard`)
3. **NÃO** inicialize com README, .gitignore ou licença

### 1.3 Conectar e Enviar o Código

```bash
git remote add origin https://github.com/SEU_USUARIO/studycard.git
git branch -M main
git push -u origin main
```

## 🌐 Passo 2: Deploy na Vercel

### 2.1 Importar Projeto

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New Project"**
3. Selecione **"Import Git Repository"**
4. Escolha o repositório `studycard` que você criou

### 2.2 Configurar o Projeto

A Vercel detectará automaticamente que é um projeto Vite. Verifique se as configurações estão corretas:

- **Framework Preset**: Vite
- **Root Directory**: `./` (ou deixe em branco)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 Configurar Variáveis de Ambiente

Antes de fazer o deploy, adicione as variáveis de ambiente:

1. Na página de configuração do projeto, clique em **"Environment Variables"**
2. Adicione as seguintes variáveis:

| Nome | Valor | Onde Obter |
|------|-------|------------|
| `VITE_SUPABASE_URL` | `https://ixpkbgmrqftmokdyydsl.supabase.co` | [Supabase Dashboard](https://supabase.com/dashboard/project/ixpkbgmrqftmokdyydsl/settings/api) |
| `VITE_SUPABASE_ANON_KEY` | Sua chave anônima | [Supabase Dashboard](https://supabase.com/dashboard/project/ixpkbgmrqftmokdyydsl/settings/api) |
| `GEMINI_API_KEY` | Sua chave do Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) |

3. Clique em **"Deploy"**

## ✅ Passo 3: Verificar o Deploy

### 3.1 Aguardar o Build

- A Vercel começará a fazer o build automaticamente
- Você pode acompanhar o progresso em tempo real
- O processo geralmente leva 1-3 minutos

### 3.2 Testar a Aplicação

Após o deploy bem-sucedido:

1. Clique no link fornecido pela Vercel (ex: `https://studycard.vercel.app`)
2. Teste as funcionalidades principais:
   - ✅ Login/Cadastro
   - ✅ Criação de decks
   - ✅ Geração de flashcards com IA
   - ✅ Modo de estudo
   - ✅ Dashboard de estatísticas

## 🔄 Passo 4: Atualizações Futuras

### Deploy Automático

A Vercel está configurada para fazer deploy automático sempre que você fizer push para o branch `main`:

```bash
# Fazer alterações no código
git add .
git commit -m "Descrição das alterações"
git push origin main
```

A Vercel detectará o push e iniciará um novo deploy automaticamente.

### Deploy Manual

Se preferir fazer deploy manual:

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Clique em **"Deployments"**
4. Clique em **"Redeploy"**

## 🔒 Considerações de Segurança

> [!WARNING]
> **Exposição da API Key do Gemini**
> 
> Atualmente, a `GEMINI_API_KEY` está sendo exposta no código do cliente através do `vite.config.ts`. Isso significa que qualquer pessoa pode inspecionar o código do navegador e encontrar sua chave.

### Recomendações para Produção

Para melhorar a segurança, considere implementar uma das seguintes soluções:

#### Opção 1: Vercel Serverless Functions (Recomendado)

Crie uma função serverless para proteger a chave da API:

1. Crie o diretório `api/` na raiz do projeto
2. Crie o arquivo `api/generate-flashcards.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    
    return res.status(200).json({ 
      response: result.response.text() 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to generate flashcards' 
    });
  }
}
```

3. Atualize o `geminiService.ts` para usar a função serverless
4. Remova a `GEMINI_API_KEY` das variáveis de ambiente do cliente

#### Opção 2: Backend Separado

Implemente um backend Node.js/Express separado que:
- Gerencia as chamadas à API do Gemini
- Implementa rate limiting
- Adiciona autenticação de usuário
- Registra logs de uso

## 🐛 Troubleshooting

### Erro: "Build failed"

**Problema**: O build falha com erros de TypeScript ou dependências

**Solução**:
1. Verifique se todas as dependências estão no `package.json`
2. Teste o build localmente: `npm run build`
3. Corrija os erros antes de fazer push

### Erro: "Environment variables not found"

**Problema**: A aplicação não consegue acessar as variáveis de ambiente

**Solução**:
1. Verifique se as variáveis estão configuradas no Vercel Dashboard
2. Certifique-se de que os nomes começam com `VITE_` (exceto `GEMINI_API_KEY`)
3. Faça um redeploy após adicionar/modificar variáveis

### Erro: "404 on page refresh"

**Problema**: Ao atualizar a página em uma rota diferente da home, aparece erro 404

**Solução**:
- Isso já está resolvido pelo `vercel.json` que configura o rewrite para SPA
- Se o problema persistir, verifique se o arquivo `vercel.json` foi incluído no deploy

### Erro: "Supabase connection failed"

**Problema**: A aplicação não consegue conectar ao Supabase

**Solução**:
1. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas
2. Confirme que o projeto Supabase está ativo
3. Verifique as políticas RLS (Row Level Security) no Supabase

## 📊 Monitoramento

### Analytics da Vercel

A Vercel fornece analytics básicos gratuitamente:

1. Acesse **Analytics** no dashboard do projeto
2. Monitore:
   - Número de visitantes
   - Performance da aplicação
   - Erros em tempo real

### Logs

Para visualizar logs de erro:

1. Acesse **Deployments** no dashboard
2. Clique no deployment ativo
3. Vá para a aba **Functions** (se usar serverless)
4. Visualize os logs em tempo real

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Configure um domínio customizado (opcional)
2. ✅ Implemente proteção da API Key (veja seção de Segurança)
3. ✅ Configure alertas de erro
4. ✅ Implemente analytics mais detalhados (Google Analytics, etc.)
5. ✅ Configure backup automático do Supabase

## 📚 Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Guia de Deploy Vite](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Suporte

Se encontrar problemas:

1. Consulte a [documentação da Vercel](https://vercel.com/docs)
2. Verifique os [logs de deploy](https://vercel.com/docs/deployments/troubleshoot-a-build)
3. Entre em contato com o suporte da Vercel

---

**Desenvolvido com ❤️ usando Vite, React, TypeScript, Supabase e Google Gemini AI**
