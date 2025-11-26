import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { FlashcardData } from '../types';

interface CalendarItem {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  source: 'flashcard' | 'custom';
}

const formatDateLocal = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthMatrix = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0-6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const matrix: Array<Array<{ day: number | null; date: string | null }>> = [];
  let current = 1 - startWeekday;

  for (let row = 0; row < 6; row++) {
    const week: Array<{ day: number | null; date: string | null }> = [];
    for (let col = 0; col < 7; col++) {
      if (current < 1 || current > daysInMonth) {
        week.push({ day: null, date: null });
      } else {
        const date = new Date(year, month, current);
        const iso = formatDateLocal(date);
        week.push({ day: current, date: iso });
      }
      current++;
    }
    matrix.push(week);
  }
  return matrix;
};

const StudyCalendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(formatDateLocal(today));
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const monthMatrix = useMemo(() => getMonthMatrix(currentYear, currentMonth), [currentYear, currentMonth]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentMonth, currentYear]);

  const loadData = async () => {
    setLoading(true);
    setCalendarError(null);
    try {
      const monthStartDate = new Date(currentYear, currentMonth, 1);
      const monthEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      const monthStart = `${formatDateLocal(monthStartDate)}T00:00:00`;
      const monthEnd = `${formatDateLocal(monthEndDate)}T23:59:59`;

      // Due flashcards for month
      const { data: cards, error: cardsError } = await supabase
        .from('flashcards')
        .select('id, deck_id, next_review, deck:decks(name)')
        .eq('user_id', user!.id)
        .gte('next_review', monthStart)
        .lte('next_review', monthEnd);

      if (cardsError) throw cardsError;

      const flashcardItems: CalendarItem[] = [];
      const byDateDeck: Record<string, Record<string, { count: number; deckName: string }>> = {};

      (cards || []).forEach((c: any) => {
        if (!c.next_review) return;
        const dateKey = formatDateLocal(new Date(c.next_review as string));
        const deckId = c.deck_id || 'sem-deck';
        const deckName = c.deck?.name || 'Deck';
        if (!byDateDeck[dateKey]) byDateDeck[dateKey] = {};
        if (!byDateDeck[dateKey][deckId]) byDateDeck[dateKey][deckId] = { count: 0, deckName };
        byDateDeck[dateKey][deckId].count += 1;
      });

      Object.entries(byDateDeck).forEach(([dateKey, decks]) => {
        Object.entries(decks).forEach(([deckId, info]) => {
          flashcardItems.push({
            id: `flashcard-${dateKey}-${deckId}`,
            title: `${info.deckName} - ${info.count} cards`,
            date: dateKey,
            source: 'flashcard',
          });
        });
      });

      // Custom calendar entries
      const { data: custom, error: customError } = await supabase
        .from('study_calendar_items')
        .select('id, title, date')
        .eq('user_id', user!.id)
        .gte('date', formatDateLocal(monthStartDate))
        .lte('date', formatDateLocal(monthEndDate));

      if (customError) {
        if (customError.code === '42P01') {
          setCalendarError('Crie a tabela study_calendar_items para salvar tarefas personalizadas.');
        } else {
          throw customError;
        }
      }

      const customItems: CalendarItem[] = (custom || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        date: c.date,
        source: 'custom',
      }));

      setCalendarItems([...flashcardItems, ...customItems]);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
    } finally {
      setLoading(false);
    }
  };

  const itemsByDate = useMemo(() => {
    return calendarItems.reduce<Record<string, CalendarItem[]>>((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [calendarItems]);

  const selectedItems = itemsByDate[selectedDate] || [];

  const addCustomItem = async () => {
    if (!newItemTitle.trim()) return;
    setSaving(true);
    setCalendarError(null);
    try {
      const { data, error } = await supabase
        .from('study_calendar_items')
        .insert({
          user_id: user!.id,
          title: newItemTitle.trim(),
          date: selectedDate,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          setCalendarError('Crie a tabela study_calendar_items para salvar tarefas personalizadas.');
          return;
        }
        throw error;
      }

      const newItem: CalendarItem = {
        id: data.id,
        title: data.title,
        date: data.date,
        source: 'custom',
      };
      setCalendarItems(prev => [...prev, newItem]);
      setNewItemTitle('');
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      if (!calendarError) {
        alert('Não foi possível salvar. Verifique se a tabela study_calendar_items existe.');
      }
    } finally {
      setSaving(false);
    }
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto w-full px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left space-y-1">
              <p className="text-xs uppercase tracking-widest text-white/80">Estudos</p>
              <h1 className="text-3xl font-bold leading-tight">Calendário de Estudo</h1>
              <p className="text-white/80 text-sm">Veja suas próximas revisões e planeje seus estudos.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-700 hover:shadow-lg rounded-lg text-sm font-semibold transition-all active:scale-95"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">←</button>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">→</button>
            </div>
          </div>
          {calendarError && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800 text-sm">
              {calendarError} Exemplo de criação:
              <pre className="mt-2 whitespace-pre-wrap text-xs">{`create table study_calendar_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  date date not null,
  created_at timestamptz default now()
);`}</pre>
            </div>
          )}

          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="bg-white dark:bg-gray-800 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {monthMatrix.map((week, wi) =>
              week.map((cell, ci) => {
                const isSelected = cell.date === selectedDate;
                const hasItems = cell.date && (itemsByDate[cell.date]?.length ?? 0) > 0;
                return (
                  <button
                    key={`${wi}-${ci}`}
                    disabled={!cell.date}
                    onClick={() => cell.date && setSelectedDate(cell.date)}
                    className={`h-20 bg-white dark:bg-gray-800 text-left p-3 transition-colors ${
                      !cell.date ? 'cursor-default text-gray-300 dark:text-gray-600' : 'cursor-pointer'
                    } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{cell.day ?? ''}</span>
                      {hasItems && <span className="text-xs text-indigo-600 dark:text-indigo-300 font-bold">●</span>}
                    </div>
                    {hasItems && (
                      <div className="mt-2 space-y-1">
                        {itemsByDate[cell.date!].slice(0, 2).map(item => (
                          <div key={item.id} className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                            {item.source === 'flashcard' ? 'Revisão: ' : 'Custom: '}{item.title}
                          </div>
                        ))}
                        {itemsByDate[cell.date!].length > 2 && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-300">+{itemsByDate[cell.date!].length - 2} mais</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {(() => {
                  const [y, m, d] = selectedDate.split('-').map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  });
                })()}
              </h3>
              {loading && <span className="text-sm text-gray-500 dark:text-gray-400">Carregando...</span>}
            </div>

            {selectedItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhuma revisão ou item para esta data.</p>
            ) : (
              <ul className="space-y-3">
                {selectedItems.map(item => (
                  <li key={item.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <span className="text-sm px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {item.source === 'flashcard' ? 'Revisão' : 'Custom'}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 text-sm flex-1">{item.title}</span>
                    {item.source === 'custom' && (
                      <button
                        onClick={async () => {
                          if (deletingId) return;
                          setDeletingId(item.id);
                          try {
                            const { error } = await supabase.from('study_calendar_items').delete().eq('id', item.id).eq('user_id', user!.id);
                            if (error) throw error;
                            setCalendarItems(prev => prev.filter(ci => ci.id !== item.id));
                          } catch (err) {
                            console.error('Erro ao excluir item:', err);
                            alert('Não foi possível excluir o item.');
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        disabled={deletingId === item.id}
                        className="px-3 py-1 text-sm rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Adicionar item para esta data</h4>
            <input
              type="text"
              value={newItemTitle}
              onChange={e => setNewItemTitle(e.target.value)}
              placeholder="Ex: Revisar capítulo 3"
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-transparent dark:text-white mb-3"
            />
            <button
              onClick={addCustomItem}
              disabled={saving || !newItemTitle.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Dica: as revisões automáticas vêm dos flashcards com <code>next_review</code> (SRS). Itens customizados ficam nesta agenda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCalendar;
