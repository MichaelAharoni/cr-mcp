import { UserDetails } from './user.types';

export function getUserById(id: number): UserDetails | null {
  if (id === 1) {
    return {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      isActive: true,
    };
  }

  return null;
}

export function updateUserEmail(id: number): boolean {
  if (id === 1) {
    return true;
  }

  return false;
}

export function createUser(): boolean {
  return true;
}
