// =========================================================
// LOJA VORTEX TECH — CATÁLOGO DINÂMICO DO BANCO DE DADOS
// =========================================================
// Este script consulta a rota /api/produtos do nosso servidor Node.js,
// que por sua vez busca os produtos gravados no PostgreSQL.
// =========================================================

const containerProdutos = document.getElementById("containerProdutos");
const inputBusca = document.getElementById("inputBusca");
const selectOrdem = document.getElementById("selectOrdem");
const botoesCategoria = document.querySelectorAll(".btn-cat");

let categoriaAtual = "todos";

// Formata valores numéricos para Real brasileiro (R$)
function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Monta os cards dos produtos na tela
function desenharCardsNaTela(produtos) {
    containerProdutos.innerHTML = "";

    if (!produtos || produtos.length === 0) {
        containerProdutos.innerHTML = `
            <div class="msg-sem-produtos">
                <h3>Nenhum produto encontrado.</h3>
                <p>Tente buscar por outro termo ou selecione outra categoria.</p>
            </div>
        `;
        return;
    }

    produtos.forEach(prod => {
        const card = document.createElement("div");
        card.className = "card-loja";

        card.innerHTML = `
            <div>
                <img src="${prod.imagem}" alt="${prod.nome}" class="img-card-loja">
                <span class="categoria-tag">${prod.categoria}</span>
                <h3>${prod.nome}</h3>
                <p>${prod.descricao}</p>
            </div>
            <div>
                <div class="preco-loja">${formatarMoeda(prod.preco)}</div>
                <a href="index.html?produto=${encodeURIComponent(prod.nome)}#contato" class="btn-comprar-loja">
                    Pedir / Comprar
                </a>
            </div>
        `;

        containerProdutos.appendChild(card);
    });
}

// Busca os produtos no backend (PostgreSQL) com os filtros selecionados
async function buscarProdutosNoBanco() {
    const params = new URLSearchParams();

    if (categoriaAtual !== "todos") {
        params.set("categoria", categoriaAtual);
    }

    const buscaTexto = inputBusca.value.trim();
    if (buscaTexto !== "") {
        params.set("busca", buscaTexto);
    }

    if (selectOrdem.value !== "padrao") {
        params.set("ordem", selectOrdem.value);
    }

    try {
        const resposta = await fetch("/api/produtos?" + params.toString());
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao carregar o catálogo.");
        }

        desenharCardsNaTela(dados.produtos);
    } catch (erro) {
        containerProdutos.innerHTML = `
            <div class="msg-sem-produtos">
                <h3>Erro ao carregar produtos.</h3>
                <p>${erro.message}</p>
            </div>
        `;
    }
}

// ---------------------------------------------------------
// Eventos de Filtro e Busca
// ---------------------------------------------------------

// Ao digitar no campo de busca
let timer = null;
inputBusca.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(buscarProdutosNoBanco, 300);
});

// Ao mudar a ordenação (menor preço / maior preço)
selectOrdem.addEventListener("change", buscarProdutosNoBanco);

// Ao clicar nos botões de categoria (Smartphones, Smartwatches, etc.)
botoesCategoria.forEach(botao => {
    botao.addEventListener("click", () => {
        botoesCategoria.forEach(b => b.classList.remove("ativo"));
        botao.classList.add("ativo");
        categoriaAtual = botao.getAttribute("data-categoria");
        buscarProdutosNoBanco();
    });
});

// Carrega os produtos assim que a página abrir
buscarProdutosNoBanco();
