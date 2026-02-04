import { IsString, IsNumber, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FundDto {
  @ApiProperty()
  @IsString()
  @IsIn(['NGN']) // Per spec, start with NGN
  currency: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false, description: 'For idempotency' })
  @IsOptional()
  @IsUUID()
  txId?: string;
}