import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

// A documentacao de cada rota fica nos comentarios @openapi dos arquivos
// de src/routes. Aqui so ficam as informacoes gerais e o que e comum a todas
// (o formato de erro). Em desenvolvimento le os .ts e no build le os .js.
const pastaRotas = path.join(import.meta.dirname, "..", "routes").replaceAll("\\", "/");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API da Concessionaria",
      version: "1.0.0",
      description:
        "API REST para gerenciar marcas, veiculos, clientes e vendas de uma concessionaria.",
    },
    servers: [{ url: "/", description: "Servidor atual" }],
    tags: [
      { name: "Marcas", description: "Marcas de veiculos" },
      { name: "Veiculos", description: "Veiculos do estoque" },
      { name: "Clientes", description: "Clientes da concessionaria" },
      { name: "Vendas", description: "Vendas de veiculos para clientes" },
    ],
    components: {
      schemas: {
        Erro: {
          type: "object",
          properties: {
            message: { type: "string", example: "Registro nao encontrado." },
          },
        },
      },
    },
  },
  apis: [`${pastaRotas}/*Routes.{ts,js}`],
});

export default swaggerSpec;
