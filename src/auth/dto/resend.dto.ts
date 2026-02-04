import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendDto {
  @ApiProperty({ description: 'User email to resend OTP' })
  @IsEmail()
  email: string;
}