import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity()
@Index('idx_transactions_userId_createdAt', ['userId', 'createdAt']) // composite index for fast history queries
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  type: 'FUND' | 'CONVERT' | 'TRADE';

  @Column({ length: 3 })
  fromCurrency: string;

  @Column({ type: 'numeric', precision: 18, scale: 8 })
  fromAmount: string;

  @Column({ length: 3, nullable: true })
  toCurrency?: string;

  @Column({ type: 'numeric', precision: 18, scale: 8, nullable: true })
  toAmount?: string;

  @Column({ type: 'numeric', precision: 12, scale: 6, nullable: true })
  rateUsed?: string;

  @Column({ default: 'SUCCESS' })
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  idempotencyKey?: string;

  @CreateDateColumn()
  createdAt: Date;
}