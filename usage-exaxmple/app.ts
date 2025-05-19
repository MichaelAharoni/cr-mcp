import express from 'express';
import userRoutes from './user.routes';
import { getUser } from './user.controller';

const app = express();
app.use(express.json());

// user rutes
app.use('/api', userRoutes);

app.listen(3000, () => {
  console.log('Server is runing on port 3000');
});
