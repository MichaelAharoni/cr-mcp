import { getUserById, updateUserEmail, createUser } from './user.service';
import { Request, Response } from 'express';
import { USER_CONTROLLER_DICTIONARY } from './user.dictionary';

export function getUser(req: Request, res: Response) {
  const userId = req.params.id;
  const user = getUserById(userId);
  if (!user) {
    res.status(404).send(USER_CONTROLLER_DICTIONARY.USER_NOT_FOUND);

    return;
  }

  res.status(200).json(user);
}

export function updateEmail(req: Request, res: Response) {
  const userId = req.params.id;
  const email = req.body.email;
  const result = updateUserEmail(userId, email);
  if (!result) {
    res.status(400).send(USER_CONTROLLER_DICTIONARY.FAILED_UPDATE_EMAIL);

    return;
  }

  res.status(200).send(USER_CONTROLLER_DICTIONARY.EMAIL_UPDATED);
}

export function addUser(req: Request, res: Response) {
  const user = req.body;
  const result = createUser(user);
  if (!result) {
    res.status(400).send(USER_CONTROLLER_DICTIONARY.FAILED_CREATE_USER);

    return;
  }

  res.status(201).send(USER_CONTROLLER_DICTIONARY.USER_CREATED);
}
