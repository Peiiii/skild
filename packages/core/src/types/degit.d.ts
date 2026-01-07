declare module 'degit' {
  export interface DegitOptions {
    force?: boolean;
    verbose?: boolean;
    cache?: boolean;
    mode?: 'tar' | 'git';
  }

  export interface DegitEmitter {
    clone(dest: string): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export default function degit(src: string, options?: DegitOptions): DegitEmitter;
}

