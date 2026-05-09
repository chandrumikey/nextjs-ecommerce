import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string | undefined;

  @IsString()
  @MinLength(3)
  name: string | undefined;

  @IsString()
  @MinLength(6)
  password: string | undefined;
}