import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const auth = request.headers.authorization || '';
    return auth.replace(/^Bearer\s+/i, '').trim();
  },
);
