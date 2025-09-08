import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.usersRepository.save(createUserDto);

    return user;
  }

  findByEmail(email: User['email'], withPassword = false) {
    const baseQuery = this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    const userQuery = withPassword
      ? baseQuery.addSelect('user.password')
      : baseQuery;
    return userQuery.getOne();
  }

  findById(id: User['id']) {
    return this.usersRepository.findOneBy({ id });
  }
}
