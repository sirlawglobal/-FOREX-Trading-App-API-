import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertDto {
  @ApiProperty({ example: 'NGN', description: 'Source currency' })
  @IsString()
  fromCurrency: string;

  @ApiProperty({ example: 'USD', description: 'Target currency' })
  @IsString()
  toCurrency: string;

  @ApiProperty({ example: 1000, description: 'Amount to convert' })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    example: 'txn-uuid-1234',
    description: 'Optional idempotency key (prevents duplicate conversions)',
    required: false,
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;   // ← This line was missing or removed
}