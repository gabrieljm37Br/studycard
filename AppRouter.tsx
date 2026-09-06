import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { hasSupabaseEnv, supabaseEnvError } from './services/supabaseClient';
import AppLayout from './components/AppLayout';

// Code Splitting com React.lazy para todas as páginas
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Generator = lazy(() => import('./pages/Generator'));
const Study = lazy(() => import('./pages/Study'));
const DeckDetails = lazy(() => import('./pages/DeckDetails'));
const Help = lazy(() => import('./pages/Help'));
const SimulatedMode = lazy(() => import('./pages/SimulatedMode'));
const SimulationDetails = lazy(() => import('./pages/SimulationDetails'));
const StudyCalendar = lazy(() => import('./pages/StudyCalendar'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Topicogram = lazy(() => import('./pages/Topicogram'));
const Home = lazy(() => import('./pages/Home'));
const SimulatedStudy = lazy(() => import('./pages/SimulatedStudy'));

const PageLoader: React.FC = () => (
    <div className="min-h-[50vh] flex items-center justify-center bg-transparent">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Carregando página...</p>
        </div>
    </div>
);

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
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <AppLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/generator" element={<Generator />} />
                                <Route path="/study" element={<Study />} />
                                <Route path="/simulation-study" element={<SimulatedStudy />} />
                                <Route path="/deck/:deckId" element={<DeckDetails />} />
                                <Route path="/help" element={<Help />} />
                                <Route path="/calendar" element={<StudyCalendar />} />
                                <Route path="/statistics" element={<Statistics />} />
                                <Route path="/simulations" element={<SimulatedMode />} />
                                <Route path="/simulation/:id" element={<SimulationDetails />} />
                                <Route path="/topicogram" element={<Topicogram />} />
                                <Route path="/home" element={<Home />} />
                                <Route path="/" element={<Navigate to="/home" replace />} />
                            </Route>
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default AppRouter;
