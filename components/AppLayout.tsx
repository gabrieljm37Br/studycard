import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const AppLayout: React.FC = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-50 flex">
            <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <div className="flex-1 min-w-0 flex flex-col">
                <div className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/70 dark:border-gray-800 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm"
                        aria-label="Abrir menu lateral"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">StudyCard</p>
                        <p className="text-sm font-semibold">Navegação</p>
                    </div>
                </div>

                <main className="flex-1 min-h-0 px-3 sm:px-4 md:px-6 py-6 md:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
