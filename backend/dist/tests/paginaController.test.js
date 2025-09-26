"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../src/index"));
const db_1 = require("../src/middlewares/db");
const paginaController_1 = require("../src/controllers/paginaController");
// Pruebas de registro y login (se mantienen)
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
    // Prueba de la ruta pública de páginas
    it('debería obtener páginas públicas', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/paginas');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
describe('paginaController', () => {
    it('paginasPublicas responde con array', async () => {
        const req = {};
        const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
        await (0, paginaController_1.paginasPublicas)(req, res);
        expect(res.json).toHaveBeenCalled();
    });
});
afterAll(async () => {
    await db_1.pool.end();
});
//# sourceMappingURL=paginaController.test.js.map