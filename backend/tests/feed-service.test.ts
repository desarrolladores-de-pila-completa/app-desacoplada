import { FeedService } from '../src/services/FeedService';
import { IFeedRepository } from '../src/repositories/IFeedRepository';
import { FeedEntry } from '../src/types/interfaces';

describe('FeedService', () => {
  let feedService: FeedService;
  let mockFeedRepository: jest.Mocked<IFeedRepository>;

  const mockFeedEntry: FeedEntry = {
    id: 1,
    user_id: 'user-123',
    pagina_id: 1,
    titulo: 'Test Page',
    contenido: 'Test content',
    creado_en: new Date(),
    username: 'testuser',
    foto_perfil_url: '/api/user/avatar/user-123'
  };

  beforeEach(() => {
    // Crear mock
    mockFeedRepository = {
      findAll: jest.fn(),
      findByUser: jest.fn(),
      findById: jest.fn(),
      createForUser: jest.fn(),
      createForPage: jest.fn(),
      updateForPage: jest.fn(),
      deleteByPage: jest.fn(),
      deleteByUser: jest.fn(),
      search: jest.fn(),
      getStats: jest.fn(),
      syncWithPages: jest.fn(),
      cleanOrphaned: jest.fn(),
      findFollowing: jest.fn()
    } as any;

    feedService = new FeedService(mockFeedRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('should return feed from cache if available', async () => {
      // Arrange
      const feed = [mockFeedEntry];
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(feed);

      // Act
      const result = await feedService.getFeed(20, 0);

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith('feed:all:20:0');
      expect(mockFeedRepository.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(feed);

      cacheGetSpy.mockRestore();
    });

    it('should fetch feed from repository and cache it', async () => {
      // Arrange
      const feed = [mockFeedEntry];
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
      const cacheSetSpy = jest.spyOn(cacheService, 'set');
      mockFeedRepository.findAll.mockResolvedValue(feed);

      // Act
      const result = await feedService.getFeed(20, 0);

      // Assert
      expect(mockFeedRepository.findAll).toHaveBeenCalledWith(20, 0);
      expect(cacheSetSpy).toHaveBeenCalledWith('feed:all:20:0', feed);
      expect(result).toEqual(feed);

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });
  });

  describe('getUserFeed', () => {
    it('should return user feed from cache if available', async () => {
      // Arrange
      const feed = [mockFeedEntry];
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(feed);

      // Act
      const result = await feedService.getUserFeed('user-123', 20, 0);

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith('feed:user:user-123:20:0');
      expect(mockFeedRepository.findByUser).not.toHaveBeenCalled();
      expect(result).toEqual(feed);

      cacheGetSpy.mockRestore();
    });

    it('should fetch user feed from repository and cache it', async () => {
      // Arrange
      const feed = [mockFeedEntry];
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
      const cacheSetSpy = jest.spyOn(cacheService, 'set');
      mockFeedRepository.findByUser.mockResolvedValue(feed);

      // Act
      const result = await feedService.getUserFeed('user-123', 20, 0);

      // Assert
      expect(mockFeedRepository.findByUser).toHaveBeenCalledWith('user-123', 20, 0);
      expect(cacheSetSpy).toHaveBeenCalledWith('feed:user:user-123:20:0', feed);
      expect(result).toEqual(feed);

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });
  });

  describe('getFeedEntry', () => {
    it('should return feed entry from cache if available', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(mockFeedEntry);

      // Act
      const result = await feedService.getFeedEntry(1);

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith('feed:entry:1');
      expect(mockFeedRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockFeedEntry);

      cacheGetSpy.mockRestore();
    });

    it('should fetch feed entry from repository and cache it', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
      const cacheSetSpy = jest.spyOn(cacheService, 'set');
      mockFeedRepository.findById.mockResolvedValue(mockFeedEntry);

      // Act
      const result = await feedService.getFeedEntry(1);

      // Assert
      expect(mockFeedRepository.findById).toHaveBeenCalledWith(1);
      expect(cacheSetSpy).toHaveBeenCalledWith('feed:entry:1', mockFeedEntry);
      expect(result).toEqual(mockFeedEntry);

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });
  });

  describe('createUserRegistrationEntry', () => {
    it('should create user registration entry', async () => {
      // Arrange
      mockFeedRepository.createForUser.mockResolvedValue(1);

      // Act
      const result = await feedService.createUserRegistrationEntry('user-123', 'testuser');

      // Assert
      expect(mockFeedRepository.createForUser).toHaveBeenCalledWith('user-123', 'testuser');
      expect(result).toBe(1);
    });
  });

  describe('createFeedEntry', () => {
    it('should create feed entry and invalidate cache', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
      mockFeedRepository.createForPage.mockResolvedValue(1);

      // Act
      const result = await feedService.createFeedEntry('user-123', 1, 'Test Title', 'Test Content');

      // Assert
      expect(mockFeedRepository.createForPage).toHaveBeenCalledWith('user-123', 1, 'Test Title', 'Test Content');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:all:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:user:user-123:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:stats');
      expect(result).toBe(1);

      invalidateSpy.mockRestore();
    });
  });

  describe('updateFeedEntry', () => {
    it('should update feed entry and invalidate cache', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
      mockFeedRepository.updateForPage.mockResolvedValue();

      // Act
      await feedService.updateFeedEntry(1, 'Updated Title', 'Updated Content');

      // Assert
      expect(mockFeedRepository.updateForPage).toHaveBeenCalledWith(1, 'Updated Title', 'Updated Content');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:entry:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:all:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:user:');

      invalidateSpy.mockRestore();
    });
  });

  describe('deleteFeedEntry', () => {
    it('should delete feed entry and invalidate cache', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
      mockFeedRepository.deleteByPage.mockResolvedValue();

      // Act
      await feedService.deleteFeedEntry(1);

      // Assert
      expect(mockFeedRepository.deleteByPage).toHaveBeenCalledWith(1);
      expect(invalidateSpy).toHaveBeenCalledWith('feed:entry:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:all:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:user:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:stats');

      invalidateSpy.mockRestore();
    });
  });

  describe('deleteUserFeedEntries', () => {
    it('should delete user feed entries and invalidate cache', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
      mockFeedRepository.deleteByUser.mockResolvedValue();

      // Act
      await feedService.deleteUserFeedEntries('user-123');

      // Assert
      expect(mockFeedRepository.deleteByUser).toHaveBeenCalledWith('user-123');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:user:user-123:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:all:');
      expect(invalidateSpy).toHaveBeenCalledWith('feed:stats');

      invalidateSpy.mockRestore();
    });
  });

  describe('searchFeed', () => {
    it('should search feed from cache if available', async () => {
      // Arrange
      const results = [mockFeedEntry];
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(results);

      // Act
      const result = await feedService.searchFeed('test', 20, 0);

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith('feed:search:test:20:0');
      expect(mockFeedRepository.search).not.toHaveBeenCalled();
      expect(result).toEqual(results);

      cacheGetSpy.mockRestore();
    });

    it('should search feed from repository and cache results', async () => {
      // Arrange
      const results = [mockFeedEntry];
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
      const cacheSetSpy = jest.spyOn(cacheService, 'set');
      mockFeedRepository.search.mockResolvedValue(results);

      // Act
      const result = await feedService.searchFeed('test', 20, 0);

      // Assert
      expect(mockFeedRepository.search).toHaveBeenCalledWith('test', 20, 0);
      expect(cacheSetSpy).toHaveBeenCalledWith('feed:search:test:20:0', results);
      expect(result).toEqual(results);

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });
  });

  describe('getFeedStats', () => {
    it('should return feed stats from cache if available', async () => {
      // Arrange
      const stats = {
        totalEntries: 100,
        totalUsers: 50,
        entriesLast24h: 10,
        mostActiveUser: { username: 'testuser', entries: 5 }
      };
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(stats);

      // Act
      const result = await feedService.getFeedStats();

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith('feed:stats');
      expect(mockFeedRepository.getStats).not.toHaveBeenCalled();
      expect(result).toEqual(stats);

      cacheGetSpy.mockRestore();
    });

    it('should fetch feed stats from repository and cache them', async () => {
      // Arrange
      const stats = {
        totalEntries: 100,
        totalUsers: 50,
        entriesLast24h: 10,
        mostActiveUser: { username: 'testuser', entries: 5 }
      };
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
      const cacheSetSpy = jest.spyOn(cacheService, 'set');
      mockFeedRepository.getStats.mockResolvedValue(stats);

      // Act
      const result = await feedService.getFeedStats();

      // Assert
      expect(mockFeedRepository.getStats).toHaveBeenCalled();
      expect(cacheSetSpy).toHaveBeenCalledWith('feed:stats', stats, 60000);
      expect(result).toEqual(stats);

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });
  });

  describe('syncFeedWithPages', () => {
    it('should sync feed with pages', async () => {
      // Arrange
      const result = { created: 5, updated: 2 };
      mockFeedRepository.syncWithPages.mockResolvedValue(result);

      // Act
      const syncResult = await feedService.syncFeedWithPages();

      // Assert
      expect(mockFeedRepository.syncWithPages).toHaveBeenCalled();
      expect(syncResult).toEqual(result);
    });
  });

  describe('cleanOrphanedEntries', () => {
    it('should clean orphaned entries', async () => {
      // Arrange
      mockFeedRepository.cleanOrphaned.mockResolvedValue(3);

      // Act
      const result = await feedService.cleanOrphanedEntries();

      // Assert
      expect(mockFeedRepository.cleanOrphaned).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });

  describe('getFollowingFeed', () => {
    it('should get following feed', async () => {
      // Arrange
      const feed = [mockFeedEntry];
      mockFeedRepository.findFollowing.mockResolvedValue(feed);

      // Act
      const result = await feedService.getFollowingFeed('user-123', 20, 0);

      // Assert
      expect(mockFeedRepository.findFollowing).toHaveBeenCalledWith('user-123', 20, 0);
      expect(result).toEqual(feed);
    });
  });
});