import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CommonMoudle } from 'src/common/common.module';

@Module({
  imports: [CommonMoudle],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
