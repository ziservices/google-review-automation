require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  try {
    console.log("Seeding database with test data...");

    // Insert test business data
    const { data, error } = await supabase.from("businesses").insert([
      {
        name: "Demo Cafe",
        custom_url_slug: "demo-cafe",
        email: "info@democafe.com",
        phone: "+1-555-0123",
        description: "A cozy demo cafe for testing",
      },
    ]);

    if (error) {
      console.error("Error inserting data:", error);
      process.exit(1);
    }

    console.log("✓ Successfully seeded database");
    console.log("Inserted data:", data);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

seedDatabase();
