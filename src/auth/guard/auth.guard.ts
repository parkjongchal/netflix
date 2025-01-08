import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 만약에 public decoration이 되있으면 모든 로직을 패스
    const isPublic = this.reflector.get(Public, context.getHandler());

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (
      request.user &&
      request.user.type === 'refresh' &&
      request.url === '/auth/token/access'
    ) {
      return true;
    }

    if (!request.user || request.user.type !== 'access') {
      return false;
    }

    return true;
  }
}
