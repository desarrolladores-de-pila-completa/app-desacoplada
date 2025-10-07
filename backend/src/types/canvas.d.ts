// Stub de tipos para Canvas en VirtualBox
declare module "canvas" {
  export interface Canvas {
    getContext(contextType: '2d'): CanvasRenderingContext2D;
    toBuffer(mime?: string): Buffer;
  }

  export interface CanvasRenderingContext2D {
    fillStyle: string | CanvasGradient | CanvasPattern;
    font: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    fillRect(x: number, y: number, width: number, height: number): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
  }

  export function createCanvas(width: number, height: number): Canvas;
}