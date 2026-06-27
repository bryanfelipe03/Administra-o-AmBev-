# AmBev Control - Sistema de Produtividade para Promotor

Sistema moderno, bonito e prático para gerenciamento de estoque, contratos e validades em uma loja.

## 📋 Funcionalidades

✅ **Produtos** - Cadastro de produtos com marca e categoria  
✅ **Estoque da Loja** - Controle rápido com indicadores visuais  
✅ **Estoque do Depósito** - Gerenciamento separado  
✅ **Controle de Validades** - Com alertas automáticos por cor  
✅ **Contratos** - Acompanhamento com gráficos de progresso  
✅ **Calculadora** - Fórmula: (Qtd × %) ÷ 100  
✅ **Dashboard** - Visão completa em tempo real  
✅ **PDF** - Geração de relatórios  
✅ **WhatsApp** - Copiar mensagem formatada  

## 🚀 Como Configurar

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta (grátis)
3. Crie um novo projeto
4. Anote a URL e a chave pública (anon key)

### 2. Criar Tabelas
1. No Supabase, vá para **SQL Editor**
2. Cole o conteúdo do arquivo `criar-tabelas.sql`
3. Execute o SQL
4. Aguarde até aparecer "Success"

### 3. Configurar a Aplicação
1. Abra o arquivo `config.js`
2. Substitua:
   - `SUPABASE_URL` pela URL do seu projeto
   - `SUPABASE_KEY` pela sua chave anon
   
Exemplo:
```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_KEY = 'sua-chave-anon-aqui';
```

### 4. Abrir a Aplicação
1. Abra o arquivo `index.html` no navegador
2. A aplicação funcionará offline até conectar ao Supabase
3. Tudo será sincronizado automaticamente

## 📱 Como Usar

### Dashboard
- Visualize resumo executivo
- Acompanhe contratos em tempo real
- Veja próximos vencimentos

### Produtos
- Adicione novos produtos com nome, marca e categoria
- Delete produtos quando necessário

### Estoques
- Atualize quantidade na loja com +/- 1
- Atualize quantidade do depósito com +/- 1
- Indicadores coloridos mostram nível de estoque

### Validades
- Registre a data de validade de cada produto
- Veja alertas automáticos:
  - 🔴 Vermelho = Vencido
  - 🟡 Amarelo = Vencendo em até 7 dias
  - 🟢 Verde = OK

### Contratos
- Cadastre contratos com percentual esperado
- Atualize percentual atual em tempo real
- Barra de progresso mostra cumprimento

### Calculadora
- Use fórmula: (Quantidade × Percentual) ÷ 100
- Para qualquer tipo de contrato

### Relatórios
- **PDF**: Gera relatório completo com todos os dados
- **WhatsApp**: Copia mensagem formatada com status

## 🔐 Segurança

Esta aplicação usa Supabase com:
- ✅ Chave pública (anon) - segura para uso em browser
- ✅ Row Level Security desativado para uso pessoal
- ✅ Nenhum dado pessoal sensível

Para produção, habilite RLS no Supabase.

## 📱 Responsividade

- ✅ Mobile (celular)
- ✅ Tablet
- ✅ Desktop

A navegação lateral collapsa em telas pequenas.

## 🎨 Design

- Interface moderna com gradiente roxo
- Cards com sombra suave
- Transições suaves
- Indicadores coloridos
- Tipografia clara

## ⚙️ Tecnologias

- HTML5
- CSS3
- JavaScript ES6+
- Supabase (PostgreSQL)
- TailwindCSS
- jsPDF para relatórios

## 📧 Suporte

Qualquer dúvida, verifique:
1. Se as credenciais do Supabase estão corretas
2. Se as tabelas foram criadas
3. Se o navegador não está bloqueando requisições

## 📝 Versão

V1.0 - Primeira versão completa

---

Desenvolvido para aumentar sua produtividade como promotor AmBev! 🚀
