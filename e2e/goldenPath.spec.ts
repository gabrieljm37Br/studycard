import { test, expect } from '@playwright/test';
import { setupSupabaseMock, createMockState } from './fixtures/supabaseMockRoute';

test.describe('Jornada de Ouro (Golden Path)', () => {
  test('Login ➔ Criar Deck ➔ Importar CSV ➔ Concluir Sessão de Estudo ➔ Validar Ganho de XP', async ({ page }) => {
    // 1. Inicializar mock em memória das rotas do Supabase
    const mockState = createMockState();
    await setupSupabaseMock(page, mockState);

    // 2. ETAPA 1: LOGIN
    await page.goto('/login');
    await expect(page).toHaveTitle(/StudyCard|Flashcards/i);

    // Preencher formulário de autenticação
    await page.locator('input[type="email"]').fill('gabriel@exemplo.com');
    await page.locator('input[type="password"]').fill('SenhaSegura123!');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Aguardar redirecionamento para área autenticada
    await page.waitForURL(/\/(home|dashboard)/);
    await expect(page.getByRole('button', { name: 'Ir para Dashboard' })).toBeVisible();

    // 3. ETAPA 2: CRIAR DECK
    await page.getByRole('button', { name: 'Ir para Dashboard' }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Criar Novo Deck' })).toBeVisible();

    const deckName = 'Biologia Celular - E2E';
    await page.getByPlaceholder('Nome do deck...').fill(deckName);
    await page.getByRole('button', { name: 'Criar' }).click();

    // Validar que o novo deck apareceu no dashboard
    await expect(page.getByRole('heading', { name: deckName })).toBeVisible();

    // 4. ETAPA 3: IMPORTAR CSV
    await page.goto('/generator');
    await expect(page.getByRole('heading', { name: 'Criar Flashcards com IA' })).toBeVisible();

    // Abrir o modal de importação de CSV
    await page.getByRole('button', { name: 'Importar CSV' }).click();
    await expect(page.getByRole('heading', { name: 'Importar CSV do NotebookLM' })).toBeVisible();

    // Preparar conteúdo CSV sintético com 2 cards
    const csvData =
      'O que e mitocondria?,Organela responsavel pela respiracao celular\n' +
      'O que e cloroplasto?,Organela responsavel pela fotossintese';

    // Fazer upload do arquivo no input do modal
    await page.locator('input[type="file"][accept=".csv"]').setInputFiles({
      name: 'flashcards_biologia.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvData, 'utf-8'),
    });

    // Validar transição automática para o passo de preview
    await expect(page.getByText('Preview dos Flashcards')).toBeVisible();
    await expect(page.getByText('2 flashcards encontrados')).toBeVisible();

    // Selecionar o deck criado na etapa anterior dentro do modal
    const modal = page.locator('.fixed.inset-0');
    const deckSelect = modal.locator('select');
    await deckSelect.waitFor({ state: 'visible' });

    // Obter o ID do deck criado
    const createdDeck = mockState.decks.find(d => d.name === deckName);
    expect(createdDeck).toBeDefined();
    await deckSelect.selectOption(createdDeck!.id);

    // Clicar no botão de confirmação da importação
    await modal.getByRole('button', { name: /Importar 2 Flashcards/i }).click();

    // Validar retorno ao dashboard com mensagem de sucesso
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/flashcards importados com sucesso/i)).toBeVisible();

    // 5. ETAPA 4: CONCLUIR SESSÃO DE ESTUDO
    // Localizar o card do deck e clicar em "Estudar"
    const deckCard = page.locator('.group', { hasText: deckName });
    await deckCard.getByRole('button', { name: 'Estudar' }).click();

    await page.waitForURL(/\/study/);

    // Responder o 1º Flashcard
    const answerInput = page.getByPlaceholder('Digite sua resposta...');
    await expect(answerInput).toBeVisible();
    await answerInput.fill('Organela celular 1');
    await page.getByRole('button', { name: 'Verificar Resposta' }).click();
    await page.getByRole('button', { name: /Acertei/i }).click();

    // Responder o 2º Flashcard
    await expect(answerInput).toBeVisible();
    await answerInput.fill('Organela celular 2');
    await page.getByRole('button', { name: 'Verificar Resposta' }).click();
    await page.getByRole('button', { name: /Acertei/i }).click();

    // 6. ETAPA 5: VALIDAR GANHO DE XP NO DASHBOARD
    // A sessão deve ser concluída e navegar automaticamente de volta para /dashboard
    await page.waitForURL(/\/dashboard/);

    // Validar mensagem de conclusão da sessão de estudo
    await expect(page.getByText(/Sessão concluída!/i)).toBeVisible();

    // Validar que o XP foi registrado no estado do mock e refletido no Topbar / Dashboard
    expect(mockState.xp).toBe(20);
    expect(mockState.studiedToday).toBe(2);
    expect(mockState.correctToday).toBe(2);

    // Validar visualmente o XP no componente Topbar (grid desktop visível)
    await expect(page.locator('.md\\:grid').getByText('20 XP')).toBeVisible();
  });
});
