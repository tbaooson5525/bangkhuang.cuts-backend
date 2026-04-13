import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body } = req;
    const start = Date.now();

    // Log request
    this.logger.log(`→ ${method} ${originalUrl} ${JSON.stringify(body)}`);

    // Hook vào response finish để log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      this.logger.log(
        `← ${method} ${originalUrl} ${statusCode} (${duration}ms)`,
      );
    });

    next();
  }
}
