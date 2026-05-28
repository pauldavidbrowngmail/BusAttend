import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import pool, { initDB } from './db.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

// ── AI Insights ───────────────────────────────────────────────────────────────

app.post('/api/insights', async (req, res) => {
  const { students, records } = req.body;

  if (!students || students.length === 0) {
    return res.json([{
      title: 'Insufficient Data',
      description: 'No student records have been scanned yet to generate engagement patterns.',
      recommendation: 'Start scanning student QR codes to see AI-driven insights.',
      riskLevel: 'low',
    }]);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json([{
      title: 'AI Unavailable',
      description: 'ANTHROPIC_API_KEY is not configured on the server.',
      recommendation: 'Add the API key in your Railway service variables.',
      riskLevel: 'low',
    }]);
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analyze the following attendance data for a Business School course and return ONLY a JSON array with exactly 3 insight objects. No markdown, no explanation — raw JSON only.

Students: ${JSON.stringify(students.map(s => ({ id: s.id, name: s.name, rate: s.attendanceRate })))}
Recent Records: ${JSON.stringify(records.slice(0, 50))}

Each object must have these fields:
- title: string (short headline)
- description: string (1-2 sentences about the pattern)
- recommendation: string (1 sentence action for the faculty)
- riskLevel: "low" | "medium" | "high"

Focus on attendance trends, students at risk, and punctuality patterns.`
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text);
    res.json(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.error('Claude insights error:', err);
    res.status(500).json([{
      title: 'Analysis Error',
      description: 'The AI analysis engine encountered a problem.',
      recommendation: 'Check your API key and try again.',
      riskLevel: 'low',
    }]);
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
