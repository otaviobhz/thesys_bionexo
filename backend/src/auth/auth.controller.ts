import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'

class LoginDto {
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  password: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return req.user
  }
}
