import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { TaskScheduleService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';
import { DefaultLogger } from './logger/default.logger';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, callback) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }
          callback(null, `${v4()}_${Date.now()}.${extension}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([Movie]),
    BullModule.forRoot({
      connection: {
        host: 'redis-15060.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
        port: 15060,
        username: 'default',
        password: 'uaU7e2iH1tiutxkrKuO7YSe91Lpdxzuu',
      },
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generation',
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, TaskScheduleService, DefaultLogger],
  exports: [CommonService, DefaultLogger],
})
export class CommonMoudle {}
