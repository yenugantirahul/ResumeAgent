import "./config/env.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[server] Server running on port ${PORT}`);
  console.log(`[server] SUPABASE_URL: ${process.env.SUPABASE_URL ? "Loaded ✅" : "MISSING ❌"}`);
  console.log(`[server] CLERK_PUBLISHABLE_KEY: ${process.env.CLERK_PUBLISHABLE_KEY ? "Loaded ✅" : "MISSING ❌"}`);
});