import { errorHandler } from "../src/middlewares/errorHandler";

describe("Middleware errorHandler", () => {
  it("debe responder con 500 y mensaje de error", () => {
    const req = {} as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();
    errorHandler(new Error("Test error"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error interno del servidor" });
  });
});
