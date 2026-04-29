/// <reference types="vite/client" />

interface ImportMeta {
  glob<T = unknown>(
    pattern: string | string[],
    options?: {
      query?: string | Record<string, string | number | boolean>;
      import?: string;
      eager?: false;
    }
  ): Record<string, () => Promise<T>>;
}
