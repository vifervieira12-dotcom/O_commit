// =========================================================
// SCRIPT — INTERAÇÕES DO SITE E CHATBOT VORTEXBOT
// =========================================================

// ---------------------------------------------------------
// 1. FORMULÁRIO DE CONTATO (Página Principal)
// ---------------------------------------------------------
const formContato = document.getElementById("form-contato");
const statusContato = document.getElementById("status-contato");
const campoAssunto = document.getElementById("assunto");
const campoProduto = document.getElementById("produto");

// Se o usuário veio da página Loja clicando em "Pedir / Comprar",
// preenche o campo de assunto com o produto escolhido
const produtoNaUrl = new URLSearchParams(window.location.search).get("produto");
if (campoAssunto && produtoNaUrl) {
    campoAssunto.value = "Pedido: " + produtoNaUrl;
}
if (campoProduto && produtoNaUrl) {
    campoProduto.value = produtoNaUrl;
}

// Ao enviar o formulário, grava os dados no PostgreSQL via rota /api/contato
if (formContato) {
    formContato.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const botao = formContato.querySelector("button[type='submit']");
        const dados = Object.fromEntries(new FormData(formContato));

        botao.disabled = true;
        statusContato.textContent = "Gravando mensagem no banco de dados...";
        statusContato.className = "status-contato";

        try {
            const resposta = await fetch("/api/contato", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Erro ao enviar a mensagem.");
            }

            statusContato.textContent = "Mensagem gravada com sucesso! Em breve entraremos em contato.";
            statusContato.className = "status-contato sucesso";
            formContato.reset();
            if (campoProduto) campoProduto.value = "";
        } catch (erro) {
            statusContato.textContent = erro.message;
            statusContato.className = "status-contato erro";
        } finally {
            botao.disabled = false;
        }
    });
}

// ---------------------------------------------------------
// 2. CHATBOT FLUTUANTE (VortexBot com IA)
// ---------------------------------------------------------
const btnChatFlutuante = document.getElementById("btn-chat-flutuante");
const btnFecharChat = document.getElementById("btn-fechar-chat");
const janelaChat = document.getElementById("janela-chat");
const formChat = document.getElementById("form-chat");
const inputMensagem = document.getElementById("input-mensagem");
const chatMensagens = document.getElementById("chat-mensagens");

let conversaId = null; // Mantém a memória da conversa na API Gemini

// Função simples para adicionar balão de mensagem na janela
function colocarMensagem(texto, tipo) {
    const balao = document.createElement("div");
    balao.className = `mensagem ${tipo}`; // "bot" ou "usuario"
    balao.innerHTML = `<p>${texto}</p>`;
    chatMensagens.appendChild(balao);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
    return balao;
}

// Abrir e fechar o chat
if (btnChatFlutuante && janelaChat) {
    btnChatFlutuante.addEventListener("click", () => {
        janelaChat.classList.toggle("aberta");
        if (janelaChat.classList.contains("aberta")) {
            inputMensagem.focus();
        }
    });
}

if (btnFecharChat && janelaChat) {
    btnFecharChat.addEventListener("click", () => {
        janelaChat.classList.remove("aberta");
    });
}

// Fechar com a tecla ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && janelaChat) {
        janelaChat.classList.remove("aberta");
    }
});

// Envio de mensagem para a IA
if (formChat && inputMensagem) {
    formChat.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const texto = inputMensagem.value.trim();
        if (!texto) return;

        // 1. Mostra a mensagem do usuário na tela
        colocarMensagem(texto, "usuario");
        inputMensagem.value = "";

        // 2. Mostra indicador de que o bot está pensando
        const indicadorPensando = colocarMensagem("<em>Digitando...</em>", "bot");

        inputMensagem.disabled = true;

        try {
            // 3. Envia a pergunta para o nosso backend Node.js (/api/chat)
            const resposta = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mensagem: texto, conversaId: conversaId })
            });

            const dados = await resposta.json();

            // Remove o "Digitando..."
            indicadorPensando.remove();

            if (!resposta.ok) {
                colocarMensagem(dados.erro || "Desculpe, ocorreu um erro ao consultar o assistente.", "bot");
                return;
            }

            // 4. Exibe a resposta real da IA na tela
            conversaId = dados.conversaId || conversaId;
            colocarMensagem(dados.resposta, "bot");
        } catch (erro) {
            indicadorPensando.remove();
            colocarMensagem("Erro de conexão. Verifique se o servidor está ligado (npm start).", "bot");
        } finally {
            inputMensagem.disabled = false;
            inputMensagem.focus();
        }
    });
}
