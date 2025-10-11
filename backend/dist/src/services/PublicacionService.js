"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicacionService = void 0;
class PublicacionService {
    publicacionRepository;
    constructor(publicacionRepository) {
        this.publicacionRepository = publicacionRepository;
    }
    async createPublicacion(userId, data) {
        return await this.publicacionRepository.create(userId, data);
    }
    async getPublicacionById(id) {
        return await this.publicacionRepository.findById(id);
    }
    async getPublicacionesByUser(userId, limit = 20, offset = 0) {
        return await this.publicacionRepository.findByUser(userId, limit, offset);
    }
    async getAllPublicaciones(limit = 20, offset = 0) {
        return await this.publicacionRepository.findAll(limit, offset);
    }
    async updatePublicacion(id, data) {
        await this.publicacionRepository.update(id, data);
    }
    async deletePublicacion(id) {
        await this.publicacionRepository.delete(id);
    }
}
exports.PublicacionService = PublicacionService;
//# sourceMappingURL=PublicacionService.js.map