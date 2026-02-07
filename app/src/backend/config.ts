import { resolve } from "path";

export interface ServerConfig {
  serverRoot: string;
  port: number;
  dbconfig: string;
  filespath: string;
  filesdriver: string;
  sessionExpireTime: number;
  sessionRefreshTime: number;
  enablePublicSharedBoards: boolean;
  telemetry: boolean;
  authMode: string;
  // OAuth providers
  githubClientId: string;
  githubClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  // Magic link
  magicLinkSecret: string;
  // Signup
  signupToken: string;
}

function loadConfigFile(): Partial<ServerConfig> {
  const configPath = resolve(
    process.env.FOCALBOARD_CONFIG_PATH ?? "../config.json",
  );
  try {
    const file = Bun.file(configPath);
    // Synchronous check — Bun.file().size is available
    if (file.size === 0) return {};
    // Use require for synchronous JSON loading
    return require(configPath);
  } catch {
    return {};
  }
}

function getConfig(): ServerConfig {
  const file = loadConfigFile();

  return {
    serverRoot:
      process.env.SERVER_ROOT ?? file.serverRoot ?? "http://localhost:3000",
    port: Number(process.env.PORT ?? file.port ?? 3000),
    dbconfig:
      process.env.DB_CONFIG ??
      file.dbconfig ??
      "./focalboard.db?_busy_timeout=5000",
    filespath: process.env.FILES_PATH ?? file.filespath ?? "./files",
    filesdriver: process.env.FILES_DRIVER ?? file.filesdriver ?? "local",
    sessionExpireTime: Number(
      process.env.SESSION_EXPIRE_TIME ?? file.sessionExpireTime ?? 2592000,
    ),
    sessionRefreshTime: Number(
      process.env.SESSION_REFRESH_TIME ?? file.sessionRefreshTime ?? 18000,
    ),
    enablePublicSharedBoards:
      process.env.ENABLE_PUBLIC_SHARED_BOARDS === "true" ||
      file.enablePublicSharedBoards === true,
    telemetry:
      process.env.TELEMETRY !== "false" && (file.telemetry ?? true) === true,
    authMode: process.env.AUTH_MODE ?? file.authMode ?? "native",
    githubClientId: process.env.GITHUB_CLIENT_ID ?? file.githubClientId ?? "",
    githubClientSecret:
      process.env.GITHUB_CLIENT_SECRET ?? file.githubClientSecret ?? "",
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? file.googleClientId ?? "",
    googleClientSecret:
      process.env.GOOGLE_CLIENT_SECRET ?? file.googleClientSecret ?? "",
    magicLinkSecret:
      process.env.MAGIC_LINK_SECRET ?? file.magicLinkSecret ?? "",
    signupToken: process.env.SIGNUP_TOKEN ?? file.signupToken ?? "",
  };
}

export const config = getConfig();
