"use strict";

/* =====================================================================
   Utilidades
   ===================================================================== */

const TIMEOUT_MS = 15000;
const ANO_MINIMO = 1950;
const PRECO_MAXIMO = 99999999.99; // limite da coluna numeric(10,2)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

// Escapa texto antes de colocar em innerHTML (evita quebrar o HTML e XSS)
function esc(valor) {
    const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(valor ?? "").replace(/[&<>"']/g, (c) => mapa[c]);
}

function moeda(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? BRL.format(n) : "—";
}

/* =====================================================================
   Camada de API: todo erro vira um ApiError com mensagem legível
   ===================================================================== */

class ApiError extends Error {
    constructor(mensagem, { status = 0, tipo = "http" } = {}) {
        super(mensagem);
        this.name = "ApiError";
        this.status = status; // 0 quando nem chegou a ter resposta
        this.tipo = tipo;     // "http" | "rede" | "timeout" | "resposta"
    }
}

function mensagemPorStatus(status) {
    if (status === 400) return "A requisição foi recusada pelo servidor.";
    if (status === 404) return "Item ou rota não encontrado.";
    if (status === 409) return "A operação conflita com dados já existentes.";
    if (status === 502 || status === 503 || status === 504) return "O servidor está indisponível no momento.";
    if (status >= 500) return "Erro interno do servidor.";
    return `O servidor respondeu com erro (HTTP ${status}).`;
}

async function api(metodo, url, corpo) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
    let res;
    let texto;

    try {
        res = await fetch(url, {
            method: metodo,
            headers: corpo !== undefined ? { "Content-Type": "application/json" } : undefined,
            body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
            signal: controle.signal,
        });
        texto = await res.text();
    } catch (err) {
        marcarStatusApi("falha");
        if (err.name === "AbortError") {
            throw new ApiError("O servidor demorou demais para responder. Tente novamente.", { tipo: "timeout" });
        }
        throw new ApiError(
            "Não foi possível conectar ao servidor. Confira se a API está rodando e se esta página foi aberta pelo endereço do servidor.",
            { tipo: "rede" }
        );
    } finally {
        clearTimeout(timer);
    }

    marcarStatusApi(res.status >= 500 ? "instavel" : "ok");

    let dados = null;
    if (texto) {
        try { dados = JSON.parse(texto); } catch { dados = null; }
    }

    if (!res.ok) {
        const mensagem = typeof dados?.message === "string" && dados.message ? dados.message : mensagemPorStatus(res.status);
        throw new ApiError(mensagem, { status: res.status });
    }

    if (texto && dados === null) {
        throw new ApiError(`Resposta inesperada do servidor (HTTP ${res.status}).`, { status: res.status, tipo: "resposta" });
    }

    return dados;
}

async function buscarLista(url) {
    const dados = await api("GET", url);
    if (!Array.isArray(dados)) {
        throw new ApiError("Resposta inesperada do servidor: era esperada uma lista.", { tipo: "resposta" });
    }
    return dados;
}

function textoDoErro(err) {
    if (err instanceof ApiError) return err.message;
    return `Erro inesperado: ${err?.message ?? err}`;
}

/* =====================================================================
   Feedback: status da API, avisos, alertas de seção e de formulário
   ===================================================================== */

const TEXTOS_STATUS = {
    ok: "API conectada",
    falha: "Sem conexão com a API",
    instavel: "API respondeu com erro",
};

function marcarStatusApi(estadoApi) {
    $("#status-api").dataset.estado = estadoApi;
    $("#status-api-texto").textContent = TEXTOS_STATUS[estadoApi];
}

// Aviso flutuante. Erros ficam mais tempo na tela; sucesso some rápido.
function avisar(titulo, detalhe = "", tipo = "erro") {
    const area = $("#avisos");
    const el = document.createElement("div");
    el.className = `aviso ${tipo === "ok" ? "aviso-ok" : "aviso-erro"}`;
    el.setAttribute("role", tipo === "ok" ? "status" : "alert");
    el.innerHTML = `<div class="aviso-corpo"><strong></strong><span></span></div>
        <button type="button" class="aviso-fechar" aria-label="Fechar aviso">×</button>`;
    $("strong", el).textContent = titulo;
    const spanDetalhe = $("span", el);
    spanDetalhe.textContent = detalhe;
    spanDetalhe.hidden = !detalhe;

    const fechar = () => el.remove();
    $(".aviso-fechar", el).addEventListener("click", fechar);
    setTimeout(fechar, tipo === "ok" ? 4000 : 12000);

    area.append(el);
    while (area.children.length > 4) area.firstElementChild.remove();
}

function avisarErro(titulo, err) {
    console.error(titulo, err);
    avisar(titulo, textoDoErro(err), "erro");
}

function mostrarErroSecao(chave, titulo, err) {
    console.error(titulo, err);
    const el = $(`#erro-${chave}`);
    el.innerHTML = `<div><strong>${esc(titulo)}</strong><span class="detalhe">${esc(textoDoErro(err))}</span></div>
        <button type="button" class="btn btn-secundario" data-acao="recarregar" data-chave="${chave}">Tentar novamente</button>`;
    el.hidden = false;
}

function limparErroSecao(chave) {
    const el = $(`#erro-${chave}`);
    el.hidden = true;
    el.innerHTML = "";
}

/* ---------- erros por campo e do formulário ---------- */

function mostrarErroCampo(input, mensagem) {
    const campo = input.closest(".campo");
    let p = $(".campo-erro", campo);
    if (!p) {
        p = document.createElement("p");
        p.className = "campo-erro";
        p.id = `${input.id}-erro`;
        campo.append(p);
    }
    p.textContent = mensagem;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", p.id);
}

function limparErroCampo(input) {
    $(".campo-erro", input.closest(".campo"))?.remove();
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
}

function mostrarErroFormulario(form, titulo, err) {
    console.error(titulo, err);
    const el = $(".form-alerta", form);
    el.innerHTML = `<div><strong>${esc(titulo)}</strong><span class="detalhe">${esc(textoDoErro(err))}</span></div>`;
    el.hidden = false;
}

function limparErrosFormulario(form) {
    form.querySelectorAll("[aria-invalid]").forEach(limparErroCampo);
    const el = $(".form-alerta", form);
    el.hidden = true;
    el.innerHTML = "";
}

// Limpa o erro de um campo assim que a pessoa volta a editá-lo
document.addEventListener("input", (e) => {
    if (e.target.matches("[aria-invalid]")) limparErroCampo(e.target);
});
document.addEventListener("change", (e) => {
    if (e.target.matches("select[aria-invalid]")) limparErroCampo(e.target);
});

/* =====================================================================
   Confirmação de exclusão
   ===================================================================== */

function confirmar(titulo, texto) {
    return new Promise((resolve) => {
        const dialogo = $("#dialogo-confirmar");
        $("#dialogo-titulo").textContent = titulo;
        $("#dialogo-texto").textContent = texto;
        dialogo.returnValue = "";
        dialogo.addEventListener("close", () => resolve(dialogo.returnValue === "confirmar"), { once: true });
        dialogo.showModal();
    });
}

/* =====================================================================
   Estado e configuração de cada entidade
   ===================================================================== */

const estado = { marcas: [], veiculos: [], clientes: [], vendas: [] };

// Listas completas, usadas para preencher os <select> dos formulários
// (a tabela de veículos pode estar filtrada pela busca)
const opcoes = { marcas: [], veiculos: [], clientes: [] };

let buscaAplicada = "";

const ENTIDADES = {
    marcas: {
        rota: "/marcas",
        plural: "as marcas",
        artigo: "a marca",
        removida: "Marca removida.",
        colunas: 2,
        celulas: (m) => [esc(m.nome), esc(m.pais ?? "")],
        rotulo: (m) => m.nome,
        vazio: () => "Nenhuma marca cadastrada ainda. Use o formulário acima para adicionar a primeira.",
    },
    veiculos: {
        rota: "/veiculos",
        plural: "os veículos",
        artigo: "o veículo",
        removida: "Veículo removido.",
        colunas: 5,
        numericas: [2, 3],
        celulas: (v) => [
            esc(v.modelo), esc(v.marcas?.nome ?? "—"), esc(v.ano), esc(moeda(v.preco)),
            v.disponivel ? '<span class="selo selo-ok">Disponível</span>' : '<span class="selo selo-vendido">Vendido</span>',
        ],
        rotulo: (v) => v.modelo,
        vazio: () =>
            buscaAplicada
                ? `Nenhum veículo encontrado para “${buscaAplicada}”.`
                : "Nenhum veículo cadastrado ainda. Cadastre uma marca e depois adicione o primeiro veículo.",
    },
    clientes: {
        rota: "/clientes",
        plural: "os clientes",
        artigo: "o cliente",
        removida: "Cliente removido.",
        colunas: 3,
        celulas: (c) => [esc(c.nome), esc(c.email ?? ""), esc(c.telefone ?? "")],
        rotulo: (c) => c.nome,
        vazio: () => "Nenhum cliente cadastrado ainda.",
    },
    vendas: {
        rota: "/vendas",
        plural: "as vendas",
        artigo: "a venda",
        removida: "Venda removida.",
        colunas: 4,
        numericas: [3],
        celulas: (v) => [esc(v.veiculos?.modelo ?? "—"), esc(v.clientes?.nome ?? "—"), esc(v.vendedor), esc(moeda(v.preco_venda))],
        rotulo: (v) => `${v.veiculos?.modelo ?? "veículo"} para ${v.clientes?.nome ?? "cliente"}`,
        vazio: () => "Nenhuma venda registrada ainda.",
    },
};

/* =====================================================================
   Renderização
   ===================================================================== */

function renderTabela(chave) {
    const ent = ENTIDADES[chave];
    const tbody = $(`#lista-${chave}`);
    const lista = estado[chave];

    if (lista.length === 0) {
        tbody.innerHTML = `<tr class="linha-vazia"><td colspan="${ent.colunas + 1}">${esc(ent.vazio())}</td></tr>`;
        return;
    }

    tbody.innerHTML = lista
        .map((item) => {
            const celulas = ent.celulas(item)
                .map((html, i) => `<td${ent.numericas?.includes(i) ? ' class="num"' : ""}>${html}</td>`)
                .join("");
            return `<tr>${celulas}<td class="acoes">
                <button type="button" class="btn-excluir" data-acao="excluir" data-chave="${chave}" data-id="${esc(item.id)}"
                    aria-label="Excluir ${esc(ent.rotulo(item))}">Excluir</button>
            </td></tr>`;
        })
        .join("");
}

function renderErroCarga(chave) {
    const ent = ENTIDADES[chave];
    $(`#lista-${chave}`).innerHTML =
        `<tr class="linha-vazia"><td colspan="${ent.colunas + 1}">Não foi possível exibir ${esc(ent.plural)}.</td></tr>`;
}

function preencherSelect(select, itens, { placeholder, vazio, rotulo }) {
    const valorAtual = select.value;
    const primeira = itens.length ? placeholder : vazio;
    select.innerHTML =
        `<option value="">${esc(primeira)}</option>` +
        itens.map((i) => `<option value="${esc(i.id)}">${esc(rotulo(i))}</option>`).join("");
    if (itens.some((i) => i.id === valorAtual)) select.value = valorAtual;
}

function atualizarSelects() {
    preencherSelect($("#select-marca"), opcoes.marcas, {
        placeholder: "Selecione a marca",
        vazio: "Nenhuma marca cadastrada",
        rotulo: (m) => m.nome,
    });
    preencherSelect($("#select-veiculo"), opcoes.veiculos.filter((v) => v.disponivel), {
        placeholder: "Selecione o veículo",
        vazio: "Nenhum veículo disponível",
        rotulo: (v) => `${v.modelo} (${v.marcas?.nome ?? "sem marca"}, ${v.ano})`,
    });
    preencherSelect($("#select-cliente"), opcoes.clientes, {
        placeholder: "Selecione o cliente",
        vazio: "Nenhum cliente cadastrado",
        rotulo: (c) => c.nome,
    });
}

/* =====================================================================
   Carregamento das listas
   ===================================================================== */

const sequencia = {}; // descarta respostas antigas quando há cargas em sequência

async function carregar(chave, query = "") {
    const ent = ENTIDADES[chave];
    const minha = (sequencia[chave] = (sequencia[chave] ?? 0) + 1);

    try {
        const lista = await buscarLista(ent.rota + query);
        if (minha !== sequencia[chave]) return;

        estado[chave] = lista;
        if (!query && chave in opcoes) opcoes[chave] = lista;

        limparErroSecao(chave);
        renderTabela(chave);
        atualizarSelects();
    } catch (err) {
        if (minha !== sequencia[chave]) return;
        mostrarErroSecao(chave, `Não foi possível carregar ${ent.plural}`, err);
        renderErroCarga(chave);
    }
}

async function carregarVeiculos() {
    const query = buscaAplicada ? `?busca=${encodeURIComponent(buscaAplicada)}` : "";
    await carregar("veiculos", query);

    // Com busca ativa a tabela está filtrada, mas o formulário de vendas precisa de todos os veículos
    if (query) {
        try {
            opcoes.veiculos = await buscarLista("/veiculos");
            atualizarSelects();
        } catch (err) {
            avisarErro("Não foi possível atualizar a lista de veículos do formulário de vendas", err);
        }
    }
}

function recarregar(chave) {
    if (chave === "vendas") return Promise.allSettled([carregar("vendas"), carregarVeiculos()]);
    return chave === "veiculos" ? carregarVeiculos() : carregar(chave);
}

function carregarTudo() {
    return Promise.allSettled(Object.keys(ENTIDADES).map(recarregar));
}

/* =====================================================================
   Exclusão
   ===================================================================== */

async function excluir(chave, id, botao) {
    const ent = ENTIDADES[chave];
    const item = estado[chave].find((i) => i.id === id);
    const nome = item ? ent.rotulo(item) : "";

    const confirmado = await confirmar(
        `Excluir ${ent.artigo}${nome ? ` “${nome}”` : ""}?`,
        "Essa ação não pode ser desfeita."
    );
    if (!confirmado) return;

    botao.disabled = true;
    try {
        await api("DELETE", `${ent.rota}/${encodeURIComponent(id)}`);
        avisar(ent.removida, "", "ok");
    } catch (err) {
        avisarErro(`Não foi possível excluir ${ent.artigo}`, err);
    } finally {
        // Recarrega sempre: se deu erro, a lista pode estar desatualizada (ex.: item já removido)
        recarregar(chave);
    }
}

/* =====================================================================
   Formulários: validação no front + erros devolvidos pela API
   ===================================================================== */

function lerCampos(form) {
    const dados = {};
    for (const [nome, valor] of new FormData(form)) {
        dados[nome] = typeof valor === "string" ? valor.trim() : valor;
    }
    return dados;
}

function validarPreco(texto, nomeCampo) {
    if (!texto) return `Informe ${nomeCampo}.`;
    const n = Number(texto);
    if (!Number.isFinite(n) || n <= 0) return "O valor deve ser maior que zero.";
    if (n > PRECO_MAXIMO) return `O valor máximo é ${moeda(PRECO_MAXIMO)}.`;
    return null;
}

const FORMULARIOS = {
    marcas: {
        seletor: "#form-marca",
        rota: "/marcas",
        sucesso: "Marca adicionada.",
        falha: "Não foi possível adicionar a marca",
        validar(d) {
            const erros = {};
            if (!d.nome) erros.nome = "Informe o nome da marca.";
            else if (d.nome.length > 100) erros.nome = "O nome deve ter no máximo 100 caracteres.";
            if (d.pais && d.pais.length > 100) erros.pais = "O país deve ter no máximo 100 caracteres.";
            return erros;
        },
        corpo: (d) => ({ nome: d.nome, pais: d.pais || undefined }),
        aposSucesso: () => carregar("marcas"),
        aposFalha: () => carregar("marcas"),
    },

    veiculos: {
        seletor: "#form-veiculo",
        rota: "/veiculos",
        sucesso: "Veículo adicionado.",
        falha: "Não foi possível adicionar o veículo",
        validar(d) {
            const erros = {};
            const anoMaximo = new Date().getFullYear() + 1;

            if (!d.marca_id) {
                erros.marca_id = opcoes.marcas.length ? "Selecione a marca." : "Cadastre uma marca antes de adicionar veículos.";
            }

            if (!d.modelo) erros.modelo = "Informe o modelo.";
            else if (d.modelo.length > 150) erros.modelo = "O modelo deve ter no máximo 150 caracteres.";

            const ano = Number(d.ano);
            if (!d.ano) erros.ano = "Informe o ano.";
            else if (!Number.isInteger(ano) || ano < ANO_MINIMO || ano > anoMaximo) {
                erros.ano = `Informe um ano entre ${ANO_MINIMO} e ${anoMaximo}.`;
            }

            const erroPreco = validarPreco(d.preco, "o preço");
            if (erroPreco) erros.preco = erroPreco;

            return erros;
        },
        corpo: (d) => ({ marca_id: d.marca_id, modelo: d.modelo, ano: Number(d.ano), preco: Number(d.preco) }),
        aposSucesso: () => carregarVeiculos(),
        aposFalha: () => carregar("marcas"),
    },

    clientes: {
        seletor: "#form-cliente",
        rota: "/clientes",
        sucesso: "Cliente adicionado.",
        falha: "Não foi possível adicionar o cliente",
        validar(d) {
            const erros = {};
            if (!d.nome) erros.nome = "Informe o nome do cliente.";
            else if (d.nome.length > 150) erros.nome = "O nome deve ter no máximo 150 caracteres.";
            if (d.email && !EMAIL_REGEX.test(d.email)) erros.email = "E-mail inválido. Exemplo: nome@dominio.com.";
            if (d.telefone && d.telefone.length > 20) erros.telefone = "O telefone deve ter no máximo 20 caracteres.";
            return erros;
        },
        corpo: (d) => ({ nome: d.nome, email: d.email || undefined, telefone: d.telefone || undefined }),
        aposSucesso: () => carregar("clientes"),
        aposFalha: () => carregar("clientes"),
    },

    vendas: {
        seletor: "#form-venda",
        rota: "/vendas",
        sucesso: "Venda registrada.",
        falha: "Não foi possível registrar a venda",
        validar(d) {
            const erros = {};
            if (!d.veiculo_id) {
                erros.veiculo_id = opcoes.veiculos.some((v) => v.disponivel) ? "Selecione o veículo." : "Nenhum veículo disponível para venda.";
            }
            if (!d.cliente_id) {
                erros.cliente_id = opcoes.clientes.length ? "Selecione o cliente." : "Cadastre um cliente antes de registrar vendas.";
            }
            if (!d.vendedor) erros.vendedor = "Informe o vendedor.";
            else if (d.vendedor.length > 150) erros.vendedor = "O nome do vendedor deve ter no máximo 150 caracteres.";

            const erroPreco = validarPreco(d.preco_venda, "o preço da venda");
            if (erroPreco) erros.preco_venda = erroPreco;

            return erros;
        },
        corpo: (d) => ({
            veiculo_id: d.veiculo_id,
            cliente_id: d.cliente_id,
            vendedor: d.vendedor,
            preco_venda: Number(d.preco_venda),
        }),
        aposSucesso: () => Promise.allSettled([carregar("vendas"), carregarVeiculos()]),
        // veículo ou cliente podem ter sido removidos por outra pessoa
        aposFalha: () => Promise.allSettled([carregarVeiculos(), carregar("clientes")]),
    },
};

function ligarFormulario(cfg) {
    const form = $(cfg.seletor);
    const botao = $("button[type='submit']", form);
    const rotuloBotao = botao.textContent;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        limparErrosFormulario(form);

        const dados = lerCampos(form);
        const erros = cfg.validar(dados);
        const nomes = Object.keys(erros);

        if (nomes.length > 0) {
            nomes.forEach((nome) => mostrarErroCampo(form.elements[nome], erros[nome]));
            form.elements[nomes[0]].focus();
            return;
        }

        botao.disabled = true;
        botao.textContent = "Salvando…";

        try {
            await api("POST", cfg.rota, cfg.corpo(dados));
            form.reset();
            avisar(cfg.sucesso, "", "ok");
            cfg.aposSucesso();
        } catch (err) {
            mostrarErroFormulario(form, cfg.falha, err);
            // Se a API recusou por causa dos dados (ex.: marca que não existe mais), atualiza as listas
            if (err instanceof ApiError && err.status >= 400 && err.status < 500) cfg.aposFalha();
        } finally {
            botao.disabled = false;
            botao.textContent = rotuloBotao;
        }
    });
}

Object.values(FORMULARIOS).forEach(ligarFormulario);

/* =====================================================================
   Busca de veículos
   ===================================================================== */

const formBusca = $("#form-busca-veiculo");
const campoBusca = $("#busca-veiculo");
const botaoLimpar = $("#btn-limpar-busca");

formBusca.addEventListener("submit", (e) => {
    e.preventDefault();
    buscaAplicada = campoBusca.value.trim();
    botaoLimpar.hidden = !buscaAplicada;
    carregarVeiculos();
});

botaoLimpar.addEventListener("click", () => {
    buscaAplicada = "";
    campoBusca.value = "";
    botaoLimpar.hidden = true;
    carregarVeiculos();
    campoBusca.focus();
});

/* =====================================================================
   Cliques em botões de ação (excluir / tentar novamente)
   ===================================================================== */

document.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-acao]");
    if (!botao) return;

    if (botao.dataset.acao === "excluir") {
        excluir(botao.dataset.chave, botao.dataset.id, botao);
    } else if (botao.dataset.acao === "recarregar") {
        recarregar(botao.dataset.chave);
    }
});

/* =====================================================================
   Abas
   ===================================================================== */

const abas = [...document.querySelectorAll("[role='tab']")];

function ativarAba(nome, { foco = false } = {}) {
    abas.forEach((aba) => {
        const ativa = aba.dataset.tab === nome;
        aba.setAttribute("aria-selected", String(ativa));
        aba.tabIndex = ativa ? 0 : -1;
        $(`#tab-${aba.dataset.tab}`).classList.toggle("ativo", ativa);
        if (ativa && foco) aba.focus();
    });
    try { history.replaceState(null, "", `#${nome}`); } catch { /* ex.: página aberta via file:// */ }
}

abas.forEach((aba) => aba.addEventListener("click", () => ativarAba(aba.dataset.tab)));

$(".abas").addEventListener("keydown", (e) => {
    const atual = abas.findIndex((a) => a.getAttribute("aria-selected") === "true");
    let destino = null;
    if (e.key === "ArrowRight") destino = (atual + 1) % abas.length;
    if (e.key === "ArrowLeft") destino = (atual - 1 + abas.length) % abas.length;
    if (e.key === "Home") destino = 0;
    if (e.key === "End") destino = abas.length - 1;
    if (destino === null) return;
    e.preventDefault();
    ativarAba(abas[destino].dataset.tab, { foco: true });
});

/* =====================================================================
   Erros inesperados do próprio front e perda de conexão
   ===================================================================== */

window.addEventListener("error", (e) => {
    avisar("Erro inesperado na página", e.message || "Veja o console do navegador para mais detalhes.");
});

window.addEventListener("unhandledrejection", (e) => {
    console.error("Promise rejeitada sem tratamento:", e.reason);
    avisar("Erro inesperado na página", textoDoErro(e.reason));
});

window.addEventListener("offline", () => {
    marcarStatusApi("falha");
    avisar("Você está sem internet", "As alterações não serão enviadas até a conexão voltar.");
});

window.addEventListener("online", () => {
    avisar("Conexão restabelecida", "Atualizando os dados.", "ok");
    carregarTudo();
});

/* =====================================================================
   Início
   ===================================================================== */

const abaInicial = abas.some((a) => a.dataset.tab === location.hash.slice(1)) ? location.hash.slice(1) : "marcas";
ativarAba(abaInicial);
carregarTudo();