import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Role } from '../auth/roles.enum';
import { WalletBalance } from './wallet-balance.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  password: string | null;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ type: 'text', nullable: true })
  otp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => WalletBalance, (balance) => balance.user, { cascade: true })
  balances: WalletBalance[];

  // No import needed — TypeORM resolves it lazily via the arrow function
  @OneToMany(() => Transaction, (tx) => tx.user)
  transactions: Transaction[];
}