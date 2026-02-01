import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    LayoutDashboard,
    Sparkles,
    PlayCircle,
    BarChart2,
    Calendar,
    HelpCircle,
    Route,
    Sun,
    Moon,
    LogOut,
    PanelsTopLeft,
    X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

type SidebarProps = {
    isMobileOpen: boolean;
    onMobileClose: () => void;
};

type NavItem = {
    label: string;
    path: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
    { label: 'Início', path: '/home', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Gerador', path: '/generator', icon: Sparkles },
    { label: 'Simulados', path: '/simulations', icon: PlayCircle },
    { label: 'Estatísticas', path: '/statistics', icon: BarChart2 },
    { label: 'Calendário', path: '/calendar', icon: Calendar },
    { label: 'Linha do Tempo', path: '/topicogram', icon: Route },
    { label: 'Ajuda', path: '/help', icon: HelpCircle }
];

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        const stored = localStorage.getItem('flashcard_sidebar_collapsed');
        return stored === 'true';
    });

    useEffect(() => {
        localStorage.setItem('flashcard_sidebar_collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const userEmail = useMemo(() => user?.email ?? 'Usuário', [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const closeMobile = () => {
        if (isMobileOpen) onMobileClose();
    };

    const baseContent = (
        <div className={`flex flex-col h-full bg-gray-950 text-gray-100 border-r border-gray-800 shadow-xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
                <button
                    onClick={() => setIsCollapsed(prev => !prev)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors hidden md:inline-flex"
                    aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                >
                    <PanelsTopLeft className="h-5 w-5" />
                </button>
                {!isCollapsed && (
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">StudyCard</p>
                        <p className="text-sm font-semibold text-white">Navegação</p>
                    </div>
                )}
                {isMobileOpen && (
                    <button
                        onClick={onMobileClose}
                        className="ml-auto p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors md:hidden"
                        aria-label="Fechar menu lateral"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    onClick={closeMobile}
                                    className={({ isActive }) =>
                                        [
                                            'group flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer border border-transparent',
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-md border-indigo-500'
                                                : 'text-gray-200 hover:bg-white/5 hover:border-white/10'
                                        ].join(' ')
                                    }
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="border-t border-gray-800 px-3 py-4 space-y-3">
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 transition-colors"
                    aria-label="Alternar tema"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    {!isCollapsed && <span className="text-sm font-medium">Alternar tema</span>}
                </button>

                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 text-gray-200">
                    <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <p className="text-xs text-gray-400">Logado como</p>
                            <p className="text-sm font-semibold truncate">{userEmail}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && <span className="text-sm font-semibold">Sair</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop */}
            <div className="hidden md:flex h-screen sticky top-0 z-30">{baseContent}</div>

            {/* Mobile drawer */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
                    <div className="relative h-full">{baseContent}</div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
