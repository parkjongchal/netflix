import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { Role, User } from 'src/user/entity/user.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { DataSource } from 'typeorm';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { AuthService } from 'src/auth/auth.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import * as session from 'express-session';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  let users: User[];
  let directors: Director[];
  let movies: Movie[];
  let genres: Genre[];
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // 정의 되지 않은 값들은 전달이 되지 않는다.
        forbidNonWhitelisted: true, // 정의 되지 않은 값이 들어오면 에러가 난다.
        transformOptions: {
          enableImplicitConversion: true, // 입력되는 클래스 타입을 기반으로 데이터를 변경.
        },
      }),
    );

    app.use(
      session({
        secret: 'secret',
      }),
    );
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);
    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const userRepository = dataSource.getRepository(User);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);

    await movieUserLikeRepository.delete({});
    await movieRepository.delete({});
    await genreRepository.delete({});
    await directorRepository.delete({});
    await userRepository.delete({});
    await movieDetailRepository.delete({});

    users = [1, 2].map((id) =>
      userRepository.create({
        id,
        email: `${id}@test.com`,
        password: '123123',
      }),
    );
    await userRepository.save(users);

    directors = [1, 2].map((id) =>
      directorRepository.create({
        id,
        dob: new Date('1992-11-23'),
        nationality: 'South Korea',
        name: `Director Name ${id}`,
      }),
    );
    await directorRepository.save(directors);

    genres = [1, 2].map((id) =>
      genreRepository.create({
        id,
        name: `Genre ${id}`,
      }),
    );
    await genreRepository.save(genres);

    movies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((id) =>
      movieRepository.create({
        id,
        title: `Movie ${id}`,
        creator: users[0],
        genres,
        likeCount: 0,
        dislikeCount: 0,
        detail: movieDetailRepository.create({
          detail: `Movie Detail ${id}`,
        }),
        movieFilePath: `movies/movie${id}.mp4`,
        director: directors[0],
        createdAt: new Date(`2023-9-${id}`),
      }),
    );
    await movieRepository.save(movies);

    const authService = moduleFixture.get<AuthService>(AuthService);
    token = await authService.issueToken(
      { id: users[0].id, role: Role.admin },
      false,
    );
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await dataSource.destroy();
    await app.close();
  });

  describe('[GET /movie]', () => {
    it('should get all movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer()).get(
        '/movie',
      );

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('nextCursor');
      expect(body).toHaveProperty('count');
      expect(body.data).toHaveLength(5);
    });
  });

  describe('[GET /movie/recent]', () => {
    it('should get recent movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer())
        .get('/movie/recent')
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body).toHaveLength(10);
    });
  });

  describe('[GET /movie/{id}]', () => {
    it('should get movie by id', async () => {
      const movieId = movies[0].id;
      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);
      expect(statusCode).toBe(200);
      expect(body.id).toBe(movieId);
    });

    it('should throw 404 error if movie does not exist', async () => {
      const movieId = 999999;

      const { statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      // console.log(error);

      expect(statusCode).toBe(404);
    });
  });

  describe('[POST /movie]', () => {
    it('should create movie', async () => {
      const {
        body: { fileName },
      } = await request(app.getHttpServer())
        .post('/common/video')
        .set('authorization', `Bearer ${token}`)
        .attach('video', Buffer.from('test'), 'movie.mp4')
        .expect(201);

      const dto: CreateMovieDto = {
        title: 'Test Movie',
        detail: 'Test Movie Detail',
        directorId: directors[0].id,
        genreIds: genres.map((genre) => genre.id),
        movieFileName: fileName,
      };

      const { body, statusCode } = await request(app.getHttpServer())
        .post('/movie')
        .set('authorization', `Bearer ${token}`)
        .send(dto);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.title).toBe(dto.title);
      expect(body.detail.detail).toBe(dto.detail);
      expect(body.director.id).toBe(dto.directorId);
      expect(body.genres.map((genre) => genre.id)).toEqual(dto.genreIds);
      expect(body.movieFilePath).toContain(fileName);
    });
  });

  describe('[PATCH /movie/{id}]', () => {
    it('should update movie if exists', async () => {
      const dto: UpdateMovieDto = {
        title: 'Updated Test Movie',
        detail: 'Updated Test Movie Detail',
        directorId: directors[0].id,
        genreIds: [genres[0].id],
      };

      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`)
        .send(dto);

      expect(statusCode).toBe(200);
      expect(body).toBeDefined();
      expect(body.title).toBe(dto.title);
      expect(body.detail.detail).toBe(dto.detail);
      expect(body.director.id).toBe(dto.directorId);
      expect(body.genres.map((genre) => genre.id)).toEqual(dto.genreIds);
    });
  });

  describe('[DELETE /movie/{id}]', () => {
    it('should delete existing movie', async () => {
      const movieId = movies[0].id;

      const { statusCode } = await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
    });

    it('should throw 404 error if movie does not exist', async () => {
      const movieId = 999999;

      const { statusCode } = await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  describe('[POST /movie/{id}/like]', () => {
    it('should like a movie', async () => {
      const movieId = movies[1].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.isLike).toBe(true);
    });

    it('should candel like a movie', async () => {
      const movieId = movies[1].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });
  });

  describe('[POST /movie/{id}/dislike]', () => {
    it('should dislike a movie', async () => {
      const movieId = movies[1].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.isLike).toBe(false);
    });

    it('should candel dislike a movie', async () => {
      const movieId = movies[1].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });
  });
});
