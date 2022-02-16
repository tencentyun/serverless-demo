import type { NextApiRequest } from 'next';
import { AuthorizationError } from './error';
import '../types';

export type IsAuthenticatedOptions = {
  throwOnError?: boolean;
};

export function isAuthenticated<User = any>(
  req: NextApiRequest,
  options: IsAuthenticatedOptions = {}
): User {
  const user = req?.session?.user as User;
  if (!user) {
    if (options.throwOnError) {
      throw new AuthorizationError('Not authenticated');
    }
  }
  return user;
}
