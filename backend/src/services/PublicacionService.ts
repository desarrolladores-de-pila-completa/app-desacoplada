import { PublicacionRepository, Publicacion, CreatePublicacionData } from '../repositories/PublicacionRepository';

export class PublicacionService {
  constructor(private publicacionRepository: PublicacionRepository) {}

  async createPublicacion(userId: string, data: CreatePublicacionData): Promise<number> {
    return await this.publicacionRepository.create(userId, data);
  }

  async getPublicacionById(id: number): Promise<Publicacion | null> {
    return await this.publicacionRepository.findById(id);
  }

  async getPublicacionesByUser(userId: string, limit: number = 20, offset: number = 0): Promise<Publicacion[]> {
    return await this.publicacionRepository.findByUser(userId, limit, offset);
  }

  async getAllPublicaciones(limit: number = 20, offset: number = 0): Promise<Publicacion[]> {
    return await this.publicacionRepository.findAll(limit, offset);
  }

  async updatePublicacion(id: number, data: Partial<CreatePublicacionData>): Promise<void> {
    await this.publicacionRepository.update(id, data);
  }

  async deletePublicacion(id: number): Promise<void> {
    await this.publicacionRepository.delete(id);
  }
}