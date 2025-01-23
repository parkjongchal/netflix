import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.prisma.movie.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  async findAll(query: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = query;

    const orderBy = order.map((field) => {
      const [column, direction] = field.split('_');
      return { [column]: direction.toLocaleLowerCase() };
    });

    const movies = await this.prisma.movie.findMany({
      where: title ? { title: { contains: title } } : {},
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      take: take + 1,
      skip: cursor ? 1 : 0,
      orderBy,
      include: { genres: true, director: true },
    });

    const hashNextPage = movies.length > take;

    if (hashNextPage) movies.pop();

    const nextCursor = hashNextPage
      ? movies[movies.length - 1].id.toString()
      : null;

    if (userId) {
      const movieIds = movies.map((movie) => movie.id);
      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.prisma.movieUserLike.findMany({
              where: { movieId: { in: movieIds }, userId },
              include: { movie: true },
            });

      /**
       * {
       *  movieId: boolean
       * }
       */
      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeStatus:
            movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        })),
        nextCursor,
        hashNextPage,
      };
    }

    return {
      data: movies,
      nextCursor,
      hashNextPage,
    };
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({ where: { id } });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  /* istanbul ignore next */
  async renameMovieFile(
    dto: CreateMovieDto,
    tempFolder: string,
    movieFolder: string,
  ) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, dto.movieFileName),
        join(process.cwd(), movieFolder, dto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(dto.movieFileName);
    }
  }

  async create(dto: CreateMovieDto, userId: number) {
    return this.prisma.$transaction(async (prisma) => {
      const director = await prisma.director.findUnique({
        where: { id: dto.directorId },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
      }

      const genres = await prisma.genre.findMany({
        where: {
          id: { in: dto.genreIds },
        },
      });

      if (genres.length !== dto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await prisma.movieDetail.create({
        data: { detail: dto.detail },
      });

      const movieFolder = join('public', 'movie');
      const tempFolder = join('public', 'temp');

      const movie = await prisma.movie.create({
        data: {
          title: dto.title,
          movieFilePath: join(movieFolder, dto.movieFileName),
          creator: { connect: { id: userId } },
          director: { connect: { id: director.id } },
          genres: { connect: genres.map((genre) => ({ id: genre.id })) },
          detail: { connect: { id: movieDetail.id } },
        },
      });

      await this.renameMovieFile(dto, tempFolder, movieFolder);

      return prisma.movie.findUnique({
        where: { id: movie.id },
        include: { detail: true, director: true, genres: true },
      });
    });
  }

  async update(id: number, dto: UpdateMovieDto) {
    return this.prisma.$transaction(async (prisma) => {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: { detail: true, genres: true },
      });

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      const { detail, directorId, genreIds, ...movieRest } = dto;

      const movieUpdateParams: Prisma.MovieUpdateInput = {
        ...movieRest,
      };

      if (directorId) {
        const director = await prisma.director.findUnique({
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
        }
        movieUpdateParams.director = { connect: { id: director.id } };
      }

      if (genreIds) {
        const genres = await prisma.genre.findMany({
          where: { id: { in: genreIds } },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 ID의 장르가 있습니다. 존재아는 ID -> ${genres.map((genre) => genre.id).join(',')}`,
          );
        }
        movieUpdateParams.genres = {
          set: genres.map((genre) => ({ id: genre.id })),
        };
      }

      await prisma.movie.update({ where: { id }, data: movieUpdateParams });

      if (detail) {
        await prisma.movieDetail.update({
          where: { id: movie.detail.id },
          data: { detail },
        });
      }

      return prisma.movie.findUnique({
        where: { id },
        include: { detail: true, director: true, genres: true },
      });
    });
  }

  async remove(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: { detail: true },
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    await this.prisma.movie.delete({ where: { id } });
    await this.prisma.movieDetail.delete({ where: { id: movie.detail.id } });

    return id;
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다.');
    }

    const likeRecord = await this.prisma.movieUserLike.findUnique({
      where: { movieId_userId: { movieId, userId } },
    });

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.prisma.movieUserLike.delete({
          where: { movieId_userId: { movieId, userId } },
        });
      } else {
        await this.prisma.movieUserLike.update({
          where: {
            movieId_userId: { movieId, userId },
          },
          data: { isLike },
        });
      }
    } else {
      await this.prisma.movieUserLike.create({
        data: {
          movie: { connect: { id: movieId } },
          user: { connect: { id: userId } },
          isLike,
        },
      });
    }

    const result = await this.prisma.movieUserLike.findUnique({
      where: { movieId_userId: { movieId, userId } },
    });

    return {
      isLike: result && result.isLike,
    };
  }
}
