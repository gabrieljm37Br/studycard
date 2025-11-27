# README - Linha do Tempo (antigo Topicogram)

## O que mudou
- A pagina exibida no frontend agora usa o nome "Linha do Tempo" em vez de "Topicogram".
- O arquivo de implementacao continua `pages/Topicogram.tsx` e a rota protegida segue `/topicogram` declarada em `AppRouter.tsx`.
- Servicos e tipos relacionados (`getTopicogramDecks`, `TopicogramDeck`) permanecem com o prefixo antigo para compatibilidade e serao renomeados em uma proxima refatoracao, se necessario.

## Como acessar
- Apos logar, navegue para `/topicogram` (link disponivel no menu/atalhos do dashboard) e a interface mostrara o cabecalho "Linha do Tempo".
- Se a linha do tempo estiver vazia, a pagina explica como popular a visao estudando decks.

## Impacto para devs
- Em copias, rotulos e comunicacoes com o usuario, utilize sempre "Linha do Tempo".
- Ao alterar navegacao ou tracking, referencie a rota `/topicogram` ate que uma migracao de path seja planejada.
- Caso renomeie o arquivo no futuro, atualize tambem as importacoes em `AppRouter.tsx` e os pontos que consomem `TopicogramDeck`.

## Teste rapido
- Acesse `/topicogram` autenticado; confirme que o header, mensagens de carregamento/erro e o estado vazio exibem "Linha do Tempo".
- Ao estudar um deck, ele deve aparecer ordenado do mais recente para o mais antigo.
