// Marca de veiculos (Fiat, Toyota...).
// Os atributos sao privados: so mudam pelos metodos da classe.
export default class Marca {
  private id?: string;
  private nome: string;
  private pais: string | null;
  private ativo: boolean;
  private createdAt?: string;
  private updatedAt?: string;

  constructor(nome: string, pais?: string | null, ativo: boolean = true) {
    this.nome = nome;
    this.pais = pais ?? null;
    this.ativo = ativo;
  }

  // Monta a marca a partir de um registro que ja existe no banco
  static restore(
    id: string,
    nome: string,
    pais: string | null,
    ativo: boolean,
    createdAt?: string,
    updatedAt?: string
  ): Marca {
    const marca = new Marca(nome, pais, ativo);

    marca.id = id;
    marca.createdAt = createdAt;
    marca.updatedAt = updatedAt;

    return marca;
  }

  getId(): string | undefined {
    return this.id;
  }

  getNome(): string {
    return this.nome;
  }

  getPais(): string | null {
    return this.pais;
  }

  isAtivo(): boolean {
    return this.ativo;
  }

  rename(nome: string): void {
    this.nome = nome;
  }

  changePais(pais: string | null): void {
    this.pais = pais;
  }

  activate(): void {
    this.ativo = true;
  }

  deactivate(): void {
    this.ativo = false;
  }

  // Formato devolvido pela API (o mesmo das colunas da tabela)
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      pais: this.pais,
      ativo: this.ativo,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
