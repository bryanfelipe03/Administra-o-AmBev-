// Configuração do Supabase
const SUPABASE_URL = 'https://sptmwpiwfhefqchctlag.supabase.co'; // SUBSTITUIR
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdG13cGl3ZmhlZnFjaGN0bGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDkzMzcsImV4cCI6MjA5ODA4NTMzN30.AWacnxvG6rSBX6ZmfxUWDo4zGwPTvrk3Er3ReBMzDHs'; // SUBSTITUIR

// Inicializar cliente Supabase
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para testar conexão
async function testarConexaoSupabase() {
  try {
    const { data, error } = await supabase.from('produtos').select('count()', { count: 'exact' });
    if (error) throw error;
    console.log('✓ Conectado ao Supabase com sucesso');
    return true;
  } catch (error) {
    console.error('✗ Erro ao conectar Supabase:', error.message);
    return false;
  }
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', testarConexaoSupabase);
