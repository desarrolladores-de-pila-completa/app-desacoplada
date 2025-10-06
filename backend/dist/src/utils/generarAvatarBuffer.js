"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarAvatarBuffer = generarAvatarBuffer;
const canvas_1 = require("canvas");
async function generarAvatarBuffer(username) {
    // Color aleatorio basado en el username
    const hash = Array.from(username).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    // Crear imagen vacía y rellenar color
    const width = 128, height = 128;
    const canvas = (0, canvas_1.createCanvas)(width, height);
    const ctx = canvas.getContext("2d");
    // Color de fondo basado en username
    const r = hash % 255, g = (hash * 2) % 255, b = (hash * 3) % 255;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, width, height);
    // Escribir iniciales en el centro
    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const iniciales = username.slice(0, 2).toUpperCase();
    ctx.fillText(iniciales, width / 2, height / 2);
    return canvas.toBuffer("image/png");
}
//# sourceMappingURL=generarAvatarBuffer.js.map