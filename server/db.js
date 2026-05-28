import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id          VARCHAR(20)  PRIMARY KEY,
      student_eid VARCHAR(50)  NOT NULL,
      student_name VARCHAR(200) NOT NULL,
      course_id   VARCHAR(100) NOT NULL,
      timestamp   TIMESTAMPTZ  NOT NULL
    )
  `);
}

export default pool;
