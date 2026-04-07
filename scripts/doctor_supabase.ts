import "dotenv/config";

function missing(name: string): boolean {
  return !process.env[name] || process.env[name]!.trim().length === 0;
}

const checks = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY"
];

const missingVars = checks.filter(missing);

if (missingVars.length) {
  console.error("Faltan variables en .env:");
  for (const key of missingVars) console.error(`- ${key}`);
  process.exit(1);
}

if (process.env.SUPABASE_URL !== process.env.VITE_SUPABASE_URL) {
  console.error("SUPABASE_URL y VITE_SUPABASE_URL deben coincidir.");
  process.exit(1);
}

if (process.env.SUPABASE_ANON_KEY !== process.env.VITE_SUPABASE_ANON_KEY) {
  console.error("SUPABASE_ANON_KEY y VITE_SUPABASE_ANON_KEY deben coincidir.");
  process.exit(1);
}

console.log("Supabase env OK.");
