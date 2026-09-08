const { Client } = require("pg");
const pass = "Taha%40maroc2030";
const user = "postgres.rethvrndpdcjoomburpy";
const regions = ["us-east-2","us-west-1","eu-west-2","eu-north-1","eu-south-1","ap-southeast-2","ap-south-1","ap-northeast-2","sa-east-1","me-central-1","af-south-1","ap-east-1","eu-central-2"];
const test = (region) => new Promise((resolve) => {
  const url = `postgresql://${user}:${pass}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 4000, query_timeout: 4000, ssl: { rejectUnauthorized: false } });
  const t = setTimeout(() => { try{c.end()}catch{}; resolve({ region, ok: false, err: "timeout" }); }, 5000);
  c.connect().then(() => c.query("select 1").then(() => { clearTimeout(t); resolve({ region, ok: true }); try{c.end()}catch{} }).catch((e)=>{ clearTimeout(t); try{c.end()}catch{}; resolve({ region, ok:false, err:e.message.split("\n")[0] }); }))
    .catch((e)=>{ clearTimeout(t); resolve({ region, ok:false, err:e.message.split("\n")[0] }); });
});
(async () => {
  const results = [];
  for (const r of regions) { const res = await test(r); console.log(JSON.stringify(res)); results.push(res); }
  const good = results.find(r => r.ok);
  console.log(good ? "SUCCESS: " + good.region : "NO REGION MATCHED");
  process.exit(0);
})();
