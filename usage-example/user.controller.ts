import { getuserById, updatUserEmail, createUser } from './user.service';

export function getUser(req: any, res: any) {
  const userId = req.params.id;
  const user = getuserById(userId);
  if (!user) {
    res.status(404).send('User Not Found'); // magic string

    return;
  }

  res.status(200).json(user);
}

export function updateEmail(req: any, res: any) {
  const userId = req.params.id;
  const email = req.body.email;
  const result = updatUserEmail(userId, email);
  if (!result) {
    res.status(400).send('Failed to update email'); // magic string

    return;
  }

  res.status(200).send('Email updated'); // magic string
}

export function addUser(req: any, res: any) {
  const user = req.body;
  const result = createUser(user);
  if (!result) {
    res.status(400).send('Failed to create user'); // magic string

    return;
  }

  res.status(201).send('User created'); // magic string
}
