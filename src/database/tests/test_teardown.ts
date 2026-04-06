import { execFileSync } from "node:child_process";

// This script is intended to be run after all tests to clean up the database and stop the Supabase instance.
export default async () => {
    execFileSync("npx", ["supabase", "stop"], { stdio: "inherit" });
}