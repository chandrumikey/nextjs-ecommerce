import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string | undefined;

  @IsString()
  @IsNotEmpty()
  password: string | undefined;
}