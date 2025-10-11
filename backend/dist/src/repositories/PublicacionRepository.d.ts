export interface Publicacion {
    id: number;
    user_id: string;
    titulo: string;
    contenido: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreatePublicacionData {
    titulo: string;
    contenido: string;
}
export declare class PublicacionRepository {
    create(userId: string, data: CreatePublicacionData): Promise<number>;
    findById(id: number): Promise<Publicacion | null>;
    findByUser(userId: string, limit?: number, offset?: number): Promise<Publicacion[]>;
    findAll(limit?: number, offset?: number): Promise<Publicacion[]>;
    update(id: number, data: Partial<CreatePublicacionData>): Promise<void>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=PublicacionRepository.d.ts.map