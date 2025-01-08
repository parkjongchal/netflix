import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { Director } from './entity/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [{ provide: DirectorService, useValue: mockDirectorService }],
    }).compile();
    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<DirectorService>(DirectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll method from DirectorService', () => {
      const result = [{ id: 1, name: 'Code Factory' }];

      jest
        .spyOn(directorService, 'findAll')
        .mockResolvedValue(result as Director[]);

      expect(directorController.findAll()).resolves.toEqual(result);
      expect(directorService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call findOne method from DirectorService', () => {
      const result = { id: 1, name: 'Code Factory' };

      jest
        .spyOn(directorService, 'findOne')
        .mockResolvedValue(result as Director);

      expect(directorController.findOne(1)).resolves.toEqual(result);
      expect(directorService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call create method from DirectorService with correct Dto', () => {
      const createDirectorDto = { name: 'Code Factory' };
      const result = { id: 1, name: 'Code Factory' };

      jest.spyOn(mockDirectorService, 'create').mockResolvedValue(result);

      expect(
        directorController.create(createDirectorDto as CreateDirectorDto),
      ).resolves.toEqual(result);
      expect(directorService.create).toHaveBeenCalledWith(createDirectorDto);
    });
  });

  describe('update', () => {
    it('should call update method from DirectorService with correct id and Dto', async () => {
      const id = 1;
      const updateDirectorDto = { name: 'Code Factory Name' };
      const result = { id: 1, name: 'Code Factory Name' };

      jest.spyOn(mockDirectorService, 'update').mockResolvedValue(result);

      expect(directorController.update(id, updateDirectorDto)).resolves.toEqual(
        result,
      );
      expect(directorService.update).toHaveBeenCalledWith(
        id,
        updateDirectorDto,
      );
    });
  });

  describe('remove', () => {
    it('should call remove method from DirectorService with correct id', async () => {
      const id = 1;

      jest.spyOn(mockDirectorService, 'remove').mockResolvedValue(id);

      expect(directorController.remove(id)).resolves.toEqual(id);
      expect(directorService.remove).toHaveBeenCalledWith(id);
    });
  });
});
