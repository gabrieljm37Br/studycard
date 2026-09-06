import { Page, Route } from '@playwright/test';

export interface MockState {
  xp: number;
  studiedToday: number;
  correctToday: number;
  decks: Array<{ id: string; name: string; parent_id: string | null; updated_at: string; user_id: string }>;
  flashcards: Array<{
    id: string;
    deck_id: string;
    user_id: string;
    mode: string;
    question: string;
    answer: string;
    feedback: string;
    interval: number;
    repetition: number;
    ease_factor: number;
    tags: string[];
  }>;
}

export function createMockState(): MockState {
  return {
    xp: 0,
    studiedToday: 0,
    correctToday: 0,
    decks: [],
    flashcards: [],
  };
}

export async function setupSupabaseMock(page: Page, state: MockState) {
  let deckCounter = 1;
  let cardCounter = 1;

  await page.route('https://mock.supabase.co/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;
    const acceptHeader = request.headers()['accept'] || '';

    const json = (data: any, status = 200) => {
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    };

    // 1. AUTH: Token / Sign In
    if (path.includes('/auth/v1/token')) {
      return json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'user-e2e-123',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'gabriel@exemplo.com',
          user_metadata: { full_name: 'Gabriel Teste' },
        },
      });
    }

    // 2. AUTH: User Check
    if (path.includes('/auth/v1/user')) {
      return json({
        id: 'user-e2e-123',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'gabriel@exemplo.com',
        user_metadata: { full_name: 'Gabriel Teste' },
      });
    }

    // 3. PROFILES
    if (path.includes('/rest/v1/profiles')) {
      const profileData = {
        id: 'user-e2e-123',
        email: 'gabriel@exemplo.com',
        full_name: 'Gabriel Teste',
        xp: state.xp,
        level: Math.floor(state.xp / 100) + 1,
        streak_current: 1,
        streak_last_study_date: '2026-09-06',
      };
      if (acceptHeader.includes('vnd.pgrst.object+json')) {
        return json(profileData);
      }
      return json([profileData]);
    }

    // 4. TODAY STATS RPC
    if (path.includes('/rest/v1/rpc/get_today_stats')) {
      const stats = {
        cards_studied: state.studiedToday,
        accuracy_percent: state.studiedToday > 0 ? Math.round((state.correctToday / state.studiedToday) * 100) : 0,
        xp_today: state.xp,
      };
      if (acceptHeader.includes('vnd.pgrst.object+json')) {
        return json(stats);
      }
      return json([stats]);
    }

    // 5. SYNC USER BADGES RPC
    if (path.includes('/rest/v1/rpc/sync_user_badges')) {
      return json([]);
    }

    // 6. USER BADGES & BADGES
    if (path.includes('/rest/v1/user_badges') || path.includes('/rest/v1/badges')) {
      return json([]);
    }

    // 7. DECKS
    if (path.includes('/rest/v1/decks')) {
      if (method === 'GET') {
        let result = [...state.decks];
        const idFilter = url.searchParams.get('id');
        if (idFilter && idFilter.startsWith('eq.')) {
          const targetId = idFilter.replace('eq.', '');
          result = result.filter(d => d.id === targetId);
          if (acceptHeader.includes('vnd.pgrst.object+json')) {
            return json(result[0] || null);
          }
          return json(result);
        }
        const parentIdFilter = url.searchParams.get('parent_id');
        if (parentIdFilter) {
          if (parentIdFilter === 'is.null') {
            result = result.filter(d => d.parent_id === null);
          } else if (parentIdFilter.startsWith('eq.')) {
            const pid = parentIdFilter.replace('eq.', '');
            result = result.filter(d => d.parent_id === pid);
          }
        }
        return json(result);
      }

      if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        const newDeck = {
          id: `deck-${deckCounter++}`,
          name: body.name,
          parent_id: body.parent_id || null,
          updated_at: new Date().toISOString(),
          user_id: 'user-e2e-123',
        };
        state.decks.push(newDeck);
        if (acceptHeader.includes('vnd.pgrst.object+json')) {
          return json(newDeck, 201);
        }
        return json([newDeck], 201);
      }
    }

    // 8. FLASHCARDS
    if (path.includes('/rest/v1/flashcards')) {
      if (method === 'GET') {
        let result = [...state.flashcards];
        const deckIdParam = url.searchParams.get('deck_id');
        if (deckIdParam) {
          if (deckIdParam.startsWith('eq.')) {
            const id = deckIdParam.replace('eq.', '');
            result = result.filter(f => f.deck_id === id);
          } else if (deckIdParam.startsWith('in.')) {
            const ids = deckIdParam
              .replace(/^in\.\(/, '')
              .replace(/\)$/, '')
              .split(',')
              .map(s => s.trim().replace(/^"|"$/g, ''));
            result = result.filter(f => ids.includes(f.deck_id));
          }
        }

        const prefer = request.headers()['prefer'] || '';
        if (prefer.includes('count=exact') || url.searchParams.get('select')?.includes('count')) {
          const count = result.length;
          return route.fulfill({
            status: 200,
            headers: {
              'content-range': `0-${Math.max(0, count - 1)}/${count}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify(result),
          });
        }

        return json(result);
      }

      if (method === 'POST') {
        const body = JSON.parse(request.postData() || '[]');
        const items = Array.isArray(body) ? body : [body];
        const created = items.map(item => {
          const newCard = {
            id: `card-${cardCounter++}`,
            deck_id: item.deck_id,
            user_id: 'user-e2e-123',
            mode: item.mode || 'qa',
            question: item.question || '',
            answer: item.answer || '',
            feedback: item.feedback || 'unseen',
            interval: 0,
            repetition: 0,
            ease_factor: 2.5,
            tags: item.tags || [],
          };
          state.flashcards.push(newCard);
          return newCard;
        });

        return json(created, 201);
      }

      if (method === 'PATCH') {
        return json({ success: true });
      }
    }

    // 9. STUDY SESSIONS
    if (path.includes('/rest/v1/study_sessions')) {
      if (method === 'POST') {
        const body = JSON.parse(request.postData() || '{}');
        const xpEarned = body.xp_earned || 0;
        state.xp += xpEarned;
        state.studiedToday += 1;
        if (body.result === 'correct') {
          state.correctToday += 1;
        }

        return json(
          {
            id: `session-${Date.now()}`,
            user_id: 'user-e2e-123',
            deck_id: body.deck_id,
            flashcard_id: body.flashcard_id,
            result: body.result,
            xp_earned: xpEarned,
            created_at: new Date().toISOString(),
          },
          201
        );
      }
      return json([]);
    }

    // 10. FLASHCARD NOTES
    if (path.includes('/rest/v1/flashcard_notes')) {
      return json([]);
    }

    // Default fallback for any other Supabase request
    return json([]);
  });
}
