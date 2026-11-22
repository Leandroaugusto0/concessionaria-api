import { Router } from "express";
import VendaController from "../controller/VendaController.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Venda:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         veiculo_id:
 *           type: string
 *           format: uuid
 *         cliente_id:
 *           type: string
 *           format: uuid
 *         vendedor:
 *           type: string
 *           example: Maria
 *         preco_venda:
 *           type: number
 *           example: 48000
 *         forma_pagamento:
 *           type: string
 *           nullable: true
 *           example: pix
 *         status:
 *           type: string
 *           enum: [pendente, concluida, cancelada]
 *         data_venda:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         veiculos:
 *           type: object
 *           description: Dados do veiculo (so nas consultas)
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             modelo:
 *               type: string
 *         clientes:
 *           type: object
 *           description: Dados do cliente (so nas consultas)
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             nome:
 *               type: string
 *     VendaCadastro:
 *       type: object
 *       required:
 *         - veiculo_id
 *         - cliente_id
 *         - vendedor
 *         - preco_venda
 *       properties:
 *         veiculo_id:
 *           type: string
 *           format: uuid
 *         cliente_id:
 *           type: string
 *           format: uuid
 *         vendedor:
 *           type: string
 *           maxLength: 150
 *           example: Maria
 *         preco_venda:
 *           type: number
 *           minimum: 0.01
 *           example: 48000
 *         forma_pagamento:
 *           type: string
 *           maxLength: 30
 *           example: pix
 *         status:
 *           type: string
 *           enum: [pendente, concluida, cancelada]
 *           default: pendente
 *     VendaAtualizacao:
 *       type: object
 *       required:
 *         - vendedor
 *         - preco_venda
 *       description: O veiculo e o cliente nao podem ser trocados depois da venda registrada.
 *       properties:
 *         vendedor:
 *           type: string
 *           maxLength: 150
 *           example: Maria
 *         preco_venda:
 *           type: number
 *           minimum: 0.01
 *           example: 47000
 *         forma_pagamento:
 *           type: string
 *           maxLength: 30
 *           example: financiamento
 *         status:
 *           type: string
 *           enum: [pendente, concluida, cancelada]
 */

/**
 * @openapi
 * /vendas:
 *   get:
 *     tags: [Vendas]
 *     summary: Lista todas as vendas
 *     responses:
 *       200:
 *         description: Lista de vendas, com o modelo do veiculo e o nome do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Venda'
 *   post:
 *     tags: [Vendas]
 *     summary: Registra uma venda
 *     description: >
 *       O veiculo precisa existir e estar disponivel. Depois da venda ele fica
 *       indisponivel (a nao ser que a venda seja criada como cancelada).
 *       Se duas vendas do mesmo veiculo chegarem juntas, so uma e aceita.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VendaCadastro'
 *     responses:
 *       201:
 *         description: Venda registrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venda'
 *       400:
 *         description: Dados invalidos, veiculo ou cliente inexistente, ou veiculo indisponivel
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/", VendaController.getAll);
router.post("/", VendaController.create);

/**
 * @openapi
 * /vendas/{id}:
 *   get:
 *     tags: [Vendas]
 *     summary: Busca uma venda pelo id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Venda encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venda'
 *       400:
 *         description: Id invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Venda nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   put:
 *     tags: [Vendas]
 *     summary: Atualiza uma venda
 *     description: >
 *       Cancelar a venda devolve o veiculo ao estoque. Reativar uma venda
 *       cancelada so e possivel se o veiculo ainda estiver disponivel.
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
 *             $ref: '#/components/schemas/VendaAtualizacao'
 *     responses:
 *       200:
 *         description: Venda atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venda'
 *       400:
 *         description: Id ou dados invalidos, ou veiculo indisponivel para reativar a venda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Venda nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   delete:
 *     tags: [Vendas]
 *     summary: Remove uma venda
 *     description: Se a venda ainda valia (nao estava cancelada), o veiculo volta a ficar disponivel.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Venda removida
 *       400:
 *         description: Id invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Venda nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/:id", VendaController.getById);
router.put("/:id", VendaController.update);
router.delete("/:id", VendaController.remove);

export default router;
