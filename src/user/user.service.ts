import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { envVariableKeys } from 'src/common/const/env.const';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;
    const user = await this.userModel.findOne({ email }).exec();

    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다.');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.hashRounds),
    );

    await this.userModel.create({
      email,
      password: hash,
    });

    return this.userModel
      .findOne(
        { email },
        {
          createdMovies: 0,
          likedMovies: 0,
          chats: 0,
          chatRooms: 0,
        },
      )
      .exec();
  }

  findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자 입니다.');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자 입니다.');
    }

    let input = { ...updateUserDto };

    if (password) {
      const hash = await bcrypt.hash(
        password,
        this.configService.get<number>(envVariableKeys.hashRounds),
      );

      input = { ...input, password: hash };
    }

    await this.userModel.findByIdAndUpdate(id, input).exec();

    return this.userModel.findById(id);
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자 입니다.');
    }

    await this.userModel.findByIdAndDelete(id);
    return id;
  }
}
