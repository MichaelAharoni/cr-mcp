import express from 'express';
import userRoutes from './user.routes';
import { API_PREFIX, PORT } from './app.constants';

const app = express();
app.use(express.json());

// user rutes
app.use(API_PREFIX, userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
