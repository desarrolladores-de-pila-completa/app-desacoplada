"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./middlewares/authRoutes"));
const auth_1 = require("./middlewares/auth");
const db_1 = require("./middlewares/db");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "https://yposteriormente.com",
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/auth", authRoutes_1.default);
// Ruta protegida
app.get("/api/profile", auth_1.authMiddleware, (req, res) => {
    console.log("Cookies recibidas en /api/profile:", req.cookies);
    res.json({ message: "Acceso autorizado", userId: req.userId });
});
// Ruta protegida para perfil personal
app.get("/api/perfilPersonal", auth_1.authMiddleware, async (req, res) => {
    const userId = req.userId;
    console.log("Cookies recibidas en /api/perfilPersonal:", req.cookies);
    try {
        const [rows] = await db_1.pool.execute("SELECT id, email FROM users WHERE id = ?", [userId]);
        const user = rows[0];
        if (!user)
            return res.status(404).json({ error: "Usuario no encontrado" });
        res.json({ id: user.id, email: user.email });
    }
    catch (err) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});
app.listen(3000, () => console.log("Servidor backend en http://localhost:3000"));
//# sourceMappingURL=index.js.map