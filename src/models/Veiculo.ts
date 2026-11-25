export interface MarcaResumo {
  id: string;
  nome: string;
}

// Representa um veículo do estoque da concessionária.
export default class Veiculo {
  private id?: string;
  private marcaId: string;
  private modelo: string;
  private ano: number;
  private preco: number;
  private km: number;
  private combustivel: string | null;
  private cor: string | null;
  private disponivel: boolean;
  private ativo: boolean;
  private createdAt?: string | null;
  private updatedAt?: string | null;
  private marca?: MarcaResumo | null;

  constructor(
    marcaId: string,
    modelo: string,
    ano: number,
    preco: number,
    km: number = 0,
    combustivel?: string | null,
    cor?: string | null,
    disponivel: boolean = true,
    ativo: boolean = true,
  ) {
    this.marcaId = marcaId;
    this.modelo = modelo;
    this.ano = ano;
    this.preco = preco;
    this.km = km;
    this.combustivel = combustivel ?? null;
    this.cor = cor ?? null;
    this.disponivel = disponivel;
    this.ativo = ativo;
  }

  static restore(
    id: string,
    marcaId: string,
    modelo: string,
    ano: number,
    preco: number,
    km: number,
    combustivel: string | null,
    cor: string | null,
    disponivel: boolean,
    ativo: boolean,
    createdAt?: string | null,
    updatedAt?: string | null,
    marca?: MarcaResumo | null,
  ): Veiculo {
    const veiculo = new Veiculo(
      marcaId,
      modelo,
      ano,
      preco,
      km,
      combustivel,
      cor,
      disponivel,
      ativo,
    );
    veiculo.id = id;
    veiculo.createdAt = createdAt;
    veiculo.updatedAt = updatedAt;
    veiculo.marca = marca;
    return veiculo;
  }

  getId(): string | undefined { return this.id; }
  getMarcaId(): string { return this.marcaId; }
  getModelo(): string { return this.modelo; }
  getAno(): number { return this.ano; }
  getPreco(): number { return this.preco; }
  getKm(): number { return this.km; }
  getCombustivel(): string | null { return this.combustivel; }
  getCor(): string | null { return this.cor; }
  isDisponivel(): boolean { return this.disponivel; }
  isAtivo(): boolean { return this.ativo; }

  rename(modelo: string): void { this.modelo = modelo; }
  changeMarca(marcaId: string): void { this.marcaId = marcaId; }
  changeAno(ano: number): void { this.ano = ano; }
  changePreco(preco: number): void { this.preco = preco; }
  changeKm(km: number): void { this.km = km; }
  changeCombustivel(combustivel: string | null): void { this.combustivel = combustivel; }
  changeCor(cor: string | null): void { this.cor = cor; }

  markAvailable(): void { this.disponivel = true; }
  markUnavailable(): void { this.disponivel = false; }
  activate(): void { this.ativo = true; }
  deactivate(): void { this.ativo = false; }

  // Mantém os nomes das colunas e o relacionamento usados pela API.
  toJSON() {
    return {
      id: this.id,
      marca_id: this.marcaId,
      modelo: this.modelo,
      ano: this.ano,
      preco: this.preco,
      km: this.km,
      combustivel: this.combustivel,
      cor: this.cor,
      disponivel: this.disponivel,
      ativo: this.ativo,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      marcas: this.marca,
    };
  }
}
