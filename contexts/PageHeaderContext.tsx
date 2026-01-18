import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

interface PageHeaderState {
    title: string;
    subtitle?: string;
    setHeader: (title: string, subtitle?: string) => void;
}

const PageHeaderContext = createContext<PageHeaderState | undefined>(undefined);

export const PageHeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [title, setTitle] = useState<string>('StudyCard');
    const [subtitle, setSubtitle] = useState<string>('');

    const setHeader = useCallback((nextTitle: string, nextSubtitle?: string) => {
        setTitle(nextTitle);
        setSubtitle(nextSubtitle || '');
    }, []);

    const value = useMemo(() => ({ title, subtitle, setHeader }), [title, subtitle, setHeader]);

    return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
};

export const usePageHeader = () => {
    const ctx = useContext(PageHeaderContext);
    if (!ctx) {
        throw new Error('usePageHeader must be used within PageHeaderProvider');
    }
    return ctx;
};
