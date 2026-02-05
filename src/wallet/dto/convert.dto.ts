// convert.dto.ts
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertDto {
  @ApiProperty({ example: 'NGN', description: 'Source currency' })
  @Transform(({ value }) => String(value))
  @IsString()
  fromCurrency: string;

  @ApiProperty({ example: 'USD', description: 'Target currency' })
  @Transform(({ value }) => String(value))
  @IsString()
  toCurrency: string;

  @ApiProperty({ example: 1000, description: 'Amount to convert' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.01, { message: 'Amount must be at least 0.01' })
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