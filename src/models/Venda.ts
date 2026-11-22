export type StatusVenda = "pendente" | "concluida" | "cancelada";

// Venda de um veiculo para um cliente.
// Os atributos sao privados: so mudam pelos metodos da classe.
export default class Venda {
  private id?: string;
  private veiculoId: string;
  private clienteId: string;
  private vendedor: string;
  private precoVenda: number;
  private formaPagamento: string | null;
  private status: StatusVenda;
  private dataVenda?: string;
  private createdAt?: string;
  private updatedAt?: string;
  // dados do veiculo e do cliente, que vem junto nas consultas
  private veiculo?: { id: string; modelo: string };
  private cliente?: { id: string; nome: string };

  constructor(
    veiculoId: string,
    clienteId: string,
    vendedor: string,
    precoVenda: number,
    formaPagamento?: string | null,
    status: StatusVenda = "pendente"
  ) {
    this.veiculoId = veiculoId;
    this.clienteId = clienteId;
    this.vendedor = vendedor;
    this.precoVenda = precoVenda;
    this.formaPagamento = formaPagamento ?? null;
    this.status = status;
  }

  // Monta a venda a partir de um registro que ja existe no banco
  static restore(
    id: string,
    veiculoId: string,
    clienteId: string,
    vendedor: string,
    precoVenda: number,
    formaPagamento: string | null,
    status: StatusVenda,
    dataVenda?: string,
    createdAt?: string,
    updatedAt?: string,
    veiculo?: { id: string; modelo: string },
    cliente?: { id: string; nome: string }
  ): Venda {
    const venda = new Venda(
      veiculoId,
      clienteId,
      vendedor,
      precoVenda,
      formaPagamento,
      status
    );

    venda.id = id;
    venda.dataVenda = dataVenda;
    venda.createdAt = createdAt;
    venda.updatedAt = updatedAt;
    venda.veiculo = veiculo;
    venda.cliente = cliente;

    return venda;
  }

  getId(): string | undefined {
    return this.id;
  }

  getVeiculoId(): string {
    return this.veiculoId;
  }

  getClienteId(): string {
    return this.clienteId;
  }

  getVendedor(): string {
    return this.vendedor;
  }

  getPrecoVenda(): number {
    return this.precoVenda;
  }

  getFormaPagamento(): string | null {
    return this.formaPagamento;
  }

  getStatus(): StatusVenda {
    return this.status;
  }

  isCancelada(): boolean {
    return this.status === "cancelada";
  }

  changeVendedor(vendedor: string): void {
    this.vendedor = vendedor;
  }

  changePrecoVenda(precoVenda: number): void {
    this.precoVenda = precoVenda;
  }

  changeFormaPagamento(formaPagamento: string | null): void {
    this.formaPagamento = formaPagamento;
  }

  reopen(): void {
    this.status = "pendente";
  }

  conclude(): void {
    this.status = "concluida";
  }

  cancel(): void {
    this.status = "cancelada";
  }

  // Formato devolvido pela API (o mesmo das colunas da tabela)
  toJSON() {
    return {
      id: this.id,
      veiculo_id: this.veiculoId,
      cliente_id: this.clienteId,
      vendedor: this.vendedor,
      preco_venda: this.precoVenda,
      forma_pagamento: this.formaPagamento,
      status: this.status,
      data_venda: this.dataVenda,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      veiculos: this.veiculo,
      clientes: this.cliente,
    };
  }
}
