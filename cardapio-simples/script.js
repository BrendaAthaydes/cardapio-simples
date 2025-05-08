/**
 * script.js refinado — Cardápio Digital
 * Desenvolvido para reutilização profissional com efeito sanfona, carrinho funcional e integração com WhatsApp
 */

const carrinho = [];
let produtosJSON = [];

const areaProdutos = document.getElementById('area-produtos');
const listaCarrinho = document.getElementById('lista-carrinho');
const totalCarrinho = document.getElementById('total-carrinho');
const contadorCarrinho = document.getElementById('contador-carrinho');
const btnFinalizar = document.getElementById('finalizar');
const btnFechar = document.getElementById('fechar-carrinho');
const botaoCarrinho = document.getElementById('abrir-carrinho');
const painelCarrinho = document.getElementById('carrinho');
const main = document.getElementById('main');
const campoTroco = document.getElementById('campo-troco');
const selectPagamento = document.getElementById('forma-pagamento');

// Abrir/fechar carrinho
botaoCarrinho?.addEventListener('click', () => {
  painelCarrinho.classList.add('ativo');
  main.classList.add('com-carrinho-aberto');
  document.body.classList.add('carrinho-ativo');
});
btnFechar?.addEventListener('click', () => {
  painelCarrinho.classList.remove('ativo');
  main.classList.remove('com-carrinho-aberto');
  document.body.classList.remove('carrinho-ativo');
});

// Exibir campo troco se pagamento em dinheiro
selectPagamento?.addEventListener('change', () => {
  campoTroco.classList.toggle('visivel', selectPagamento.value === 'Dinheiro');
});

window.addEventListener("DOMContentLoaded", () => {
  if (selectPagamento?.value === 'Dinheiro') {
    campoTroco.classList.add('visivel');
  }
  carregarCardapio();
});

// Carregar cardápio com efeito sanfona (inicia fechado)
async function carregarCardapio() {
  try {
    const res = await fetch('cardapio.json');
    const categorias = await res.json();
    produtosJSON = categorias.flatMap(c => c.itens.map(i => ({ ...i, categoria: c.categoria })));

    areaProdutos.innerHTML = '';

    categorias.forEach(secao => {
      const secaoHTML = document.createElement('section');
      secaoHTML.className = 'secao-produtos';
      secaoHTML.dataset.categoria = secao.categoria;

      const titulo = document.createElement('h2');
      titulo.className = 'categoria';
      titulo.textContent = secao.categoria;
      

      secaoHTML.appendChild(titulo);

      if (!secao.itens.length) {
        const vazio = document.createElement('p');
        vazio.textContent = "Nenhum item disponível nesta categoria.";
        vazio.style.fontStyle = "italic";
        vazio.style.color = "#888";
        vazio.style.margin = "8px 16px";
        secaoHTML.appendChild(vazio);
        areaProdutos.appendChild(secaoHTML);
        return;
      }

      secao.itens.forEach(produto => {
        const card = document.createElement('article');
        card.className = 'card-produto';

        const imagem = produto.imagem
          ? `<img src="${produto.imagem}" alt="${produto.nome}" class="imagem-produto">`
          : '';
        const info = document.createElement('div');
        info.className = 'card-info';
        info.innerHTML = `
          <h3>${produto.nome}</h3>
          <p>${produto.descricao || ''}</p>
        `;

        const botao = document.createElement('button');
        botao.className = 'btn-carrinho';
        botao.textContent = `Adicionar — R$${produto.preco.toFixed(2)}`;
        botao.addEventListener('click', () => adicionarAoCarrinho(produto.nome, produto.preco));

        card.innerHTML = imagem;
        card.appendChild(info);
        card.appendChild(botao);

        secaoHTML.appendChild(card);
      });

      areaProdutos.appendChild(secaoHTML);
    });

    if (window.lucide) lucide.createIcons();
  } catch (error) {
    console.error("Erro ao carregar o cardápio:", error);
    areaProdutos.innerHTML = '<p>Erro ao carregar cardápio.</p>';
  }
}

// Adicionar ao carrinho
function adicionarAoCarrinho(nome, preco) {
  carrinho.push({ nome, preco });
  atualizarCarrinho();
  feedbackCarrinho();
}

// Atualizar carrinho
function atualizarCarrinho() {
  listaCarrinho.innerHTML = '';
  const agrupado = {};
  let total = 0;

  carrinho.forEach(item => {
    if (!agrupado[item.nome]) {
      agrupado[item.nome] = { quantidade: 0, preco: item.preco };
    }
    agrupado[item.nome].quantidade += 1;
  });

  Object.entries(agrupado).forEach(([nome, item]) => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;

    const li = document.createElement('li');
    li.innerHTML = `
      <span>${nome}<br><small>R$ ${subtotal.toFixed(2)}</small></span>
      <div>
        <button onclick="alterarQuantidade('${nome}', -1)">–</button>
        <span>${item.quantidade}</span>
        <button onclick="alterarQuantidade('${nome}', 1)">+</button>
      </div>
    `;
    listaCarrinho.appendChild(li);
  });

  totalCarrinho.textContent = total.toFixed(2);
  contadorCarrinho.textContent = carrinho.length;
  atualizarResumoMobile();
}

// Alterar quantidade do item
function alterarQuantidade(nome, delta) {
  if (delta > 0) {
    const item = carrinho.find(p => p.nome === nome);
    carrinho.push({ nome: item.nome, preco: item.preco });
  } else {
    const index = carrinho.findIndex(p => p.nome === nome);
    if (index !== -1) carrinho.splice(index, 1);
  }
  atualizarCarrinho();
}

// Gerar mensagem para WhatsApp
function gerarMensagemWhatsApp() {
  const agrupado = {};
  carrinho.forEach(item => {
    if (!agrupado[item.nome]) agrupado[item.nome] = { quantidade: 0, preco: item.preco };
    agrupado[item.nome].quantidade += 1;
  });

  let texto = 'Pedido via cardápio digital:\n\n';
  let total = 0;

  for (const nome in agrupado) {
    const item = agrupado[nome];
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    texto += `${item.quantidade}x ${nome} - R$${item.preco.toFixed(2)}\n`;
  }

  texto += `\nTotal: R$${total.toFixed(2)}\n\n`;

  const tipo = document.getElementById('tipo-pedido')?.value || '';
  const forma = document.getElementById('forma-pagamento')?.value || '';
  const obs = document.getElementById('observacoes')?.value.trim();
  const valorTroco = document.getElementById('valor-troco')?.value;

  if (tipo) texto += `Tipo de pedido: ${tipo}\n`;
  if (forma) texto += `Forma de pagamento: ${forma}\n`;
  if (forma === 'Dinheiro' && valorTroco) {
    const troco = parseFloat(valorTroco) - total;
    texto += `Troco para: R$${parseFloat(valorTroco).toFixed(2)} (Troco: R$${troco.toFixed(2)})\n`;
  }
  if (obs) texto += `Observações: ${obs}\n`;
  texto += '\nEndereço: (informe seu endereço aqui)';

  return texto;
}

// Enviar para WhatsApp
btnFinalizar?.addEventListener('click', () => {
  if (carrinho.length === 0) return alert('Seu carrinho está vazio!');
  const mensagem = gerarMensagemWhatsApp();
  const numero = '5534999999999'; // Número genérico
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
  carrinho.length = 0;
  atualizarCarrinho();
  painelCarrinho.classList.remove('ativo');
  main.classList.remove('com-carrinho-aberto');
  document.body.classList.remove('carrinho-ativo');
});

// Resumo mobile
function atualizarResumoMobile() {
  const resumo = document.getElementById('resumoMobile');
  const qtd = document.getElementById('resumoQtd');
  const total = document.getElementById('resumoTotal');

  if (window.innerWidth <= 600 && carrinho.length > 0) {
    resumo.style.display = 'block';
    qtd.textContent = carrinho.length;
    total.textContent = totalCarrinho.textContent;
  } else {
    resumo.style.display = 'none';
  }
}

window.addEventListener('resize', atualizarResumoMobile);
document.getElementById('resumoMobile')?.addEventListener('click', () => {
  painelCarrinho.classList.add('ativo');
  main.classList.add('com-carrinho-aberto');
  document.body.classList.add('carrinho-ativo');
});

// Feedback visual ao adicionar
function feedbackCarrinho() {
  painelCarrinho.classList.add('shake');
  setTimeout(() => painelCarrinho.classList.remove('shake'), 500);
}