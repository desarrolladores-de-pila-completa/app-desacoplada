"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Carga .env desde la ruta absoluta de backend/.env, funciona en src y dist
// Carga dotenv usando ruta relativa a la raíz del proyecto
const fs_1 = __importDefault(require("fs"));
const envPath = path_1.default.resolve(process.cwd(), "backend/.env");
if (fs_1.default.existsSync(envPath)) {
    dotenv_1.default.config({ path: envPath });
}
else {
    dotenv_1.default.config(); // fallback: busca .env en el cwd
}
let pool;
try {
    exports.pool = pool = promise_1.default.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}
catch (err) {
    console.error("Error al crear el pool de MySQL:", err);
}
//# sourceMappingURL=db.js.map