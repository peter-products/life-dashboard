import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { initDb } from './db.js';
import { startCron } from './cron.js';
import authRoutes from './routes/auth.js';
import calendarRoutes from './routes/calendar.js';
import emailRoutes from './routes/email.js';
import todosRoutes from './routes/todos.js';
import weatherRoutes from './routes/weather.js';
import homeworkRoutes from './routes/homework.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

await initDb();

app.use('/auth', authRoutes);
app.use('/api', calendarRoutes);
app.use('/api', emailRoutes);
app.use('/api', todosRoutes);
app.use('/api', weatherRoutes);
app.use('/api', homeworkRoutes);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

startCron();
