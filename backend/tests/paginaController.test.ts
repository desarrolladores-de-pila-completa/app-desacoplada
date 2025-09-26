import request from 'supertest';
import app from '../src/index';
import { pool } from '../src/middlewares/db';
import { paginasPublicas } from '../src/controllers/paginaController';

// Pruebas de registro y login (se mantienen)
describe('API de páginas', () => {
  it('debería registrar un usuario nuevo', async () => {
    const email = `nuevo${Date.now()}@mail.com`;
    const password = 'test1234';
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password });
    expect([200, 201]).toContain(res.status);
    expect(res.body.message).toMatch(/Usuario registrado|Usuario creado/);
  });

  it('debería rechazar registro con email duplicado', async () => {
    const email = `duplicado${Date.now()}@mail.com`;
    const password = 'test1234';
    // Primer registro
    await request(app)
      .post('/api/auth/register')
      .send({ email, password });
    // Segundo registro con el mismo email
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password });
    expect([400, 409]).toContain(res.status);
    expect(res.body.message).toMatch(/Email ya registrado|El email ya está registrado/);
  });

  // Prueba de la ruta pública de páginas
  it('debería obtener páginas públicas', async () => {
    const res = await request(app)
      .get('/api/paginas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('paginaController', () => {
  it('paginasPublicas responde con array', async () => {
    const req = {} as any;
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
    await paginasPublicas(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});

afterAll(async () => {
  await pool.end();
});
