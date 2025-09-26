import { login, register } from "../src/controllers/authController";

describe("authController", () => {
  it("login responde 400 si faltan datos", async () => {
    const req = { body: {} } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
