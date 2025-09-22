import request from 'supertest';
import app from '../src/index';
import { pool } from '../src/middlewares/db';

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
  it('debería rechazar crear página sin autenticación', async () => {
    const res = await request(app)
      .post('/api/paginas')
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.message || res.body.error).toMatch(/No autenticado|Token inválido/);
  });

  it('debería rechazar crear página sin datos si está autenticado', async () => {
    // Primero registrar y loguear usuario
    const email = `test${Date.now()}@mail.com`;
    const password = 'test1234';
    await request(app)
      .post('/api/auth/register')
      .send({ email, password });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    const cookie = loginRes.headers['set-cookie']?.[0];
    // Intentar crear página sin datos
    const res = await request(app)
      .post('/api/paginas')
      .set('Cookie', cookie || '')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Faltan datos');
  });
});

afterAll(async () => {
  await pool.end();
});
