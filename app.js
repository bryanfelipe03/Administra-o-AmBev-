// ========== PRODUTOS ==========
async function adicionarProduto(nome, marca, categoria) {
  const { data, error } = await supabase
    .from('produtos')
    .insert([{ nome, marca, categoria }])
    .select();
  
  if (error) throw error;
  return data[0];
}

async function listarProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  return data;
}

async function deletarProduto(id) {
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

async function atualizarProduto(id, nome, marca, categoria) {
  const { data, error } = await supabase
    .from('produtos')
    .update({ nome, marca, categoria })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

// ========== ESTOQUE LOJA ==========
async function atualizarEstoqueLojaDB(produtoId, quantidade) {
  const { data, error } = await supabase
    .from('estoque_loja')
    .upsert({ produto_id: produtoId, quantidade }, { onConflict: 'produto_id' })
    .select();
  
  if (error) throw error;
  return data[0];
}

async function obterEstoqueLojaDB(produtoId) {
  const { data, error } = await supabase
    .from('estoque_loja')
    .select('*')
    .eq('produto_id', produtoId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data || { quantidade: 0 };
}

async function listarEstoqueLojaCompleto() {
  const { data, error } = await supabase
    .from('estoque_loja')
    .select('*, produtos(nome, marca)')
    .order('produto_id');
  
  if (error) throw error;
  return data;
}

// ========== ESTOQUE DEPÓSITO ==========
async function atualizarEstoqueDepositoDB(produtoId, quantidade) {
  const { data, error } = await supabase
    .from('estoque_deposito')
    .upsert({ produto_id: produtoId, quantidade }, { onConflict: 'produto_id' })
    .select();
  
  if (error) throw error;
  return data[0];
}

async function obterEstoqueDepositoDB(produtoId) {
  const { data, error } = await supabase
    .from('estoque_deposito')
    .select('*')
    .eq('produto_id', produtoId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data || { quantidade: 0 };
}

async function listarEstoqueDepositoCompleto() {
  const { data, error } = await supabase
    .from('estoque_deposito')
    .select('*, produtos(nome, marca)')
    .order('produto_id');
  
  if (error) throw error;
  return data;
}

// ========== VALIDADES ==========
async function adicionarValidade(produtoId, dataValidade, quantidade) {
  const { data, error } = await supabase
    .from('validades')
    .insert([{ produto_id: produtoId, data_validade: dataValidade, quantidade }])
    .select();
  
  if (error) throw error;
  return data[0];
}

async function listarValidadesDB() {
  const { data, error } = await supabase
    .from('validades')
    .select('*, produtos(nome, marca)')
    .order('data_validade');
  
  if (error) throw error;
  return data;
}

async function deletarValidade(id) {
  const { error } = await supabase
    .from('validades')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ========== CONTRATOS ==========
async function adicionarContrato(nome, percentualContratado, percentualAtual, tipo, status) {
  const { data, error } = await supabase
    .from('contratos')
    .insert([{ nome, percentual_contratado: percentualContratado, percentual_atual: percentualAtual, tipo, status }])
    .select();
  
  if (error) throw error;
  return data[0];
}

async function listarContratos() {
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  return data;
}

async function atualizarContrato(id, percentualAtual, status) {
  const { data, error } = await supabase
    .from('contratos')
    .update({ percentual_atual: percentualAtual, status })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

async function deletarContrato(id) {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ========== DASHBOARD STATS ==========
async function obterEstatisticas() {
  try {
    const produtos = await listarProdutos();
    const estoqueLojaList = await listarEstoqueLojaCompleto();
    const estoqueDepositoList = await listarEstoqueDepositoCompleto();
    const validades = await listarValidadesDB();
    const contratos = await listarContratos();
    
    const hoje = new Date();
    const proximosDias = new Date();
    proximosDias.setDate(proximosDias.getDate() + 7);
    
    const vencendo = validades.filter(v => {
      const data = new Date(v.data_validade);
      return data >= hoje && data <= proximosDias;
    });
    
    const vencidos = validades.filter(v => {
      const data = new Date(v.data_validade);
      return data < hoje;
    });
    
    const totalEstoqueLojaQtd = estoqueLojaList.reduce((sum, e) => sum + (e.quantidade || 0), 0);
    const totalEstoqueDepositoQtd = estoqueDepositoList.reduce((sum, e) => sum + (e.quantidade || 0), 0);
    
    const contratosAtivos = contratos.filter(c => c.status === 'ativo');
    const contratosCumpridos = contratosAtivos.filter(c => c.percentual_atual >= c.percentual_contratado);
    
    return {
      totalProdutos: produtos.length,
      estoqueLojaQtd: totalEstoqueLojaQtd,
      estoqueDepositoQtd: totalEstoqueDepositoQtd,
      produtosVencendo: vencendo.length,
      produtosVencidos: vencidos.length,
      contratosAtivos: contratosAtivos.length,
      contratosCumpridos: contratosCumpridos.length,
      percentualCumprimento: contratosAtivos.length > 0 ? Math.round((contratosCumpridos.length / contratosAtivos.length) * 100) : 0
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return null;
  }
}

// ========== UTILIDADES ==========
function calcularContrato(quantidade, percentual) {
  return (quantidade * percentual) / 100;
}

function verificarValidadeStatus(dataValidade) {
  const hoje = new Date();
  const data = new Date(dataValidade);
  const dias = Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));
  
  if (dias < 0) return { status: 'vencido', cor: 'red', dias };
  if (dias <= 7) return { status: 'vencendo', cor: 'yellow', dias };
  return { status: 'ok', cor: 'green', dias };
}

function formatarData(dataString) {
  const opcoes = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(dataString).toLocaleDateString('pt-BR', opcoes);
}
