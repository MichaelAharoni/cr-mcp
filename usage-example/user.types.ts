export interface UserDetails {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export type CreateUserInput = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
};
