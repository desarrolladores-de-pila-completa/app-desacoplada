// Tipos personalizados para Express v5
declare namespace Express {
  export interface Request {
    params: any;
    body: any;
    query: any;
    user?: any;
    userId?: string;
  }
  
  export interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(body?: any): Response;
    setHeader(name: string, value: string): Response;
  }
}