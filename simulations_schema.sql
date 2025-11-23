-- Tabela para armazenar simulados
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os itens (flashcards) do simulado
CREATE TABLE IF NOT EXISTS simulation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE NOT NULL,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(simulation_id, flashcard_id)
);

-- Enable RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para simulations
CREATE POLICY "Users can view own simulations" ON simulations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations" ON simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulations" ON simulations
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para simulation_items
-- Usuários podem ver itens se o simulado pertencer a eles
CREATE POLICY "Users can view own simulation items" ON simulation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM simulations
      WHERE simulations.id = simulation_items.simulation_id
      AND simulations.user_id = auth.uid()
    )
  );

-- Usuários podem inserir itens se o simulado pertencer a eles
CREATE POLICY "Users can insert own simulation items" ON simulation_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM simulations
      WHERE simulations.id = simulation_items.simulation_id
      AND simulations.user_id = auth.uid()
    )
  );

-- Usuários podem deletar itens se o simulado pertencer a eles
CREATE POLICY "Users can delete own simulation items" ON simulation_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM simulations
      WHERE simulations.id = simulation_items.simulation_id
      AND simulations.user_id = auth.uid()
    )
  );
