/**
 * @swagger
 * /api/feed/crear:
 *   post:
 *     summary: Crear entrada en el feed
 *     tags: [Feed]
 */
export declare function crearEntradaFeed(userId: string, username: string): Promise<void>;
/**
 * @swagger
 * /api/feed:
 *   get:
 *     summary: Obtener feed completo
 *     tags: [Feed]
 */
export declare function obtenerFeed(): Promise<any[]>;
//# sourceMappingURL=feedController.d.ts.map