// Types for the part of p5.brush (https://github.com/acamposuribe/p5.brush, MIT) the kit uses. The package ships
// no declarations. Angles follow p5's angleMode (radians by default).
declare module 'p5.brush' {
  type Pt = [number, number] | [number, number, number];
  type Color = string;
  export function instance(p: unknown): void;
  export function scaleBrushes(scale: number): void;
  export function box(): string[];
  export function set(brush: string, color: Color, weight?: number): void;
  export function stroke(color: Color): void;
  export function strokeWeight(weight: number): void;
  export function noStroke(): void;
  export function fill(color: Color, opacity?: number): void;
  export function noFill(): void;
  export function fillBleed(strength: number, direction?: 'in' | 'out', angle?: number): void;
  export function fillTexture(texture: number, border: number, scatter?: boolean, split?: number): void;
  export function wash(color: Color, opacity?: number): void;
  export function noWash(): void;
  export function hatch(dist: number, angle: number, options?: { rand?: number | false; continuous?: boolean; gradient?: number | false }): void;
  export function hatchStyle(brush: string, color: Color, weight?: number): void;
  export function noHatch(): void;
  export function field(name: string): void;
  export function noField(): void;
  export function wiggle(amount: number): void;
  export function clip(region: [number, number, number, number]): void;
  export function noClip(): void;
  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function flowLine(x: number, y: number, length: number, dir: number): void;
  export function spline(points: Pt[], curvature?: number): unknown;
  export function rect(x: number, y: number, w: number, h: number, mode?: 'corner' | 'center'): void;
  export function circle(x: number, y: number, radius: number, irregularity?: number | boolean): unknown;
  export function arc(x: number, y: number, radius: number, start: number, end: number): unknown;
  export function polygon(points: Pt[]): void;
  export function seed(s: number | string): void;
  export function noiseSeed(s: number | string): void;
}
