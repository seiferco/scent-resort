import { Request } from 'express';

// Express 5 types params values as string | string[]
// This helper extracts a single string param safely
export function getParam(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}
