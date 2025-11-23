# 🔧 Como Habilitar a Exclusão de Decks

## Problema
Você não consegue excluir decks porque falta uma permissão de segurança no banco de dados Supabase.

## Solução Rápida (2 minutos)

### Passo 1: Acesse o Supabase
1. Vá para: https://supabase.com/dashboard/project/ixpkbgmrqftmokdyydsl
2. Faça login se necessário

### Passo 2: Abra o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"**

### Passo 3: Execute o Script
Copie e cole o código abaixo no editor SQL:

```sql
CREATE POLICY "Users can delete own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);
```

### Passo 4: Execute
1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
2. Aguarde a mensagem de sucesso ✅

### Passo 5: Teste
Volte para o aplicativo e tente excluir um deck novamente!

---

## Por que isso é necessário?

O Supabase usa **Row Level Security (RLS)** para proteger seus dados. Quando você tenta excluir um deck:
1. O deck tem flashcards vinculados
2. Os flashcards têm sessões de estudo vinculadas
3. O banco tenta excluir tudo em cascata (ON DELETE CASCADE)
4. Mas sem a permissão de DELETE na tabela `study_sessions`, a operação falha

Este script adiciona a permissão que estava faltando! 🎯
