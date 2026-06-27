// Configuração do Supabase
const SUPABASE_URL = 'https://sptmwpiwfhefqchctlag.supabase.co'; // SUBSTITUIR
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdG13cGl3ZmhlZnFjaGN0bGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDkzMzcsImV4cCI6MjA5ODA4NTMzN30.AWacnxvG6rSBX6ZmfxUWDo4zGwPTvrk3Er3ReBMzDHs'; // SUBSTITUIR
// Inicializar cliente Supabase no escopo global (window) para evitar
// "Identifier 'supabase' has already been declared" entre arquivos
if (!window._supabaseClient) {
  const { createClient } = window.supabase;
  window._supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Alias global acessível por app.js, relatorios.js e interface.js
var supabase = window._supabaseClient;

// Função global para testar conexão (chamada pelo index.html)
async function testarConexaoSupabase() {
  try {
    const { error } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✓ Conectado ao Supabase com sucesso');
    return true;
  } catch (err) {
    console.error('✗ Erro ao conectar Supabase:', err.message);
    return false;
  }
}
