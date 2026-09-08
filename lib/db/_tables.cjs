const { Pool } = require("pg");
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
p.query("select tablename from pg_tables where schemaname='public' order by tablename")
  .then(r => { console.log(r.rows.map(x => x.tablename).join(", ")); return p.end(); })
  .catch(e => { console.error("ERR", e.message); process.exit(1); });
