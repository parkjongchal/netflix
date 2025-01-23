import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { CommonMoudle } from 'src/common/common.module';

@Module({
  imports: [CommonMoudle],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
