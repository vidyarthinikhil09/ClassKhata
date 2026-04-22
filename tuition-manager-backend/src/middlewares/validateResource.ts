import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => 
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check the request body against the Zod schema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // Data is good, move to the controller!
    } catch (e: any) {
      if (e instanceof ZodError) {
        res.status(400).json({
          message: 'Validation Failed',
          errors: e.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
        });
        return;
      }
      res.status(400).json({ message: 'Invalid request data' });
    }
  };