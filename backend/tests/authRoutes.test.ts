import request from "supertest";
import app from "../src/index";

describe("Rutas de autenticación", () => {
  it("/api/auth/login debe responder 400 si faltan datos", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});
