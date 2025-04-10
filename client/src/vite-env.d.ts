/// <reference types="vite/client" />

interface ImportMeta {
  env: {
    DEV: boolean;
    PROD: boolean;
    MODE: string;
    VITE_CONTROLLER_API?: string;
    // Add other environment variables as needed
  };
}
