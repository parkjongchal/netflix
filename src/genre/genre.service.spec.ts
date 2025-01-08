import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

const mockGenreRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        { provide: getRepositoryToken(Genre), useValue: mockGenreRepository },
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new genre', async () => {
      const createGenreDto = {
        name: 'Fantasy',
      };

      jest.spyOn(mockGenreRepository, 'save').mockResolvedValue(createGenreDto);

      const result = await genreService.create(createGenreDto);

      expect(genreRepository.save).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(createGenreDto);
    });

    it('should throw a NotFoundException if genre is not found', async () => {
      jest
        .spyOn(mockGenreRepository, 'findOne')
        .mockResolvedValue({ name: 'Fantasy' });

      await expect(genreService.create({ name: 'Fantasy' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should retrun an array of genres', async () => {
      const genres = [
        {
          id: 1,
          name: 'Fantasy',
        },
      ];

      jest.spyOn(mockGenreRepository, 'find').mockResolvedValue(genres);

      const result = await genreService.findAll();

      expect(genreRepository.find).toHaveBeenCalled();
      expect(result).toEqual(genres);
    });
  });

  describe('findOne', () => {
    it('should retrun a single genre by id', async () => {
      const id = 1;
      const genre = {
        id: 1,
        name: 'Fantasy',
      };

      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);

      const result = await genreService.findOne(id);

      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
      expect(result).toEqual(genre);
    });

    it('should throw a NotFoundException if genre is not found', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

      await expect(genreService.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a genre', async () => {
      const id = 1;
      const updateGenreDto = {
        name: 'Action',
      };
      const existingGenre = {
        id: 1,
        name: 'Fantasy',
      };
      const updatedGenre = {
        id: 1,
        name: 'Action',
      };

      jest
        .spyOn(mockGenreRepository, 'findOne')
        .mockResolvedValueOnce(existingGenre)
        .mockResolvedValueOnce(updatedGenre);

      const result = await genreService.update(id, updateGenreDto);

      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
      expect(genreRepository.update).toHaveBeenCalledWith(
        { id },
        updateGenreDto,
      );
      expect(result).toEqual(updatedGenre);
    });

    it('should throw NotFoundException if director does not exist', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.update(1, { name: 'Action' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a genre by id', async () => {
      const genre = {
        id: 1,
        name: 'Fantasy',
      };

      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);

      const result = await genreService.remove(1);

      expect(mockGenreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(mockGenreRepository.delete).toHaveBeenCalledWith(1);

      expect(result).toEqual(1);
    });

    it('should throw NotFoundException if director does not exist', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
