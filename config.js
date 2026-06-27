// Configuração do Supabase
const SUPABASE_URL = 'https://exngmtewnurlioyqdkec.supabase.co'; // SUBSTITUIR
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bmdtdGV3bnVybGlveXFka2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDgyNjIsImV4cCI6MjA5ODA4NDI2Mn0.KLo7bcXk7LjVbamnIuQXXZiMbuyxOoJ5DWbHJdAeNAs'; // SUBSTITUIR

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
