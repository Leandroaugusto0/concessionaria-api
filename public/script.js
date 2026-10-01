const tabs = document.querySelectorAll("nav button");
const secoes = document.querySelectorAll(".tab");

tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
        secoes.forEach((s) => s.classList.remove("ativo"));
        document.getElementById("tab-" + btn.dataset.tab).classList.add("ativo");
    });
});
secoes[0].classList.add("ativo");

async function carregarMarcas() {
    const res = await fetch("/marcas");
    const marcas = await res.json();
    if (!Array.isArray(marcas)) return;

    const lista = document.getElementById("lista-marcas");
    lista.innerHTML = "";
    marcas.forEach((m) => {
        lista.innerHTML += `<tr>
            <td>${m.nome}</td>
            <td>${m.pais ?? ""}</td>
            <td><button class="remover" onclick="removerMarca('${m.id}')">excluir</button></td>
        </tr>`;
    });

    const select = document.getElementById("select-marca");
    select.innerHTML = marcas.map((m) => `<option value="${m.id}">${m.nome}</option>`).join("");
}

async function removerMarca(id) {
    await fetch(`/marcas/${id}`, { method: "DELETE" });
    carregarMarcas();
}

document.getElementById("form-marca").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    await fetch("/marcas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
    });

    e.target.reset();
    carregarMarcas();
});

async function carregarVeiculos(busca) {
    const url = busca ? `/veiculos?busca=${encodeURIComponent(busca)}` : "/veiculos";
    const res = await fetch(url);
    const veiculos = await res.json();
    if (!Array.isArray(veiculos)) return;

    const lista = document.getElementById("lista-veiculos");
    lista.innerHTML = "";
    veiculos.forEach((v) => {
        lista.innerHTML += `<tr>
            <td>${v.modelo}</td>
            <td>${v.marcas?.nome ?? ""}</td>
            <td>${v.ano}</td>
            <td>R$ ${v.preco}</td>
            <td><button class="remover" onclick="removerVeiculo('${v.id}')">excluir</button></td>
        </tr>`;
    });

    const select = document.getElementById("select-veiculo");
    select.innerHTML = veiculos.map((v) => `<option value="${v.id}">${v.modelo}</option>`).join("");
}

async function removerVeiculo(id) {
    await fetch(`/veiculos/${id}`, { method: "DELETE" });
    carregarVeiculos();
}

document.getElementById("form-veiculo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const dados = Object.fromEntries(form);
    dados.ano = Number(dados.ano);
    dados.preco = Number(dados.preco);

    await fetch("/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    e.target.reset();
    carregarVeiculos();
});

document.getElementById("btn-buscar-veiculo").addEventListener("click", () => {
    carregarVeiculos(document.getElementById("busca-veiculo").value);
});

async function carregarClientes() {
    const res = await fetch("/clientes");
    const clientes = await res.json();
    if (!Array.isArray(clientes)) return;

    const lista = document.getElementById("lista-clientes");
    lista.innerHTML = "";
    clientes.forEach((c) => {
        lista.innerHTML += `<tr>
            <td>${c.nome}</td>
            <td>${c.email ?? ""}</td>
            <td>${c.telefone ?? ""}</td>
            <td><button class="remover" onclick="removerCliente('${c.id}')">excluir</button></td>
        </tr>`;
    });

    const select = document.getElementById("select-cliente");
    select.innerHTML = clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join("");
}

async function removerCliente(id) {
    await fetch(`/clientes/${id}`, { method: "DELETE" });
    carregarClientes();
}

document.getElementById("form-cliente").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    await fetch("/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
    });

    e.target.reset();
    carregarClientes();
});

async function carregarVendas() {
    const res = await fetch("/vendas");
    const vendas = await res.json();
    if (!Array.isArray(vendas)) return;

    const lista = document.getElementById("lista-vendas");
    lista.innerHTML = "";
    vendas.forEach((v) => {
        lista.innerHTML += `<tr>
            <td>${v.veiculos?.modelo ?? ""}</td>
            <td>${v.clientes?.nome ?? ""}</td>
            <td>${v.vendedor}</td>
            <td>R$ ${v.preco_venda}</td>
            <td><button class="remover" onclick="removerVenda('${v.id}')">excluir</button></td>
        </tr>`;
    });
}

async function removerVenda(id) {
    await fetch(`/vendas/${id}`, { method: "DELETE" });
    carregarVendas();
}

document.getElementById("form-venda").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const dados = Object.fromEntries(form);
    dados.preco_venda = Number(dados.preco_venda);

    await fetch("/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    e.target.reset();
    carregarVendas();
});

carregarMarcas();
carregarVeiculos();
carregarClientes();
carregarVendas();
