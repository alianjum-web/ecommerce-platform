import { loadEnvFiles } from "./envFiles";

declare global {
  // Prevent duplicate env loading in watch mode/re-imports.
  // eslint-disable-next-line no-var
  var __envLoaded: boolean | undefined;
}

if (!global.__envLoaded) {
  loadEnvFiles();

  global.__envLoaded = true;
}

export {};
