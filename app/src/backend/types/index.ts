import type { InferSelectModel } from "drizzle-orm";
import type * as schema from "../db/schema.ts";

export type Block = InferSelectModel<typeof schema.blocks>;
export type Board = InferSelectModel<typeof schema.boards>;
export type BoardMember = InferSelectModel<typeof schema.boardMembers>;
export type Category = InferSelectModel<typeof schema.categories>;
export type CategoryBoard = InferSelectModel<typeof schema.categoryBoards>;
export type Subscription = InferSelectModel<typeof schema.subscriptions>;
export type Sharing = InferSelectModel<typeof schema.sharing>;
export type FileInfoRow = InferSelectModel<typeof schema.fileInfo>;
export type Team = InferSelectModel<typeof schema.teams>;
export type UserProfile = InferSelectModel<typeof schema.userProfiles>;
export type Preference = InferSelectModel<typeof schema.preferences>;
export type SystemSetting = InferSelectModel<typeof schema.systemSettings>;

export interface ErrorResponse {
  error: string;
  errorCode: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  firstname: string;
  lastname: string;
  createAt: number;
  updateAt: number;
  deleteAt: number;
  isBot: boolean;
  isGuest: boolean;
  roles: string;
  permissions?: string[];
}

export interface LoginRequest {
  type: string;
  email?: string;
  username?: string;
  password: string;
  mfaToken?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  token?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface FileUploadResponse {
  fileId: string;
}
