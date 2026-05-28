import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('In Railway: go to your service → Variables → add DATABASE_URL from the Postgres plugin.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
