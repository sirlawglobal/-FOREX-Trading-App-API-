import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
  ) {}

  async getUsers({ page, limit }: { page: number; limit: number }) {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'email', 'isVerified', 'role', 'createdAt'],
    });
    return { users, total, page, limit };
  }

  async getUser(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'isVerified', 'role', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getAllTransactions({ page, limit }: { page: number; limit: number }) {
    const [transactions, total] = await this.transactionRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return { transactions, total, page, limit };
  }

  async getUserTransactions(userId: string) {
    return this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async addCurrency(currency: string, rate?: number) {
    // Placeholder: In a real app, you'd update a currencies table or config
    return { message: `Currency ${currency} added/updated`, rate };
  }

  async deleteUser(id: string) {
    const result = await this.userRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('User not found');
    return { message: 'User deleted' };
  }
}
