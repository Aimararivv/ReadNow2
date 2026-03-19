const { Pool } = require('pg');

const pool = new Pool({
  host: "ep-gentle-recipe-ad9dmucr-pooler.c-2.us-east-1.aws.neon.tech",
  user: "neondb_owner",
  password: "npg_KYvqaWuF59yX",
  database: "neondb",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;