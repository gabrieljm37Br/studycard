import React from 'react';
import { HelpSectionProps } from './types';

export const HelpPermissionsSection: React.FC<HelpSectionProps> = ({ copyToClipboard }) => {
    return (
                    <section id="permissoes" className="mb-12 scroll-mt-24">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                            <span>🔒</span> Permissões do Usuário
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Autenticação e Segurança
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    O Flashcards AI utiliza autenticação segura via Supabase para proteger seus dados:
                                </p>

                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-1">🔐</span>
                                        <span>Senhas criptografadas e armazenadas com segurança</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-1">🔐</span>
                                        <span>Sessões autenticadas com tokens seguros</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-1">🔐</span>
                                        <span>Proteção contra acesso não autorizado</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Privacidade dos Dados
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Todos os seus dados são privados e isolados:
                                </p>

                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Seus decks e flashcards são visíveis apenas para você</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Seu progresso e estatísticas são privados</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Suas conquistas e XP são pessoais</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                            <span>Nenhum outro usuário pode acessar seus dados</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Gerenciamento de Perfil
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Seu perfil contém informações básicas como nome, email, nível e XP.
                                    Todas as operações (criar, editar, excluir) são restritas aos seus próprios dados.
                                </p>
                            </div>
                        </div>
                    </section>
    );
};
