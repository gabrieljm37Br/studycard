import { vi } from 'vitest';

/**
 * Interface para configuração customizada de resposta de query
 */
export interface MockQueryResponse<T = any> {
  data: T | null;
  error: any | null;
  count?: number | null;
}

/**
 * Cria um mock fluente encadeável para simular a Supabase Query Builder
 */
export const createSupabaseQueryMock = (defaultResponse: MockQueryResponse = { data: [], error: null }) => {
  let response = { ...defaultResponse };

  const queryMock: any = {
    // Configuração dinâmica de resposta
    setResponse: (newResponse: MockQueryResponse) => {
      response = { ...newResponse };
      return queryMock;
    },

    // Operações CRUD
    select: vi.fn().mockImplementation(() => queryMock),
    insert: vi.fn().mockImplementation(() => queryMock),
    update: vi.fn().mockImplementation(() => queryMock),
    delete: vi.fn().mockImplementation(() => queryMock),

    // Filtros
    eq: vi.fn().mockImplementation(() => queryMock),
    neq: vi.fn().mockImplementation(() => queryMock),
    gt: vi.fn().mockImplementation(() => queryMock),
    gte: vi.fn().mockImplementation(() => queryMock),
    lt: vi.fn().mockImplementation(() => queryMock),
    lte: vi.fn().mockImplementation(() => queryMock),
    in: vi.fn().mockImplementation(() => queryMock),
    or: vi.fn().mockImplementation(() => queryMock),
    not: vi.fn().mockImplementation(() => queryMock),
    like: vi.fn().mockImplementation(() => queryMock),
    ilike: vi.fn().mockImplementation(() => queryMock),
    is: vi.fn().mockImplementation(() => queryMock),

    // Modificadores
    order: vi.fn().mockImplementation(() => queryMock),
    limit: vi.fn().mockImplementation(() => queryMock),
    range: vi.fn().mockImplementation(() => queryMock),

    // Seletores únicos
    single: vi.fn().mockImplementation(() => {
      const singleData = Array.isArray(response.data) ? response.data[0] || null : response.data;
      return Promise.resolve({ data: singleData, error: response.error });
    }),
    maybeSingle: vi.fn().mockImplementation(() => {
      const singleData = Array.isArray(response.data) ? response.data[0] || null : response.data;
      return Promise.resolve({ data: singleData, error: response.error });
    }),

    // Suporte a then/catch para await direto do encadeamento: `await supabase.from(...).select(...)`
    then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
      return Promise.resolve(response).then(onfulfilled, onrejected);
    },
    catch: (onrejected?: (reason: any) => any) => {
      return Promise.resolve(response).catch(onrejected);
    },
  };

  return queryMock;
};

// Registros globais de respostas por tabela e RPC
const tableResponses = new Map<string, MockQueryResponse>();
const rpcResponses = new Map<string, MockQueryResponse>();

/**
 * Configura uma resposta padrão ou customizada para uma tabela específica
 */
export const mockTableResponse = <T = any>(tableName: string, data: T, error: any = null) => {
  tableResponses.set(tableName, { data, error });
};

/**
 * Configura uma resposta para uma função RPC específica
 */
export const mockRpcResponse = <T = any>(rpcName: string, data: T, error: any = null) => {
  rpcResponses.set(rpcName, { data, error });
};

/**
 * Reseta todas as respostas customizadas configuradas
 */
export const resetSupabaseMock = () => {
  tableResponses.clear();
  rpcResponses.clear();
  vi.clearAllMocks();
};

/**
 * Mock global compartilhado do cliente Supabase
 */
export const mockSupabaseClient = {
  // Query Builder por tabela
  from: vi.fn().mockImplementation((table: string) => {
    const configuredResponse = tableResponses.get(table) || { data: [], error: null };
    return createSupabaseQueryMock(configuredResponse);
  }),

  // Funções RPC (Remote Procedure Call)
  rpc: vi.fn().mockImplementation((rpcName: string, _params?: any) => {
    const configured = rpcResponses.get(rpcName) || { data: [], error: null };
    return Promise.resolve(configured);
  }),

  // Supabase Storage
  storage: {
    from: vi.fn().mockImplementation((_bucket: string) => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'mocked/path.png' }, error: null }),
      getPublicUrl: vi.fn().mockImplementation((path: string) => ({
        data: { publicUrl: `https://example.com/storage/${path}` },
      })),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },

  // Supabase Auth
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id', email: 'user@studycard.app' } }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'mock-jwt-token' } }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
};
