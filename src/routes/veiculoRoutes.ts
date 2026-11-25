import { Router } from "express";
import VeiculoController from "../controller/VeiculoController.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Veiculo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         marca_id:
 *           type: string
 *           format: uuid
 *         modelo:
 *           type: string
 *           example: ZZ-Modelo de teste
 *         ano:
 *           type: integer
 *           example: 2024
 *         preco:
 *           type: number
 *           example: 25000
 *         km:
 *           type: integer
 *           example: 0
 *         combustivel:
 *           type: string
 *           nullable: true
 *           example: Flex
 *         cor:
 *           type: string
 *           nullable: true
 *           example: Azul
 *         disponivel:
 *           type: boolean
 *           example: true
 *         ativo:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         marcas:
 *           type: object
 *           nullable: true
 *           description: Resumo da marca incluído nas consultas de veículo.
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             nome:
 *               type: string
 *     VeiculoEntrada:
 *       type: object
 *       required:
 *         - marca_id
 *         - modelo
 *         - ano
 *         - preco
 *       properties:
 *         marca_id:
 *           type: string
 *           format: uuid
 *         modelo:
 *           type: string
 *           maxLength: 150
 *           example: ZZ-Modelo de teste
 *         ano:
 *           type: integer
 *           minimum: 1950
 *           description: O limite máximo aceito é o ano atual mais um.
 *           example: 2024
 *         preco:
 *           type: number
 *           exclusiveMinimum: 0
 *           example: 25000
 *         km:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *         combustivel:
 *           type: string
 *           nullable: true
 *           example: Flex
 *         cor:
 *           type: string
 *           nullable: true
 *           example: Azul
 *         disponivel:
 *           type: boolean
 *           example: true
 *         ativo:
 *           type: boolean
 *           example: true
 */

/**
 * @openapi
 * /veiculos:
 *   get:
 *     tags: [Veiculos]
 *     summary: Lista veículos
 *     parameters:
 *       - in: query
 *         name: marca_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra veículos por marca.
 *       - in: query
 *         name: disponivel
 *         schema:
 *           type: boolean
 *         description: Filtra veículos disponíveis ou indisponíveis.
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca parte do modelo, sem diferenciar maiúsculas e minúsculas.
 *       - in: query
 *         name: ordenar
 *         schema:
 *           type: string
 *           enum: [preco_asc, preco_desc]
 *         description: Ordena o preço em ordem crescente ou decrescente.
 *     responses:
 *       200:
 *         description: Lista de veículos com o resumo de cada marca
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Veiculo'
 *       400:
 *         description: Filtro inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   post:
 *     tags: [Veiculos]
 *     summary: Cadastra um veículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VeiculoEntrada'
 *     responses:
 *       201:
 *         description: Veículo criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       400:
 *         description: Dados inválidos ou marca inexistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/", VeiculoController.getAll);
router.post("/", VeiculoController.create);

/**
 * @openapi
 * /veiculos/{id}:
 *   get:
 *     tags: [Veiculos]
 *     summary: Busca um veículo pelo id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Veículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       400:
 *         description: Id inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Veículo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   put:
 *     tags: [Veiculos]
 *     summary: Atualiza um veículo
 *     description: marca_id, modelo, ano e preco são obrigatórios no corpo da requisição.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VeiculoEntrada'
 *     responses:
 *       200:
 *         description: Veículo atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Veiculo'
 *       400:
 *         description: Id ou dados inválidos, ou marca inexistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Veículo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   delete:
 *     tags: [Veiculos]
 *     summary: Remove um veículo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Veículo removido
 *       400:
 *         description: Id inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Veículo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       409:
 *         description: Veículo possui vendas vinculadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/:id", VeiculoController.getById);
router.put("/:id", VeiculoController.update);
router.delete("/:id", VeiculoController.remove);

export default router;
