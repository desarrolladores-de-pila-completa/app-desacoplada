"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedController_1 = require("../controllers/feedController");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const feed = await (0, feedController_1.obtenerFeed)();
        res.json(feed);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener el feed" });
    }
});
exports.default = router;
//# sourceMappingURL=feedRoutes.js.map