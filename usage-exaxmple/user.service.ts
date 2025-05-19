export interface userDetials {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export function getuserById(id: number): userDetials | null {
  if (id === 1) {
    return {
      id: 1,
      name: 'Jonh Doe',
      email: 'jonh.doe@email.com',
      isActive: true,
    };
  }

  return null;
}

export function updatUserEmail(id: number, newEmail: string): boolean {
  if (id === 1) {
    return true;
  }

  return false;
}

export function createUser(user: { id: number; name: string; email: string; isActive: boolean }): boolean {
  return true;
}
