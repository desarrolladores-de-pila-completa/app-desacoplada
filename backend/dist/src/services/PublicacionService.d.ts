import { PublicacionRepository, Publicacion, CreatePublicacionData } from '../repositories/PublicacionRepository';
export declare class PublicacionService {
    private publicacionRepository;
    constructor(publicacionRepository: PublicacionRepository);
    createPublicacion(userId: string, data: CreatePublicacionData): Promise<number>;
    getPublicacionById(id: number): Promise<Publicacion | null>;
    getPublicacionesByUser(userId: string, limit?: number, offset?: number): Promise<Publicacion[]>;
    getAllPublicaciones(limit?: number, offset?: number): Promise<Publicacion[]>;
    updatePublicacion(id: number, data: Partial<CreatePublicacionData>): Promise<void>;
    deletePublicacion(id: number): Promise<void>;
}
//# sourceMappingURL=PublicacionService.d.ts.map