"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const paginaRoutes_1 = __importDefault(require("./routes/paginaRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./middlewares/db");
const csurf_1 = __importDefault(require("csurf"));
const rootPath = path_1.default.resolve(__dirname, '../../../');
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(rootPath, 'frontend')));
const csrfProtection = (0, csurf_1.default)({ cookie: true });
// Ruta para obtener el token CSRF
app.get("/api/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
// Aplica CSRF a rutas que modifican estado
app.use(["/api/paginas", "/api/auth"], csrfProtection);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/paginas", paginaRoutes_1.default);
app.use(errorHandler_1.errorHandler);
// Ruta SPA: sirve index.html en rutas no API
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path_1.default.join(rootPath, 'frontend/index.html'));
});
if (require.main === module) {
    (async () => {
        try {
            await db_1.pool.query("SELECT 1");
            console.log("Conexión a MySQL exitosa");
            app.listen(3000, () => console.log("Servidor backend en http://localhost:3000"));
        }
        catch (err) {
            console.error("Error de conexión a MySQL:", err);
            process.exit(1);
        }
    })();
}
exports.default = app;
//# sourceMappingURL=index.js.map