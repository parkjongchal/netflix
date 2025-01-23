import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { CommonMoudle } from 'src/common/common.module';

@Module({
  imports: [CommonMoudle],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule {}
