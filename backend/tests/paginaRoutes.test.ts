import request from "supertest";
import app from "../src/index";

describe("Rutas de páginas", () => {
  it("/api/paginas/:id debe responder 404 si no existe la página", async () => {
    const res = await request(app).get("/api/paginas/99999");
    expect(res.status).toBe(404);
  });
});
