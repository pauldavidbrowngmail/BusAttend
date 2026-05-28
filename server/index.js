import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool, { initDB } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Attendance API ────────────────────────────────────────────────────────────

app.get('/api/records', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, student_eid AS "studentEId", student_name AS "studentName", course_id AS "courseId", timestamp FROM attendance_records ORDER BY timestamp ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/records error:', err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

app.post('/api/records', async (req, res) => {
  const { id, studentEId, studentName, courseId, timestamp } = req.body;
  if (!id || !studentEId || !studentName || !courseId || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await pool.query(
      'INSERT INTO attendance_records (id, student_eid, student_name, course_id, timestamp) VALUES ($1,$2,$3,$4,$5)',
      [id, studentEId, studentName, courseId, timestamp]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('POST /api/records error:', err);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

app.delete('/api/records', async (req, res) => {
  try {
    await pool.query('TRUNCATE attendance_records');
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/records error:', err);
    res.status(500).json({ error: 'Failed to reset records' });
  }
});

// ── Serve frontend in production ──────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`BusAttend server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
