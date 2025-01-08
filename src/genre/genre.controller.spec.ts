import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { Genre } from './entity/genre.entity';

const mockGenreService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let genreController: GenreController;
  let genreService: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [{ provide: GenreService, useValue: mockGenreService }],
    }).compile();
    genreController = module.get<GenreController>(GenreController);
    genreService = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreController).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll method from GenreService', () => {
      const result = [{ id: 1, name: 'Fantasy' }];

      jest.spyOn(genreService, 'findAll').mockResolvedValue(result as Genre[]);

      expect(genreController.findAll()).resolves.toEqual(result);
      expect(genreService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call findOne method from GenreService', () => {
      const result = { id: 1, name: 'Fantasy' };

      jest.spyOn(genreService, 'findOne').mockResolvedValue(result as Genre);

      expect(genreController.findOne(1)).resolves.toEqual(result);
      expect(genreService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call create method from GenreService with correct Dto', () => {
      const createGenreDto = { name: 'Fantasy' };
      const result = { id: 1, name: 'Fantasy' };

      jest.spyOn(mockGenreService, 'create').mockResolvedValue(result);

      expect(genreController.create(createGenreDto)).resolves.toEqual(result);
      expect(genreService.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('update', () => {
    it('should call update method from GenreService with correct id and Dto', async () => {
      const id = 1;
      const updateDirectorDto = { name: 'Action' };
      const result = { id: 1, name: 'Action' };

      jest.spyOn(mockGenreService, 'update').mockResolvedValue(result);

      expect(genreController.update(id, updateDirectorDto)).resolves.toEqual(
        result,
      );
      expect(genreService.update).toHaveBeenCalledWith(id, updateDirectorDto);
    });
  });

  describe('remove', () => {
    it('should call remove method from GenreService with correct id', async () => {
      const id = 1;

      jest.spyOn(mockGenreService, 'remove').mockResolvedValue(id);

      expect(genreController.remove(id)).resolves.toEqual(id);
      expect(genreService.remove).toHaveBeenCalledWith(id);
    });
  });
});
