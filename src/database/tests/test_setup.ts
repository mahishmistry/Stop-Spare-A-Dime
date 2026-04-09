import { execFileSync } from "node:child_process";

// This script is intended to be run before all tests to ensure the database is in a clean state.
export default async () => {
    console.log("Running database setup script...");
    execFileSync("npx", ["supabase", "start"], { stdio: "inherit" });
    execFileSync("npx", ["supabase", "db", "reset"], { stdio: "inherit" });
};