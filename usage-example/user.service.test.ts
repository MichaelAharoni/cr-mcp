import { getUserById, updateUserEmail, createUser } from './user.service';

describe('user.service', () => {
  describe('getUserById', () => {
    it('should return user details for id 1', () => {
      const user = getUserById(1);
      expect(user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@email.com',
        isActive: true,
      });
    });

    it('should return null for unknown id', () => {
      expect(getUserById(2)).toBeNull();
    });
  });

  describe('updateUserEmail', () => {
    it('should return true for id 1', () => {
      expect(updateUserEmail(1)).toBe(true);
    });

    it('should return false for unknown id', () => {
      expect(updateUserEmail(2)).toBe(false);
    });
  });

  describe('createUser', () => {
    it('should always return true', () => {
      expect(createUser()).toBe(true);
    });
  });
});
