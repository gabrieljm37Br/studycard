import { supabase } from './supabaseClient';

export interface StudyHeatmapPoint {
  date: string;
  count: number;
}

export interface CardMaturitySlice {
  status: 'Novos' | 'Aprendendo' | 'Jovens' | 'Maduros';
  count: number;
}

export interface ReviewForecastPoint {
  date: string;
  count: number;
}

export interface WeakDeckRow {
  deck_id: string;
  deck_name: string;
  accuracy: number;
  total: number;
}

export interface OverviewStats {
  streak: number;
  totalStudied: number;
  retention: number;
}

export interface DeckRecursiveMetrics {
  total_cards: number;
  counts: {
    unseen: number;
    learning: number;
    reviewing: number;
    almost: number;
  };
  study_history: {
    date: string;
    count: number;
    correct_count: number;
  }[];
  total_reviews: number;
  total_correct: number;
}

const mapMaturity = (dbStatus: string): CardMaturitySlice['status'] => {
  switch (dbStatus) {
    case 'Novos':
      return 'Novos';
    case 'Aprendendo':
      return 'Aprendendo';
    case 'Jovens':
      return 'Jovens';
    default:
      return 'Maduros';
  }
};

export const fetchHeatmap = async (userId: string): Promise<StudyHeatmapPoint[]> => {
  const { data, error } = await supabase.rpc('get_study_heatmap', { p_user_id: userId });
  if (error) throw error;
  return (data || []) as StudyHeatmapPoint[];
};

export const fetchCardMaturity = async (userId: string): Promise<CardMaturitySlice[]> => {
  const { data, error } = await supabase.rpc('get_card_maturity', { p_user_id: userId });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    status: mapMaturity(row.status),
    count: Number(row.count ?? 0),
  }));
};

export const fetchReviewForecast = async (userId: string): Promise<ReviewForecastPoint[]> => {
  const { data, error } = await supabase.rpc('get_review_forecast', { p_user_id: userId });
  if (error) throw error;
  return (data || []) as ReviewForecastPoint[];
};

export const fetchWeakestDecks = async (userId: string): Promise<WeakDeckRow[]> => {
  const { data, error } = await supabase.rpc('get_weakest_decks', { p_user_id: userId });
  if (error) throw error;
  return (data || []) as WeakDeckRow[];
};

export const fetchOverview = async (userId: string): Promise<OverviewStats> => {
  // Streak
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current')
    .eq('id', userId)
    .single();

  // Total studied and retention
  const { data: totals, error: totalsError } = await supabase
    .from('study_sessions')
    .select('result', { count: 'exact' })
    .eq('user_id', userId);

  if (totalsError) throw totalsError;

  const totalStudied = totals?.length || 0;
  const correctCount = totals?.filter((s: any) => s.result === 'correct')?.length || 0;
  const retention = totalStudied === 0 ? 0 : Math.round((correctCount / totalStudied) * 100);

  return {
    streak: profile?.streak_current || 0,
    totalStudied,
    retention,
  };
};

export const fetchDeckRecursiveMetrics = async (deckId: string): Promise<DeckRecursiveMetrics> => {
  const { data, error } = await supabase.rpc('get_deck_recursive_metrics', { p_deck_id: deckId });

  if (error) throw error;

  return data as DeckRecursiveMetrics;
};
