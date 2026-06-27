// ========== GERAÇÃO DE RELATÓRIO PDF ==========
async function gerarRelatorioPDF() {
  const produtos = await listarProdutos();
  const estoqueLojaList = await listarEstoqueLojaCompleto();
  const estoqueDepositoList = await listarEstoqueDepositoCompleto();
  const validades = await listarValidadesDB();
  const contratos = await listarContratos();
  const stats = await obterEstatisticas();
  
  const doc = new jsPDF();
  let y = 20;
  
  // Título
  doc.setFontSize(16);
  doc.text('RELATÓRIO DE CONTROLE DE ESTOQUE E CONTRATOS', 20, y);
  y += 10;
  
  // Data
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
  y += 8;
  
  // RESUMO EXECUTIVO
  doc.setFontSize(12);
  doc.text('RESUMO EXECUTIVO', 20, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Total de Produtos: ${stats.totalProdutos}`, 25, y);
  y += 5;
  doc.text(`Estoque Loja: ${stats.estoqueLojaQtd} unidades`, 25, y);
  y += 5;
  doc.text(`Estoque Depósito: ${stats.estoqueDepositoQtd} unidades`, 25, y);
  y += 5;
  doc.text(`Produtos Vencendo: ${stats.produtosVencendo}`, 25, y);
  y += 5;
  doc.text(`Produtos Vencidos: ${stats.produtosVencidos}`, 25, y);
  y += 5;
  doc.text(`Contratos Cumpridos: ${stats.contratosCumpridos}/${stats.contratosAtivos}`, 25, y);
  y += 8;
  
  // CONTRATOS
  doc.setFontSize(12);
  doc.text('CONTRATOS', 20, y);
  y += 6;
  doc.setFontSize(9);
  
  contratos.forEach(c => {
    const percentual = Math.round((c.percentual_atual / c.percentual_contratado) * 100);
    doc.text(`${c.nome} - ${c.tipo}`, 25, y);
    y += 4;
    doc.text(`Contratado: ${c.percentual_contratado}% | Atual: ${c.percentual_atual.toFixed(1)}% | Status: ${c.status}`, 30, y);
    y += 5;
  });
  
  y += 2;
  
  // PRODUTOS VENCENDO/VENCIDOS
  doc.setFontSize(12);
  doc.text('VALIDADES', 20, y);
  y += 6;
  doc.setFontSize(9);
  
  validades.forEach(v => {
    const { status, dias } = verificarValidadeStatus(v.data_validade);
    if (status !== 'ok') {
      doc.text(`${v.produtos.nome} - ${formatarData(v.data_validade)} (${dias} dias)`, 25, y);
      y += 4;
    }
  });
  
  doc.save(`relatorio-ambev-${new Date().getTime()}.pdf`);
}

// ========== MENSAGEM WHATSAPP ==========
async function gerarMensagemWhatsApp() {
  const stats = await obterEstatisticas();
  const contratos = await listarContratos();
  const validades = await listarValidadesDB();
  const estoqueLojaList = await listarEstoqueLojaCompleto();
  
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
  
  const produtosFaltando = estoqueLojaList.filter(e => e.quantidade === 0);
  
  let mensagem = '📊 *RELATÓRIO DE CONTROLE - AmBev*\n\n';
  mensagem += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
  mensagem += `⏰ Hora: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
  
  mensagem += '📈 *ESTOQUE*\n';
  mensagem += `🏪 Loja: ${stats.estoqueLojaQtd} unidades\n`;
  mensagem += `🏢 Depósito: ${stats.estoqueDepositoQtd} unidades\n`;
  mensagem += `📦 Total: ${stats.estoqueLojaQtd + stats.estoqueDepositoQtd} unidades\n\n`;
  
  mensagem += '📋 *CONTRATOS*\n';
  mensagem += `✅ Cumpridos: ${stats.contratosCumpridos}/${stats.contratosAtivos}\n`;
  mensagem += `📊 Taxa de Cumprimento: ${stats.percentualCumprimento}%\n\n`;
  
  contratos.forEach(c => {
    if (c.status === 'ativo') {
      const cumprimento = Math.round((c.percentual_atual / c.percentual_contratado) * 100);
      const emoji = cumprimento >= 100 ? '✅' : '⚠️';
      mensagem += `${emoji} ${c.nome}: ${cumprimento}%\n`;
    }
  });
  
  mensagem += '\n⚠️ *VALIDADES*\n';
  
  if (vencidos.length > 0) {
    mensagem += `🔴 *Vencidos:* ${vencidos.length}\n`;
    vencidos.slice(0, 5).forEach(v => {
      mensagem += `  • ${v.produtos.nome} - ${formatarData(v.data_validade)}\n`;
    });
  }
  
  if (vencendo.length > 0) {
    mensagem += `🟡 *Vencendo (7 dias):* ${vencendo.length}\n`;
    vencendo.slice(0, 5).forEach(v => {
      const { dias } = verificarValidadeStatus(v.data_validade);
      mensagem += `  • ${v.produtos.nome} - ${formatarData(v.data_validade)} (${dias} dias)\n`;
    });
  }
  
  if (produtosFaltando.length > 0) {
    mensagem += `\n❌ *FALTANDO NA LOJA:*\n`;
    produtosFaltando.slice(0, 5).forEach(p => {
      mensagem += `  • ${p.produtos.nome}\n`;
    });
  }
  
  mensagem += `\n✨ Relatório gerado automaticamente\n`;
  
  return mensagem;
}

// ========== COPIAR PARA ÁREA DE TRANSFERÊNCIA ==========
async function copiarMensagemWhatsApp() {
  const mensagem = await gerarMensagemWhatsApp();
  navigator.clipboard.writeText(mensagem).then(() => {
    mostrarNotificacao('✓ Mensagem copiada para área de transferência!', 'success');
  }).catch(() => {
    mostrarNotificacao('✗ Erro ao copiar', 'error');
  });
}

function mostrarNotificacao(mensagem, tipo = 'info') {
  const notif = document.createElement('div');
  notif.className = `fixed top-4 right-4 p-4 rounded-lg text-white font-semibold notification-${tipo} z-50`;
  notif.textContent = mensagem;
  
  if (tipo === 'success') notif.style.backgroundColor = '#10b981';
  if (tipo === 'error') notif.style.backgroundColor = '#ef4444';
  if (tipo === 'info') notif.style.backgroundColor = '#3b82f6';
  
  document.body.appendChild(notif);
  
  setTimeout(() => notif.remove(), 3000);
}
