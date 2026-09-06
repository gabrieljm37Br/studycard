# 📊 Configuração de Estatísticas - StudyCard

## ⚠️ Problema Atual

A página de Estatísticas mostra o erro: **"Não foi possível carregar estatísticas."**

Isso acontece porque as **funções SQL necessárias não foram criadas no Supabase**.

---

## ✅ Solução Rápida (3 Passos)

### Passo 1: Abrir Supabase SQL Editor

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **StudyCard**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### Passo 2: Executar o Script SQL

1. Abra o arquivo: [`supabase/migrations/20250108000000_fix_bola_idor_and_search_path.sql`](file:///c:/Users/Gabriel/APP/studycard/studycard/supabase/migrations/20250108000000_fix_bola_idor_and_search_path.sql) (ou [`20250106000000_statistics_functions.sql`](file:///c:/Users/Gabriel/APP/studycard/studycard/supabase/migrations/20250106000000_statistics_functions.sql))
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 3: Verificar Sucesso

Se tudo correu bem, você verá a mensagem:
```
Success. No rows returned
```

Agora recarregue a página de Estatísticas no seu app!

---

## 🔍 O Que Foi Criado

O script cria **4 funções SQL** no banco de dados:

| Função | Descrição |
|--------|-----------|
| `get_study_heatmap` | Retorna atividade de estudo dos últimos 365 dias |
| `get_card_maturity` | Retorna distribuição de maturidade dos flashcards |
| `get_review_forecast` | Retorna previsão de revisões dos próximos 7 dias |
| `get_weakest_decks` | Retorna os 5 decks com menor taxa de acerto |

---

## 🧪 Testar as Funções (Opcional)

Após executar o script, você pode testar cada função individualmente:

### 1. Obter seu User ID

```sql
SELECT id, email FROM auth.users LIMIT 1;
```

Copie o `id` retornado.

### 2. Testar cada função

Substitua `'SEU_USER_ID'` pelo ID copiado:

```sql
-- Teste 1: Heatmap
SELECT * FROM get_study_heatmap('SEU_USER_ID');

-- Teste 2: Maturidade
SELECT * FROM get_card_maturity('SEU_USER_ID');

-- Teste 3: Previsão
SELECT * FROM get_review_forecast('SEU_USER_ID');

-- Teste 4: Decks Fracos
SELECT * FROM get_weakest_decks('SEU_USER_ID');
```

**Nota**: Se você ainda não estudou flashcards, as funções retornarão arrays vazios `[]`. Isso é normal!

---

## 🎯 Melhorias Implementadas

### 1. Mensagens de Erro Específicas

Agora a página mostra erros mais claros:

- ❌ **Funções não configuradas** → "Execute o script SQL fornecido no Supabase"
- ❌ **Sem permissão** → "Verifique as políticas RLS no Supabase"
- ❌ **Outro erro** → Mostra a mensagem de erro específica

### 2. Tratamento Robusto

- ✅ Funções retornam arrays vazios se não houver dados
- ✅ Não quebra a página se uma função falhar
- ✅ Console mostra detalhes do erro para debug

---

## 🐛 Troubleshooting

### Erro: "function does not exist"

**Causa**: As funções SQL não foram criadas.

**Solução**: Execute o script `statistics_functions.sql` no Supabase SQL Editor.

---

### Erro: "permission denied"

**Causa**: Políticas RLS (Row Level Security) bloqueando acesso.

**Solução**: As funções usam `SECURITY DEFINER`, então devem funcionar. Se o erro persistir, verifique as políticas RLS nas tabelas:
- `study_sessions`
- `flashcards`
- `decks`
- `profiles`

---

### Dados aparecem como "-" mesmo após executar o script

**Causa**: Você ainda não estudou flashcards.

**Solução**: 
1. Crie alguns flashcards
2. Entre no Modo Estudo
3. Estude pelo menos 5 flashcards
4. Recarregue a página de Estatísticas

---

## 📝 Estrutura do Banco de Dados

As funções dependem das seguintes tabelas:

```
study_sessions
├── id (UUID)
├── user_id (UUID)
├── flashcard_id (UUID)
├── result (TEXT) → 'correct', 'incorrect', 'almost'
└── created_at (TIMESTAMP)

flashcards
├── id (UUID)
├── user_id (UUID)
├── deck_id (UUID)
├── interval (INTEGER) → Dias até próxima revisão
├── next_review (TIMESTAMP)
└── ...

decks
├── id (UUID)
├── user_id (UUID)
├── name (TEXT)
└── ...

profiles
├── id (UUID)
├── streak_current (INTEGER)
└── ...
```

---

## ✨ Próximos Passos

Após executar o script:

1. ✅ Recarregue a página de Estatísticas
2. ✅ Verifique se os KPIs aparecem (Streak, Total Estudados, Retenção)
3. ✅ Estude alguns flashcards para popular os gráficos
4. ✅ Volte às Estatísticas para ver os dados atualizados

---

## 📞 Suporte

Se o erro persistir após executar o script:

1. Abra o **DevTools** (F12)
2. Vá na aba **Console**
3. Copie a mensagem de erro completa
4. Compartilhe para análise

---

**Arquivo de migração**: [`supabase/migrations/20250108000000_fix_bola_idor_and_search_path.sql`](file:///c:/Users/Gabriel/APP/studycard/studycard/supabase/migrations/20250108000000_fix_bola_idor_and_search_path.sql)

**Arquivo modificado**: [`pages/Statistics.tsx`](file:///c:/Users/Gabriel/APP/studycard/studycard/pages/Statistics.tsx)
