import { supabase } from "@/lib/supabase";

export default async function TestDB() {
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .limit(1);

  return (
    <main style={{ padding: 40 }}>
      <h1>Database Test</h1>

      <pre>
        {JSON.stringify(
          {
            data,
            error: error?.message ?? null,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}