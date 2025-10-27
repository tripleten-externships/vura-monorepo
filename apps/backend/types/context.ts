// Keystone Context typings (if we need)
import type { KeystoneContext } from '@keystone-6/core/types';

export type Context = KeystoneContext;

export type Session = {
  data?: {
    id: string;
    name?: string;
    role?: 'user' | 'admin';
  };
};
