import { FeedEntry } from '../types/interfaces';

export interface IFeedRepository {
  findAll(limit: number, offset: number): Promise<FeedEntry[]>;
  findByUser(userId: string, limit: number, offset: number): Promise<FeedEntry[]>;
  findById(feedId: number): Promise<FeedEntry | null>;
  createForUser(userId: string, username: string): Promise<number>;
  createForPage(userId: string, pageId: number, titulo: string, contenido: string): Promise<number>;
  updateForPage(pageId: number, titulo: string, contenido: string): Promise<void>;
  deleteByPage(pageId: number): Promise<void>;
  deleteByUser(userId: string): Promise<void>;
  search(searchTerm: string, limit: number, offset: number): Promise<FeedEntry[]>;
  getStats(): Promise<{
    totalEntries: number;
    totalUsers: number;
    entriesLast24h: number;
    mostActiveUser: { username: string; entries: number } | null;
  }>;
  syncWithPages(): Promise<{ created: number; updated: number }>;
  cleanOrphaned(): Promise<number>;
  findFollowing(userId: string, limit: number, offset: number): Promise<FeedEntry[]>;
}