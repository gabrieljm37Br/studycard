import React from 'react';

const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-slate-700">
                    <h2 id="help-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">
                        Como Usar o StudyCard
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition"
                        aria-label="Fechar modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6 overflow-y-auto pr-2 text-slate-700 dark:text-slate-300">
                    <section>
                        <h3 className="text-xl font-semibold mb-2 text-cyan-600 dark:text-cyan-400">1. Criando Flashcards</h3>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Vá para a tela <strong>"Gerar Flashcards"</strong> usando o botão no cabeçalho.</li>
                            <li>Escolha entre <strong>"Colar Texto"</strong> ou <strong>"Carregar PDF"</strong> para fornecer o material de estudo.</li>
                            <li>Selecione o tipo de flashcard desejado: Pergunta e Resposta, Verdadeiro ou Falso, ou Múltipla Escolha.</li>
                            <li>Escolha um deck existente para salvar os novos flashcards ou selecione a opção para criar um novo.</li>
                            <li>Clique em <strong>"Gerar Flashcards"</strong> e aguarde a IA fazer sua mágica!</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold mb-2 text-cyan-600 dark:text-cyan-400">2. Gerenciando Decks</h3>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>A visualização principal é a de <strong>"Gerenciar Decks"</strong>. Você pode ver todos os seus decks e sub-decks.</li>
                            <li>Para criar um novo sub-deck, digite o nome no campo <strong>"Novo deck..."</strong> e pressione Enter ou clique no botão "+".</li>
                            <li>Clique em um deck para abri-lo e ver seus flashcards e sub-decks. Use o caminho (breadcrumbs) no topo para navegar de volta.</li>
                            <li>Passe o mouse sobre um sub-deck e clique no ícone de menu (três pontos) para <strong>Renomear</strong>, <strong>Mover</strong> ou <strong>Excluir</strong> o deck.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold mb-2 text-cyan-600 dark:text-cyan-400">3. Estudando</h3>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Dentro de um deck, clique em <strong>"Iniciar Estudo"</strong>. Isso iniciará uma sessão com todos os flashcards do deck atual e de seus sub-decks.</li>
                            <li>Clique em um flashcard para virá-lo e ver a resposta.</li>
                            <li>Após virar o card, avalie seu desempenho clicando em <strong>"Errei"</strong> ou <strong>"Acertei"</strong> para avançar para o próximo.</li>
                            <li>O ponto colorido nos decks indica seu desempenho geral (vermelho para erros, verde para acertos).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold mb-2 text-cyan-600 dark:text-cyan-400">4. Gerenciando Flashcards</h3>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Ao passar o mouse sobre um flashcard, aparecem ícones para <strong>Editar</strong> (lápis), <strong>Excluir</strong> (lixeira) e <strong>Mover</strong> (seta).</li>
                            <li>Para ações em massa, clique em <strong>"Selecionar"</strong> no cabeçalho do deck.</li>
                            <li>Clique nos flashcards para selecioná-los. Uma barra de ações aparecerá na parte inferior.</li>
                            <li>Com a barra de ações, você pode <strong>Mover</strong> ou <strong>Excluir</strong> todos os flashcards selecionados de uma vez.</li>
                            <li>Clique em <strong>"Concluído"</strong> para sair do modo de seleção.</li>
                        </ul>
                    </section>
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                        Entendido!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
