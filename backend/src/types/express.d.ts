import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        name: string;
        username: string;
      };
    }
  }
}

export {};
