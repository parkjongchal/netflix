import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
import { CommonMoudle } from 'src/common/common.module';

@Module({
  imports: [CommonMoudle],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
