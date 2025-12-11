import { Request, Response, NextFunction } from 'express';
import { Logger } from 'pino';

export function errorHandler(logger: Logger) {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
      err,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
    }, 'Request error');

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  };
}
