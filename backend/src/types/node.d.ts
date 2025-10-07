// Definiciones de tipos para Node.js
declare var Buffer: {
  from(data: any, encoding?: string): Buffer;
  prototype: Buffer;
};

declare interface Buffer {
  toString(encoding?: string): string;
}

declare var __dirname: string;
declare var __filename: string;

declare var require: {
  (id: string): any;
  main: any;
};

declare var module: {
  exports: any;
};

declare var process: {
  exit(code?: number): never;
  env: { [key: string]: string | undefined };
  cwd(): string;
  platform: string;
  version: string;
};

declare var console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};
