import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import StudyTimerBar from './components/StudyTimerBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import Study from './pages/Study';
import DeckDetails from './pages/DeckDetails';
import Help from './pages/Help';
import SimulatedMode from './pages/SimulatedMode';
import SimulationDetails from './pages/SimulationDetails';
import StudyCalendar from './pages/StudyCalendar';
import Statistics from './pages/Statistics';
import Topicogram from './pages/Topicogram';
import { hasSupabaseEnv, supabaseEnvError } from './services/supabaseClient';
import Home from './pages/Home';
import SimulatedStudy from './pages/SimulatedStudy';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const AppRouter: React.FC = () => {
    if (!hasSupabaseEnv) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Configuração necessária</h1>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{supabaseEnvError}</p>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                        VITE_SUPABASE_URL=https://ixpkbgmrqftmokdyydsl.supabase.co
                        <br />
                        VITE_SUPABASE_ANON_KEY=SEU_PUBLIC_ANON_KEY
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Crie o arquivo <code>.env.local</code> na raiz do projeto, copie os valores acima (ou os do seu projeto)
                        e reinicie com <code>npm run dev</code>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <StudyTimerBar />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/generator"
                            element={
                                <ProtectedRoute>
                                    <Generator />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/study"
                            element={
                                <ProtectedRoute>
                                    <Study />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/simulation-study"
                            element={
                                <ProtectedRoute>
                                    <SimulatedStudy />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/deck/:deckId"
                            element={
                                <ProtectedRoute>
                                    <DeckDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/help"
                            element={
                                <ProtectedRoute>
                                    <Help />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar"
                            element={
                                <ProtectedRoute>
                                    <StudyCalendar />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/statistics"
                            element={
                                <ProtectedRoute>
                                    <Statistics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/simulations"
                            element={
                                <ProtectedRoute>
                                    <SimulatedMode />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/simulation/:id"
                            element={
                                <ProtectedRoute>
                                    <SimulationDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/topicogram"
                            element={
                                <ProtectedRoute>
                                    <Topicogram />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/home" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default AppRouter;

