import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthorizedRequest } from '../modules/auth/auth.guard';
import { Role, ROLES_KEY } from '../types/roles';
import { Reflector } from '@nestjs/core';

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();

    const user = request.user;

    if (!user) {
      console.error(
        'No user object in request. Check AuthGuard implementation.',
      );
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}

export { RolesGuard };
