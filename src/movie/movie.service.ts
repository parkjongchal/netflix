import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { InjectModel } from '@nestjs/mongoose';
import { Movie } from './schema/movie.schema';
import { Model, Types, Document } from 'mongoose';
import { MovieDetail } from './schema/movie-detail.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
import { Director } from 'src/director/schema/director.schema';
import { Genre } from 'src/genre/schema/genre.schema';
import { User } from 'src/user/schema/user.schema';

@Injectable()
export class MovieService {
  constructor(
    @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,
    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<MovieDetail>,
    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
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

    const data = await this.movieModel
      .find()
      .populate({
        path: 'genres',
        model: 'Genre',
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');
      acc[column] = direction.toLocaleLowerCase();
      return acc;
    }, {});

    const query = this.movieModel
      .find(
        title
          ? {
              title: {
                $regx: title,
              },
              $option: 'i',
            }
          : {},
      )
      .sort(orderBy)
      .limit(take + 1);

    if (cursor) {
      query.lt('_id', new Types.ObjectId(cursor));
    }

    const movies = await query.populate('genres director').exec();

    const hasNextPage = movies.length > take;

    if (hasNextPage) movies.pop();

    const nextCursor = hasNextPage
      ? movies[movies.length - 1].id.toString()
      : null;

    if (userId) {
      const movieIds = movies.map((movie) => movie._id);
      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.movieUserLikeModel
              .find({
                movie: {
                  $in: movieIds.map((id) => new Types.ObjectId(id.toString())),
                },
                user: new Types.ObjectId(userId.toString()),
              })
              .populate('movie')
              .exec();

      /**
       * {
       *  movieId: boolean
       * }
       */
      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie._id.toString()]: next.isLike,
        }),
        {},
      );

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeStatus:
            movie._id.toString() in likedMovieMap
              ? likedMovieMap[movie._id.toString()]
              : null,
        })) as (Document<unknown, object, Movie> &
          Movie &
          Required<{
            _id: unknown;
          }> & {
            __v: number;
          } & { likeStatus: boolean })[],
        nextCursor,
        hasNextPage,
      };
    }

    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };
  }

  async findOne(id: string) {
    const movie = await this.movieModel
      .findById(id)
      .populate('detail director genres')
      .exec();
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

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
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const director = await this.directorModel.findById(dto.directorId).exec();

      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
      }

      const genres = await this.genreModel
        .find({ _id: { $in: dto.genreIds } })
        .exec();

      if (genres.length !== dto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다. ids -> ${genres.map((genre) => genre.id).join(', ')}`,
        );
      }

      const movieDetail = await this.movieDetailModel.create(
        [
          {
            detail: dto.detail,
          },
        ],
        { session },
      );

      const movieFolder = join('public', 'movie');
      const tempFolder = join('public', 'temp');

      const movie = await this.movieModel.create(
        [
          {
            title: dto.title,
            movieFilePath: join(movieFolder, dto.movieFileName),
            creator: userId,
            director: director._id,
            genres: genres.map((genre) => genre._id),
            detail: movieDetail[0]._id,
          },
        ],
        { session },
      );

      await this.renameMovieFile(dto, tempFolder, movieFolder);

      await session.commitTransaction();

      return this.movieModel
        .findById(movie[0]._id)
        .populate('detail')
        .populate('director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (e) {
      await session.abortTransaction();
      throw new InternalServerErrorException(e);
    } finally {
      session.endSession();
    }
  }

  async update(id: string, dto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const movie = await (await this.movieModel.findById(id))
        .populated('detail genres')
        .exec();

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }
      const { detail, directorId, genreIds, ...movieRest } = dto;

      const movieUpdateParams: {
        title?: string;
        movieFileName?: string;
        director?: Types.ObjectId;
        genres?: Types.ObjectId[];
      } = {
        ...movieRest,
      };

      if (directorId) {
        const director = await this.directorModel.findById(directorId).exec();

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
        }
        movieUpdateParams.director = director._id as Types.ObjectId;
      }

      if (genreIds) {
        const genres = await this.genreModel
          .find({
            _id: { $in: genreIds },
          })
          .exec();

        if (genreIds.length !== genres.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. ids -> ${genres.map((genre) => genre.id).join(', ')}`,
          );
        }
        movieUpdateParams.genres = genres.map(
          (genre) => genre._id as Types.ObjectId,
        );
      }
      if (detail) {
        await this.movieDetailModel
          .findByIdAndUpdate(movie.detail._id, {
            detail,
          })
          .exec();
      }

      await this.movieModel.findByIdAndUpdate(id, movieUpdateParams);

      await session.commitTransaction();

      return (await this.movieModel.findById(id))
        .populated('detail director genres')
        .exec();
    } catch (e) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  async remove(id: string) {
    const movie = (await this.movieModel.findById(id))
      .populated('detail')
      .exec();

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }
    await this.movieModel.findByIdAndDelete(id);
    // await this.movieRepository.delete(id);
    await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();

    return id;
  }

  async toggleMovieLike(movieId: string, userId: number, isLike: boolean) {
    const movie = await this.movieModel.findById(movieId).exec();

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다.');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다.');
    }

    const likeRecord = await this.movieUserLikeModel.findOne({
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId.toString()),
    });

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id);
      } else {
        likeRecord.isLike = isLike;
        likeRecord.save();
        // await this.movieUserLikeModel.findByIdAndUpdate(likeRecord._id, {
        //   isLike,
        // });
      }
    } else {
      await this.movieUserLikeModel.create({
        movie: new Types.ObjectId(movieId),
        user: new Types.ObjectId(userId.toString()),
        isLike,
      });
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId.toString()),
    });

    return {
      isLike: result && result.isLike,
    };
  }
}
