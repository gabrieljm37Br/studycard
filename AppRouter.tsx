import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
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
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default AppRouter;

