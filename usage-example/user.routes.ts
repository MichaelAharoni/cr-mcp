import { getUser, updateEmail, addUser } from './user.controller';
import { USER_ENDPOINTS } from './user.constants';
import { Request, Response } from 'express';
import express from 'express';
const router = express.Router();

router.get(USER_ENDPOINTS.GET_USER, (req: Request, res: Response) => {
  getUser(req, res);
});

router.post(USER_ENDPOINTS.UPDATE_EMAIL, (req: Request, res: Response) => {
  updateEmail(req, res);
});

router.post(USER_ENDPOINTS.ADD_USER, (req: Request, res: Response) => {
  addUser(req, res);
});

export default router;
