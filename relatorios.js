// ========== HELPERS DE AGRUPAMENTO ==========

// Agrupa uma lista de estoque (loja ou depósito) por produto e devolve
// também o total geral de fardos/soltas.
function agruparEstoquePorProduto(lista) {
  const itens = lista
    .map(e => {
      const upf = e.produtos?.unidades_por_fardo || 1;
      const { fardos, soltas } = calcularFardosSoltas(e.quantidade || 0, upf);
      return {
        nome: e.produtos?.nome || 'Produto',
        marca: e.produtos?.marca || '',
        quantidade: e.quantidade || 0,
        fardos, soltas,
        temFardo: upf > 1
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const totalFardos = itens.reduce((s, i) => s + i.fardos, 0);
  const totalSoltas = itens.reduce((s, i) => s + i.soltas, 0);

  return { itens, totalFardos, totalSoltas };
}

// Agrupa validades por categoria do produto (ex: "Cerveja", "Refrigerante")
function agruparValidadesPorCategoria(validades) {
  const grupos = {};
  validades.forEach(v => {
    const cat = v.produtos?.categoria?.trim() || 'Outros';
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(v);
  });
  // ordena cada grupo por data e os grupos por nome
  Object.values(grupos).forEach(arr => arr.sort((a, b) => new Date(a.data_validade) - new Date(b.data_validade)));
  return Object.keys(grupos).sort().map(cat => ({ categoria: cat, itens: grupos[cat] }));
}

// ========== GERAÇÃO DE RELATÓRIO PDF ==========
async function gerarRelatorioPDF() {
  const estoqueLojaList = await listarEstoqueLojaCompleto();
  const estoqueDepositoList = await listarEstoqueDepositoCompleto();
  const validades = await listarValidadesDB();
  const contratos = await listarContratos();
  const stats = await obterEstatisticas();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 16;
  let y = 18;

  const corPrimaria = [37, 99, 235];
  const corMuted = [107, 114, 128];
  const corVermelho = [220, 38, 38];
  const corAmarelo = [217, 119, 6];
  const corVerde = [22, 163, 74];

  const checkPageBreak = (alturaNecessaria = 10) => {
    if (y + alturaNecessaria > 285) { doc.addPage(); y = 18; }
  };

  const tituloSecao = (texto, emoji = '') => {
    checkPageBreak(14);
    doc.setFillColor(...corPrimaria);
    doc.rect(marginX, y - 5, pageW - marginX * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(`${emoji}  ${texto}`, marginX + 3, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    y += 10;
  };

  // ── CABEÇALHO ──
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...corPrimaria);
  doc.text('RELATÓRIO AMBEV CONTROL', marginX, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...corMuted);
  doc.setFontSize(9);
  y += 6;
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, marginX, y);
  doc.setTextColor(0, 0, 0);
  y += 4;
  doc.setDrawColor(...corPrimaria);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageW - marginX, y);
  y += 10;

  // ── RESUMO EXECUTIVO ──
  tituloSecao('RESUMO EXECUTIVO', '📊');
  doc.setFontSize(10);
  const resumoLinhas = [
    [`Total de Produtos cadastrados`, `${stats.totalProdutos}`],
    [`Produtos vencendo (≤7 dias)`, `${stats.produtosVencendo}`],
    [`Produtos vencidos`, `${stats.produtosVencidos}`],
    [`Contratos cumpridos`, `${stats.contratosCumpridos}/${stats.contratosAtivos} (${stats.percentualCumprimento}%)`],
  ];
  resumoLinhas.forEach(([label, val]) => {
    checkPageBreak();
    doc.setFont(undefined, 'normal');
    doc.text(`•  ${label}:`, marginX + 2, y);
    doc.setFont(undefined, 'bold');
    doc.text(`${val}`, marginX + 95, y);
    doc.setFont(undefined, 'normal');
    y += 6;
  });
  y += 4;

  // ── ESTOQUE ──
  const renderEstoquePDF = (titulo, emoji, dados) => {
    tituloSecao(titulo, emoji);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    checkPageBreak();
    doc.text(`TOTAL GERAL:  ${dados.totalFardos} fardos  +  ${dados.totalSoltas} unidades soltas`, marginX + 2, y);
    y += 8;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...corMuted);
    doc.text('PRODUTOS', marginX + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9.5);
    if (!dados.itens.length) {
      doc.setTextColor(...corMuted);
      doc.text('Nenhum item em estoque.', marginX + 2, y);
      doc.setTextColor(0, 0, 0);
      y += 6;
    }
    dados.itens.forEach(item => {
      checkPageBreak();
      const desc = item.temFardo
        ? `${item.fardos} fardo(s) + ${item.soltas} unidade(s) solta(s)`
        : `${item.soltas} unidade(s)`;
      doc.text(`🍺 ${item.nome}`, marginX + 4, y);
      doc.setTextColor(...corMuted);
      doc.text(desc, marginX + 95, y);
      doc.setTextColor(0, 0, 0);
      y += 5.5;
    });
    y += 4;
  };

  renderEstoquePDF('ESTOQUE — LOJA', '🏪', agruparEstoquePorProduto(estoqueLojaList));
  renderEstoquePDF('ESTOQUE — DEPÓSITO', '🏢', agruparEstoquePorProduto(estoqueDepositoList));

  // ── CONTRATOS ──
  tituloSecao('CONTRATOS', '📋');
  doc.setFontSize(9.5);
  if (!contratos.length) {
    doc.setTextColor(...corMuted);
    doc.text('Nenhum contrato cadastrado.', marginX + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }
  contratos.forEach(c => {
    checkPageBreak(10);
    const pct = c.percentual_contratado > 0 ? Math.round((c.percentual_atual / c.percentual_contratado) * 100) : 0;
    const cor = pct >= 100 ? corVerde : pct >= 70 ? corAmarelo : corVermelho;
    doc.setFont(undefined, 'bold');
    doc.text(`${c.nome}`, marginX + 2, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...corMuted);
    doc.text(`(${c.tipo})`, marginX + 2 + doc.getTextWidth(`${c.nome} `), y);
    doc.setTextColor(...cor);
    doc.setFont(undefined, 'bold');
    doc.text(`${pct}%`, pageW - marginX - 12, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    y += 4.5;
    doc.setFontSize(8.5);
    doc.setTextColor(...corMuted);
    doc.text(`Meta: ${c.percentual_contratado}%  ·  Realizado: ${(c.percentual_atual || 0).toFixed(1)}%  ·  Status: ${c.status}`, marginX + 4, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9.5);
    y += 6;
  });
  y += 2;

  // ── VALIDADES ──
  tituloSecao('VALIDADES', '⏰');
  const gruposValidade = agruparValidadesPorCategoria(validades);
  if (!gruposValidade.length) {
    doc.setFontSize(9.5);
    doc.setTextColor(...corMuted);
    doc.text('Nenhuma validade registrada.', marginX + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }
  gruposValidade.forEach(grupo => {
    checkPageBreak(10);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...corPrimaria);
    doc.text(`🍺 ${grupo.categoria}`, marginX + 2, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9.5);
    y += 6;
    grupo.itens.forEach(v => {
      checkPageBreak();
      const { status, dias } = verificarValidadeStatus(v.data_validade);
      const cor = status === 'vencido' ? corVermelho : status === 'vencendo' ? corAmarelo : corVerde;
      const icon = status === 'vencido' ? '🔴' : status === 'vencendo' ? '🟡' : '🟢';
      doc.text(`${icon} ${v.produtos.nome}`, marginX + 4, y);
      doc.setTextColor(...cor);
      doc.text(`Validade: ${formatarData(v.data_validade)}`, marginX + 95, y);
      doc.setTextColor(0, 0, 0);
      y += 5.5;
    });
    y += 3;
  });

  doc.save(`relatorio-ambev-${new Date().getTime()}.pdf`);
}

// ========== MENSAGEM WHATSAPP ==========
async function gerarMensagemWhatsApp() {
  const stats = await obterEstatisticas();
  const contratos = await listarContratos();
  const validades = await listarValidadesDB();
  const estoqueLojaList = await listarEstoqueLojaCompleto();
  const estoqueDepositoList = await listarEstoqueDepositoCompleto();

  const lojaAgrupada = agruparEstoquePorProduto(estoqueLojaList);
  const depositoAgrupada = agruparEstoquePorProduto(estoqueDepositoList);
  const gruposValidade = agruparValidadesPorCategoria(validades);

  let mensagem = '📊 *RELATÓRIO DE CONTROLE - AmBev*\n';
  mensagem += '━━━━━━━━━━━━━━━━━━━━\n';
  mensagem += `📅 ${new Date().toLocaleDateString('pt-BR')}  ⏰ ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

  // ── ESTOQUE ──
  mensagem += '📦 *ESTOQUE*\n\n';

  const blocoEstoque = (titulo, dados) => {
    let bloco = `${titulo}\n`;
    bloco += `*TOTAL:* ${dados.totalFardos} fardos, ${dados.totalSoltas} unidades soltas\n\n`;
    bloco += `_Produtos:_\n`;
    if (!dados.itens.length) {
      bloco += '  — nenhum item —\n';
    } else {
      dados.itens.forEach(item => {
        const desc = item.temFardo
          ? `${item.fardos} fardos, ${item.soltas} unidades soltas`
          : `${item.soltas} unidades`;
        bloco += `🍺 ${item.nome}: ${desc}\n`;
      });
    }
    return bloco + '\n';
  };

  mensagem += blocoEstoque('🏪 *LOJA*', lojaAgrupada);
  mensagem += blocoEstoque('🏢 *DEPÓSITO*', depositoAgrupada);

  // ── CONTRATOS ──
  mensagem += '📋 *CONTRATOS*\n';
  mensagem += `✅ Cumpridos: ${stats.contratosCumpridos}/${stats.contratosAtivos}  ·  📊 Taxa: ${stats.percentualCumprimento}%\n\n`;
  contratos.forEach(c => {
    if (c.status === 'ativo') {
      const cumprimento = c.percentual_contratado > 0 ? Math.round((c.percentual_atual / c.percentual_contratado) * 100) : 0;
      const emoji = cumprimento >= 100 ? '✅' : cumprimento >= 70 ? '⚠️' : '🔴';
      mensagem += `${emoji} ${c.nome}: ${cumprimento}%\n`;
    }
  });

  // ── VALIDADES ──
  mensagem += '\n⏰ *VALIDADES*\n';
  if (!gruposValidade.length) {
    mensagem += '_Nenhuma validade registrada_\n';
  } else {
    gruposValidade.forEach(grupo => {
      mensagem += `\n🍺 *${grupo.categoria}*\n`;
      grupo.itens.forEach(v => {
        const { status, dias } = verificarValidadeStatus(v.data_validade);
        const icon = status === 'vencido' ? '🔴' : status === 'vencendo' ? '🟡' : '🟢';
        const extra = status === 'vencido' ? ` (vencido há ${Math.abs(dias)}d)` : status === 'vencendo' ? ` (${dias}d restantes)` : '';
        mensagem += `${icon} ${v.produtos.nome} — Validade: ${formatarData(v.data_validade)}${extra}\n`;
      });
    });
  }

  // ── FALTANDO NA LOJA ──
  const produtosFaltando = estoqueLojaList.filter(e => e.quantidade === 0);
  if (produtosFaltando.length > 0) {
    mensagem += '\n❌ *FALTANDO NA LOJA*\n';
    produtosFaltando.forEach(p => {
      mensagem += `  • ${p.produtos.nome}\n`;
    });
  }

  mensagem += '\n━━━━━━━━━━━━━━━━━━━━\n';
  mensagem += '✨ Relatório gerado automaticamente';

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
