import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DefaultLogger } from './logger/default.logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TaskScheduleService {
  // private readonly logger = new Logger(TaskScheduleService.name);
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  // @Cron('*/5 * * * * *')
  logEverySecond() {
    this.logger.fatal('FATAL 레벨 로그', null, TaskScheduleService.name); // 절대로 일어나면 안되는 부분 지금 당장 수정해야 하는 부분들
    this.logger.error('ERROR 레벨 로그', null, TaskScheduleService.name); // 에러가 났을때
    this.logger.warn('WARN 레벨 로그', TaskScheduleService.name); // 일어나면 안되는 일이 일어난건데 프로그램을 실행하는데 문제가 없는 상황
    this.logger.log('LOG 레벨 로그', TaskScheduleService.name); // 정보성 메시지를 전달할때 사용
    this.logger.debug('DEBUG 레벨 로그', TaskScheduleService.name); // 운영이 아닌 개발환경일때 필요한 로깅
    this.logger.verbose('VERBOSE 레벨 로그', TaskScheduleService.name); // 진짜 중요하지 않은 내용들 (궁금하거나 쓸모없는 내용을 로깅할때)
  }

  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch (e) {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTargets.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );
  }

  // @Cron('0 * * * * *')
  async calculateMovieLikeCounts() {
    await this.movieRepository.query(`
      UPDATE movie m
        SET "likeCount" = (
          SELECT count(*) FROM movie_user_like mul
          WHERE m.id = mul."movieId" AND mul."isLike" = true
        )
    `);

    await this.movieRepository.query(`
      UPDATE movie m
        SET "dislikeCount" = (
          SELECT count(*) FROM movie_user_like mul
          WHERE m.id = mul."movieId" AND mul."isLike" = false
        )
    `);
  }

  // @Cron('* * * * * *', { name: 'printer' })
  printer() {
    console.log('print every seconds');
  }

  // @Cron('*/5 * * * * *')
  stopper() {
    console.log('--- stopper run ---');

    const job = this.schedulerRegistry.getCronJob('printer');

    // console.log('# Last Date');
    // console.log(job.lastDate());
    // console.log('# Next Date');
    // console.log(job.nextDate());
    console.log('# Next Dates');
    console.log(job.nextDates(5));

    if (job.running) {
      job.stop();
    } else {
      job.start();
    }
  }
}
