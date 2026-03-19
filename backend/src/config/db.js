import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_mwtO5E6svlMX@ep-hidden-tooth-ahaj7ffa-pooler.c-3.us-east-1.aws.neon.tech/ReadNow?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export { pool };