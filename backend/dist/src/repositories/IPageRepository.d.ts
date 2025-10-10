import { Pagina, CreatePaginaData, UpdatePaginaData, PaginaWithImages } from '../types/interfaces';
export interface IPageRepository {
    create(userId: string, pageData: CreatePaginaData): Promise<number>;
    findById(pageId: number): Promise<Pagina | null>;
    findWithImages(pageId: number): Promise<PaginaWithImages | null>;
    findByUsername(username: string): Promise<Pagina | null>;
    findPublic(limit: number, offset: number): Promise<Pagina[]>;
    update(pageId: number, updateData: UpdatePaginaData): Promise<void>;
    delete(pageId: number): Promise<void>;
    exists(pageId: number): Promise<boolean>;
    getOwner(pageId: number): Promise<string | null>;
    toggleVisibility(pageId: number): Promise<string>;
    addImage(pageId: number, imageBuffer: Buffer, mimeType: string): Promise<number>;
    removeImage(imageId: number, pageId: number): Promise<void>;
    getStats(pageId: number): Promise<{
        comentarios: number;
        imagenes: number;
        visitas: number;
    }>;
}
//# sourceMappingURL=IPageRepository.d.ts.map