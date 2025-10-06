import mysql from "mysql2/promise";
declare let pool: mysql.Pool;
declare function initDatabase(): Promise<void>;
export { pool, initDatabase };
//# sourceMappingURL=db.d.ts.map