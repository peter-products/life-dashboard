import { Router } from 'express';
import { queryAll, run } from '../db.js';
import { filterText } from '../services/content-filter.js';

const router = Router();

router.get('/todos', (req, res) => {
  const todos = queryAll(
    'SELECT id, subject, snippet, gmail_id, created_at, completed FROM todos ORDER BY created_at DESC'
  );

  const filtered = todos.map(t => ({
    ...t,
    subject: filterText(t.subject),
    snippet: filterText(t.snippet),
  }));

  res.json({ data: filtered });
});

router.post('/todos/:id/complete', (req, res) => {
  const { id } = req.params;
  const completed = req.body.completed ? 1 : 0;
  run('UPDATE todos SET completed = ? WHERE id = ?', [completed, Number(id)]);
  res.json({ ok: true });
});

export default router;
