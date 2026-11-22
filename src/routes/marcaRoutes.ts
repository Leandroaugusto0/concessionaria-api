import { Router } from "express";
import MarcaController from "../controller/MarcaController.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Marca:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nome:
 *           type: string
 *           example: Fiat
 *         pais:
 *           type: string
 *           nullable: true
 *           example: Italia
 *         ativo:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     MarcaEntrada:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         nome:
 *           type: string
 *           maxLength: 100
 *           example: Fiat
 *         pais:
 *           type: string
 *           example: Italia
 *         ativo:
 *           type: boolean
 *           example: true
 */

/**
 * @openapi
 * /marcas:
 *   get:
 *     tags: [Marcas]
 *     summary: Lista todas as marcas
 *     responses:
 *       200:
 *         description: Lista de marcas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Marca'
 *   post:
 *     tags: [Marcas]
 *     summary: Cadastra uma marca
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarcaEntrada'
 *     responses:
 *       201:
 *         description: Marca criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marca'
 *       400:
 *         description: Dados invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/", MarcaController.getAll);
router.post("/", MarcaController.create);

/**
 * @openapi
 * /marcas/{id}:
 *   get:
 *     tags: [Marcas]
 *     summary: Busca uma marca pelo id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marca encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marca'
 *       400:
 *         description: Id invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Marca nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   put:
 *     tags: [Marcas]
 *     summary: Atualiza uma marca
 *     description: Muda so o que for enviado (pais e ativo sao opcionais).
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
 *             $ref: '#/components/schemas/MarcaEntrada'
 *     responses:
 *       200:
 *         description: Marca atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marca'
 *       400:
 *         description: Id ou dados invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Marca nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *   delete:
 *     tags: [Marcas]
 *     summary: Remove uma marca
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marca removida
 *       400:
 *         description: Id invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       404:
 *         description: Marca nao encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *       409:
 *         description: A marca tem veiculos cadastrados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get("/:id", MarcaController.getById);
router.put("/:id", MarcaController.update);
router.delete("/:id", MarcaController.remove);

export default router;
