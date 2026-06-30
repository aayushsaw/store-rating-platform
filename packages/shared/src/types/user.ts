import type { UserRole } from '../constants.js';

export interface UserBase {
  id: string;
  name: string;
  email: string;
  address: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserListItem = UserBase;

export interface UserDetail extends UserBase {
  /** Present when role is STORE_OWNER */
  storeAverageRating?: number | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  address: string;
  role: UserRole;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
