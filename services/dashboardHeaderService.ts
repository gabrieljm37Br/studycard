import { supabase } from './supabaseClient';

export interface TodayStats {
    studiedToday: number;
    correctToday: number;
    xpToday: number;
    accuracyToday: number;
}

export interface ProfileOverview {
    xp: number;
    level: number;
    streak: number;
}

export interface BadgeSummary {
    id: string;
    name: string;
    icon: string;
}

export interface DeckSearchResult {
    id: string;
    name: string;
    path: string;
    flashcardsCount: number;
}

export const fetchProfileOverview = async (userId: string): Promise<{ profile: ProfileOverview; badges: BadgeSummary[] }> => {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('xp, level, streak_current')
        .eq('id', userId)
        .single();

    if (profileError) throw profileError;

    const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select('badges(id, name, icon)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })
        .limit(3);

    if (badgesError) throw badgesError;

    const badges = (badgesData || []).map((item: any) => item.badges) as BadgeSummary[];

    return {
        profile: {
            xp: profile?.xp ?? 0,
            level: profile?.level ?? 1,
            streak: profile?.streak_current ?? 0,
        },
        badges,
    };
};

export const fetchTodayStats = async (userId: string): Promise<TodayStats> => {
    const { data, error } = await supabase.rpc('get_today_stats', { p_user_id: userId });
    if (error) throw error;

    const row = (data && data[0]) || {};
    const studied = row.studied_today ?? 0;
    const correct = row.correct_today ?? 0;
    const xpToday = row.xp_today ?? 0;
    const accuracy = studied > 0 ? Math.round((correct / studied) * 100) : 0;

    return {
        studiedToday: studied,
        correctToday: correct,
        xpToday,
        accuracyToday: accuracy,
    };
};

export const searchDecks = async (query: string, userId: string): Promise<DeckSearchResult[]> => {
    const { data, error } = await supabase.rpc('search_decks', { p_user_id: userId, p_query: query });
    if (error) throw error;

    return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        path: row.path,
        flashcardsCount: row.flashcards_count ?? 0,
    }));
};
