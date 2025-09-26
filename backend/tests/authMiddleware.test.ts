import { authMiddleware } from "../src/middlewares/auth";
import jwt from "jsonwebtoken";

describe("authMiddleware", () => {
  it("debe responder 401 si no hay token", () => {
    const req = { cookies: {} } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No autenticado" });
  });

  it("debe llamar next si el token es válido", () => {
    const token = jwt.sign({ userId: 1 }, "clave-secreta");
    const req = { cookies: { token } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
