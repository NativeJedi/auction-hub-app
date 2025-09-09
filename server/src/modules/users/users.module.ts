import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

const UserRepository = TypeOrmModule.forFeature([User]);

@Module({
  imports: [UserRepository],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
