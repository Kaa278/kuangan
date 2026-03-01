const { Client } = require("pg");
const fs = require("fs");

const sql = fs.readFileSync("/tmp/kuangan_init.sql", "utf8");

const client = new Client({
    connectionString: "postgresql://postgres.ayvxmvhwtyveukdbjteg:0F874VUv68pa8H32@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
});

async function run() {
    await client.connect();
    console.log("Connected to Supabase!");
    try {
        // Split and run statements individually to handle pooler limitations
        const statements = sql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith("--"));

        for (const stmt of statements) {
            try {
                await client.query(stmt);
                console.log("✓", stmt.slice(0, 60).replace(/\n/g, " "));
            } catch (e) {
                // Skip "already exists" errors
                if (e.message.includes("already exists")) {
                    console.log("⚠ Already exists (skipping):", stmt.slice(0, 60).replace(/\n/g, " "));
                } else {
                    console.error("✗ Error:", e.message, "\n  SQL:", stmt.slice(0, 80));
                }
            }
        }
        console.log("\n✅ Migration complete!");
    } finally {
        await client.end();
    }
}

run().catch(console.error);
