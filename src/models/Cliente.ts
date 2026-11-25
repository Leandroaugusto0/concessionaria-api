// Representa um cliente da concessionária.
export default class Cliente {
  private id?: string;
  private nome: string;
  private email: string | null;
  private telefone: string | null;
  private cpf: string | null;
  private ativo: boolean;
  private createdAt?: string | null;
  private updatedAt?: string | null;

  constructor(
    nome: string,
    email?: string | null,
    telefone?: string | null,
    cpf?: string | null,
    ativo: boolean = true,
  ) {
    this.nome = nome;
    this.email = email ?? null;
    this.telefone = telefone ?? null;
    this.cpf = cpf ?? null;
    this.ativo = ativo;
  }

  static restore(
    id: string,
    nome: string,
    email: string | null,
    telefone: string | null,
    cpf: string | null,
    ativo: boolean,
    createdAt?: string | null,
    updatedAt?: string | null,
  ): Cliente {
    const cliente = new Cliente(nome, email, telefone, cpf, ativo);
    cliente.id = id;
    cliente.createdAt = createdAt;
    cliente.updatedAt = updatedAt;
    return cliente;
  }

  getId(): string | undefined { return this.id; }
  getNome(): string { return this.nome; }
  getEmail(): string | null { return this.email; }
  getTelefone(): string | null { return this.telefone; }
  getCpf(): string | null { return this.cpf; }
  isAtivo(): boolean { return this.ativo; }

  activate(): void { this.ativo = true; }
  deactivate(): void { this.ativo = false; }

  // Mantém o formato original retornado pela API e pelas colunas do Supabase.
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      telefone: this.telefone,
      cpf: this.cpf,
      ativo: this.ativo,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
