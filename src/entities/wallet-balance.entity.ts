import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
@Index(['userId', 'currency'], { unique: true }) // Fast lookups, prevent duplicates
export class WalletBalance {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User, (user) => user.balances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column() userId: string; // Denormalized for queries
  @Column({ length: 3 }) currency: string; // ISO code, e.g., 'NGN'
  @Column({ type: 'numeric', precision: 18, scale: 8, default: '0' }) balance: string; // String for precision, numeric type in DB
  @UpdateDateColumn() updatedAt: Date; // Track changes
}