// ========== NAVEGAÇÃO ==========
function mudarPagina(pagina) {
  // Esconder todas as páginas
  document.querySelectorAll('.page-content').forEach(el => el.style.display = 'none');
  
  // Mostrar página selecionada
  const paginaElement = document.getElementById(pagina);
  if (paginaElement) {
    paginaElement.style.display = 'block';
  }
  
  // Atualizar nav ativo
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-page="${pagina}"]`).classList.add('active');
  
  // Recarregar dados da página
  carregarDadosPagina(pagina);
}

async function carregarDadosPagina(pagina) {
  try {
    if (pagina === 'dashboard') {
      await atualizarDashboard();
    } else if (pagina === 'produtos') {
      await atualizarListaProdutos();
    } else if (pagina === 'estoque') {
      await atualizarEstoques();
    } else if (pagina === 'validades') {
      await atualizarListaValidades();
      await preencherSelectProdutosValidades();
    } else if (pagina === 'contratos') {
      await atualizarListaContratos();
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// ========== DASHBOARD ==========
async function atualizarDashboard() {
  try {
    const stats = await obterEstatisticas();
    const contratos = await listarContratos();
    const validades = await listarValidadesDB();
    
    // Atualizar cards
    document.getElementById('totalProdutos').textContent = stats.totalProdutos;
    document.getElementById('estoqueLojaQtd').textContent = stats.estoqueLojaQtd;
    document.getElementById('estoqueDepositoQtd').textContent = stats.estoqueDepositoQtd;
    document.getElementById('produtosVencendo').textContent = stats.produtosVencendo;
    document.getElementById('produtosVencidos').textContent = stats.produtosVencidos;
    document.getElementById('percentualCumprimento').textContent = stats.percentualCumprimento + '%';
    
    // Contratos ativos
    const contratosAtivos = contratos.filter(c => c.status === 'ativo');
    let contratosList = '<div style="space-y: 12px;">';
    contratosAtivos.forEach(c => {
      const percentual = Math.round((c.percentual_atual / c.percentual_contratado) * 100);
      const corBg = percentual >= 100 ? '#d1fae5' : '#fef3c7';
      const corText = percentual >= 100 ? '#065f46' : '#92400e';
      
      contratosList += `
        <div style="margin-bottom: 15px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong>${c.nome}</strong>
            <span style="background: ${corBg}; color: ${corText}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${percentual}%</span>
          </div>
          <div style="background: white; border-radius: 6px; height: 6px; overflow: hidden; margin-bottom: 8px;">
            <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${Math.min(percentual, 100)}%;"></div>
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            <span style="font-weight: 600;">Contratado:</span> ${c.percentual_contratado}% | 
            <span style="font-weight: 600;">Atual:</span> ${c.percentual_atual.toFixed(1)}%
          </div>
        </div>
      `;
    });
    contratosList += '</div>';
    document.getElementById('contratosList').innerHTML = contratosList || '<p style="color: #9ca3af; text-align: center;">Nenhum contrato ativo</p>';
    
    // Próximos vencimentos
    const hoje = new Date();
    const proximosDias = new Date();
    proximosDias.setDate(proximosDias.getDate() + 7);
    
    const vencendo = validades.filter(v => {
      const data = new Date(v.data_validade);
      return data >= hoje && data <= proximosDias;
    }).sort((a, b) => new Date(a.data_validade) - new Date(b.data_validade));
    
    const vencidos = validades.filter(v => {
      const data = new Date(v.data_validade);
      return data < hoje;
    });
    
    let vencimentosList = '<div style="space-y: 12px;">';
    
    if (vencidos.length > 0) {
      vencidos.forEach(v => {
        vencimentosList += `
          <div style="margin-bottom: 10px; padding: 10px; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
            <div style="color: #991b1b; font-weight: 600;">${v.produtos.nome}</div>
            <div style="color: #7f1d1d; font-size: 12px;">🔴 Vencido em ${formatarData(v.data_validade)}</div>
          </div>
        `;
      });
    }
    
    vencendo.forEach(v => {
      const { dias } = verificarValidadeStatus(v.data_validade);
      vencimentosList += `
        <div style="margin-bottom: 10px; padding: 10px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <div style="color: #92400e; font-weight: 600;">${v.produtos.nome}</div>
          <div style="color: #b45309; font-size: 12px;">⏰ Vence em ${dias} dia(s) - ${formatarData(v.data_validade)}</div>
        </div>
      `;
    });
    
    vencimentosList += '</div>';
    document.getElementById('proximosVencimentos').innerHTML = vencimentosList || '<p style="color: #9ca3af; text-align: center;">Nenhum vencimento próximo</p>';
    
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  }
}

// ========== PRODUTOS ==========
async function adicionarProdutoUI() {
  const nome = document.getElementById('nomeProduto').value.trim();
  const marca = document.getElementById('marcaProduto').value.trim();
  const categoria = document.getElementById('categoriaProduto').value.trim();
  const qtdLoja = parseInt(document.getElementById('qtdLojaInicial').value) || 0;
  const qtdDeposito = parseInt(document.getElementById('qtdDepositoInicial').value) || 0;
  
  if (!nome || !marca) {
    mostrarNotificacao('✗ Preencha nome e marca do produto', 'error');
    return;
  }
  
  try {
    const produto = await adicionarProduto(nome, marca, categoria || null);
    // Salvar quantidades iniciais no estoque
    if (qtdLoja > 0) await atualizarEstoqueLojaDB(produto.id, qtdLoja);
    if (qtdDeposito > 0) await atualizarEstoqueDepositoDB(produto.id, qtdDeposito);
    mostrarNotificacao('✓ Produto adicionado com sucesso!', 'success');
    document.getElementById('nomeProduto').value = '';
    document.getElementById('marcaProduto').value = '';
    document.getElementById('categoriaProduto').value = '';
    document.getElementById('qtdLojaInicial').value = '0';
    document.getElementById('qtdDepositoInicial').value = '0';
    await atualizarListaProdutos();
  } catch (error) {
    mostrarNotificacao('✗ Erro ao adicionar produto', 'error');
  }
}

async function atualizarListaProdutos() {
  try {
    const produtos = await listarProdutos();
    let html = '';
    
    produtos.forEach(p => {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb; hover:background: #f9fafb;">
          <div>
            <div style="font-weight: 600; color: #111827;">${p.nome}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${p.marca}${p.categoria ? ' • ' + p.categoria : ''}</div>
          </div>
          <button onclick="deletarProdutoUI(${p.id})" style="background: #fee2e2; color: #991b1b; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">Deletar</button>
        </div>
      `;
    });
    
    document.getElementById('listaProdutos').innerHTML = html || '<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhum produto cadastrado</p>';
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
  }
}

async function deletarProdutoUI(id) {
  if (confirm('Deseja deletar este produto?')) {
    try {
      await deletarProduto(id);
      mostrarNotificacao('✓ Produto deletado', 'success');
      await atualizarListaProdutos();
    } catch (error) {
      mostrarNotificacao('✗ Erro ao deletar', 'error');
    }
  }
}

// ========== ESTOQUES ==========
async function atualizarEstoques() {
  await atualizarEstoqueLojaUI();
  await atualizarEstoqueDepositoUI();
}

async function atualizarEstoqueLojaUI() {
  try {
    const estoque = await listarEstoqueLojaCompleto();
    let html = '';
    
    estoque.forEach(e => {
      const classe = e.quantidade === 0 ? 'badge-danger' : e.quantidade < 5 ? 'badge-warning' : 'badge-success';
      html += `
        <div style="margin-bottom: 15px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong>${e.produtos.nome}</strong>
            <div class="${classe}">${e.quantidade} un</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="aumentarEstoqueLojaUI(${e.produto_id})" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 12px;">+1</button>
            <button onclick="diminuirEstoqueLojaUI(${e.produto_id})" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 12px;">-1</button>
          </div>
        </div>
      `;
    });
    
    document.getElementById('estoqueLojaUI').innerHTML = html || '<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhum estoque registrado</p>';
  } catch (error) {
    console.error('Erro ao atualizar estoque loja:', error);
  }
}

async function atualizarEstoqueDepositoUI() {
  try {
    const estoque = await listarEstoqueDepositoCompleto();
    let html = '';
    
    estoque.forEach(e => {
      html += `
        <div style="margin-bottom: 15px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong>${e.produtos.nome}</strong>
            <div class="badge-success">${e.quantidade} un</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="aumentarEstoqueDepositoUI(${e.produto_id})" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 12px;">+1</button>
            <button onclick="diminuirEstoqueDepositoUI(${e.produto_id})" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 12px;">-1</button>
          </div>
        </div>
      `;
    });
    
    document.getElementById('estoqueDepositoUI').innerHTML = html || '<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhum estoque registrado</p>';
  } catch (error) {
    console.error('Erro ao atualizar estoque depósito:', error);
  }
}

async function aumentarEstoqueLojaUI(produtoId) {
  const estoque = await obterEstoqueLojaDB(produtoId);
  await atualizarEstoqueLojaDB(produtoId, estoque.quantidade + 1);
  await atualizarEstoqueLojaUI();
}

async function diminuirEstoqueLojaUI(produtoId) {
  const estoque = await obterEstoqueLojaDB(produtoId);
  if (estoque.quantidade > 0) {
    await atualizarEstoqueLojaDB(produtoId, estoque.quantidade - 1);
    await atualizarEstoqueLojaUI();
  }
}

async function aumentarEstoqueDepositoUI(produtoId) {
  const estoque = await obterEstoqueDepositoDB(produtoId);
  await atualizarEstoqueDepositoDB(produtoId, estoque.quantidade + 1);
  await atualizarEstoqueDepositoUI();
}

async function diminuirEstoqueDepositoUI(produtoId) {
  const estoque = await obterEstoqueDepositoDB(produtoId);
  if (estoque.quantidade > 0) {
    await atualizarEstoqueDepositoDB(produtoId, estoque.quantidade - 1);
    await atualizarEstoqueDepositoUI();
  }
}

// ========== VALIDADES ==========
async function preencherSelectProdutosValidades() {
  try {
    const produtos = await listarProdutos();
    let html = '<option value="">Selecione um produto</option>';
    produtos.forEach(p => {
      html += `<option value="${p.id}">${p.nome}</option>`;
    });
    document.getElementById('produtoValidadeSelect').innerHTML = html;
  } catch (error) {
    console.error('Erro ao preencher select:', error);
  }
}

async function adicionarValidadeUI() {
  const produtoId = parseInt(document.getElementById('produtoValidadeSelect').value);
  const dataValidade = document.getElementById('dataValidadeInput').value;
  const quantidade = parseInt(document.getElementById('qtdValidadeInput').value) || 1;
  
  if (!produtoId || !dataValidade) {
    mostrarNotificacao('✗ Preencha todos os campos', 'error');
    return;
  }
  
  try {
    await adicionarValidade(produtoId, dataValidade, quantidade);
    mostrarNotificacao('✓ Validade registrada!', 'success');
    document.getElementById('produtoValidadeSelect').value = '';
    document.getElementById('dataValidadeInput').value = '';
    document.getElementById('qtdValidadeInput').value = '';
    await atualizarListaValidades();
  } catch (error) {
    mostrarNotificacao('✗ Erro ao registrar validade', 'error');
  }
}

async function atualizarListaValidades() {
  try {
    const validades = await listarValidadesDB();
    let html = '';
    
    validades.forEach(v => {
      const { status, cor, dias } = verificarValidadeStatus(v.data_validade);
      const coresBg = { red: '#fee2e2', yellow: '#fef3c7', green: '#d1fae5' };
      const coresText = { red: '#991b1b', yellow: '#92400e', green: '#065f46' };
      
      html += `
        <div style="margin-bottom: 12px; padding: 12px; background: #f3f4f6; border-left: 4px solid ${cor === 'red' ? '#dc2626' : cor === 'yellow' ? '#f59e0b' : '#10b981'}; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600;">${v.produtos.nome}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                ${formatarData(v.data_validade)} • ${v.quantidade} un • ${dias} dia(s)
              </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="background: ${coresBg[cor]}; color: ${coresText[cor]}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                ${status === 'vencido' ? '❌ Vencido' : status === 'vencendo' ? '⚠️ Vencendo' : '✓ OK'}
              </span>
              <button onclick="deletarValidadeUI(${v.id})" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 14px;">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });
    
    document.getElementById('listaValidades').innerHTML = html || '<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhuma validade registrada</p>';
  } catch (error) {
    console.error('Erro ao listar validades:', error);
  }
}

async function deletarValidadeUI(id) {
  if (confirm('Deseja deletar este registro de validade?')) {
    try {
      await deletarValidade(id);
      mostrarNotificacao('✓ Validade deletada', 'success');
      await atualizarListaValidades();
    } catch (error) {
      mostrarNotificacao('✗ Erro ao deletar', 'error');
    }
  }
}

// ========== CONTRATOS ==========
async function adicionarContratoUI() {
  const nome = document.getElementById('nomeContrato').value.trim();
  const percentual = parseFloat(document.getElementById('percentualContratado').value);
  const tipo = document.getElementById('tipoContrato').value;
  
  if (!nome || !percentual || !tipo) {
    mostrarNotificacao('✗ Preencha todos os campos', 'error');
    return;
  }
  
  try {
    const percAtual = parseFloat(document.getElementById('percentualAtualNovo').value) || 0;
    await adicionarContrato(nome, percentual, percAtual, tipo, 'ativo');
    mostrarNotificacao('✓ Contrato adicionado!', 'success');
    document.getElementById('nomeContrato').value = '';
    document.getElementById('percentualContratado').value = '';
    document.getElementById('tipoContrato').value = '';
    document.getElementById('percentualAtualNovo').value = '0';
    await atualizarListaContratos();
  } catch (error) {
    mostrarNotificacao('✗ Erro ao adicionar contrato', 'error');
  }
}

async function atualizarListaContratos() {
  try {
    const contratos = await listarContratos();
    let html = '';
    
    contratos.forEach(c => {
      const percentual = Math.round((c.percentual_atual / c.percentual_contratado) * 100);
      const corBg = percentual >= 100 ? '#d1fae5' : '#fef3c7';
      const corText = percentual >= 100 ? '#065f46' : '#92400e';
      
      html += `
        <div style="margin-bottom: 15px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div>
              <strong style="font-size: 16px;">${c.nome}</strong>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${c.tipo}</div>
            </div>
            <span style="background: ${corBg}; color: ${corText}; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">${percentual}% da meta</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 4px;">
            <span>🎯 Meta: ${c.percentual_contratado}%</span>
            <span>📊 Realizado: ${c.percentual_atual.toFixed(1)}%</span>
          </div>
          <div style="background: white; border-radius: 6px; height: 10px; overflow: hidden; margin-bottom: 12px; border: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${Math.min(percentual, 100)}%; transition: width 0.3s;"></div>
          </div>
          <div id="edit-area-${c.id}" style="display:none; margin-bottom: 8px;">
            <label style="font-size: 11px; color: #6b7280; display:block; margin-bottom: 4px;">Novo % Realizado</label>
            <input type="number" id="input-${c.id}" placeholder="Ex: 42.5" value="${c.percentual_atual}" step="0.1" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid #667eea; border-radius: 6px; margin-bottom: 8px; font-size: 13px; box-sizing: border-box;">
            <button onclick="salvarEdicaoContrato(${c.id})" style="width:100%; background:#667eea; color:white; border:none; padding:9px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;">💾 Salvar</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="toggleEditarContrato(${c.id})" style="flex:1; background:#f3f4f6; color:#374151; border:1px solid #d1d5db; padding:9px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px;">✏️ Editar</button>
            <button onclick="deletarContratoUI(${c.id})" style="flex:1; background:#fee2e2; color:#991b1b; border:none; padding:9px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px;">🗑️ Deletar</button>
          </div>
        </div>
      `;
    });
    
    document.getElementById('listaContratos').innerHTML = html || '<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhum contrato cadastrado</p>';
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
  }
}

function toggleEditarContrato(id) {
  const area = document.getElementById(`edit-area-${id}`);
  if (area) area.style.display = area.style.display === 'none' ? 'block' : 'none';
}

async function salvarEdicaoContrato(id) {
  const novoPercentual = parseFloat(document.getElementById(`input-${id}`).value);
  if (isNaN(novoPercentual)) {
    mostrarNotificacao('✗ Digite um valor válido', 'error');
    return;
  }
  try {
    await atualizarContrato(id, novoPercentual, 'ativo');
    mostrarNotificacao('✓ Contrato atualizado!', 'success');
    await atualizarListaContratos();
  } catch (error) {
    mostrarNotificacao('✗ Erro ao atualizar', 'error');
  }
}

async function atualizarContratoUI(id) {
  await salvarEdicaoContrato(id);
}

async function deletarContratoUI(id) {
  if (confirm('Deseja deletar este contrato?')) {
    try {
      await deletarContrato(id);
      mostrarNotificacao('✓ Contrato deletado', 'success');
      await atualizarListaContratos();
    } catch (error) {
      mostrarNotificacao('✗ Erro ao deletar', 'error');
    }
  }
}

// ========== CALCULADORA ==========
function calcularFormula() {
  const quantidade = parseFloat(document.getElementById('calcQuantidade').value);
  const percentual = parseFloat(document.getElementById('calcPercentual').value);
  
  if (isNaN(quantidade) || isNaN(percentual)) {
    mostrarNotificacao('✗ Digite valores válidos', 'error');
    return;
  }
  
  const resultado = calcularContrato(quantidade, percentual);
  document.getElementById('resultadoCalc').textContent = resultado.toFixed(2);
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const conectado = await testarConexaoSupabase();
    if (conectado) {
      await atualizarDashboard();
    } else {
      mostrarNotificacao('⚠️ Verifique as credenciais do Supabase', 'error');
    }
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
});
