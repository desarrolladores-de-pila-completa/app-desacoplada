import { pool } from "../src/middlewares/db";

describe("DB pool", () => {
  it("debe estar definido", () => {
    expect(pool).toBeDefined();
  });

  afterAll(async () => {
    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  });
});
