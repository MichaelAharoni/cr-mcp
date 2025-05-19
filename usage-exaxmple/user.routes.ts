import { getUser, updateEmail, addUser } from './user.controller';

const express = require('express');
const router = express.Router();
const unusedVar = 123;

router.get('/user/:id', (req: any, res: any) => {
  getUser(req, res);
});

router.post('/user/:id/email', (req: any, res: any) => {
  updateEmail(req, res);
});

router.post('/user', (req: any, res: any) => {
  addUser(req, res);
});

export default router;
