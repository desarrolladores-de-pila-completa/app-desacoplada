"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../src/index"));
const db_1 = require("../src/middlewares/db");
const paginaController_1 = require("../src/controllers/paginaController");
describe('API de páginas', () => {
    it('debería registrar un usuario nuevo', async () => {
        const email = `nuevo${Date.now()}@mail.com`;
        const password = 'test1234';
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({ email, password });
        expect([200, 201]).toContain(res.status);
        expect(res.body.message).toMatch(/Usuario registrado|Usuario creado/);
    });
    it('debería rechazar registro con email duplicado', async () => {
        const email = `duplicado${Date.now()}@mail.com`;
        const password = 'test1234';
        // Primer registro
        await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({ email, password });
        // Segundo registro con el mismo email
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({ email, password });
        expect([400, 409]).toContain(res.status);
        expect(res.body.message).toMatch(/Email ya registrado|El email ya está registrado/);
    });
    it('debería rechazar crear página sin autenticación', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/paginas')
            .send({});
        expect(res.status).toBe(401);
        expect(res.body.message || res.body.error).toMatch(/No autenticado|Token inválido/);
    });
    it('debería rechazar crear página sin datos si está autenticado', async () => {
        // Primero registrar y loguear usuario
        const email = `test${Date.now()}@mail.com`;
        const password = 'test1234';
        await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({ email, password });
        const loginRes = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ email, password });
        const cookie = loginRes.headers['set-cookie']?.[0];
        // Intentar crear página sin datos
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/paginas')
            .set('Cookie', cookie || '')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Faltan datos');
    });
});
describe("paginaController", () => {
    it("crearPagina responde 400 si faltan datos", async () => {
        const req = { body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await (0, paginaController_1.crearPagina)(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
afterAll(async () => {
    await db_1.pool.end();
});
//# sourceMappingURL=paginaController.test.js.map