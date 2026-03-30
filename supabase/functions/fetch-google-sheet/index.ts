const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1NFx4lDqYh5dxejV-uZEFqjuVHGXHe7z3zfh5FV1h1n8';

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && csv[i + 1] === '\n') i++;
        row.push(current.trim());
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        current = '';
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function discoverSheetGids(): Promise<number[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return [];
    const html = await res.text();
    
    // Extract GIDs from the HTML - Google Sheets embeds sheet info in the page
    const gidMatches = html.matchAll(/gid=(\d+)/g);
    const gids = new Set<number>();
    for (const match of gidMatches) {
      gids.add(parseInt(match[1], 10));
    }
    // Remove gid=0 (overview tab) if it has different format
    // Actually keep all GIDs and filter by content
    return Array.from(gids);
  } catch (e) {
    console.error('Failed to discover GIDs:', e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Dynamically discover all sheet tabs
    let tabGids = await discoverSheetGids();
    
    // Fallback to known GIDs if discovery fails
    if (tabGids.length === 0) {
      tabGids = [
        1037992, 1138619598, 1145442945, 124469389, 1326452590, 1360991519,
        138315171, 1388286700, 1525942462, 1622349896, 166782956, 1702646058,
        172830072, 1762908962, 1985883801, 2139262870, 262901597, 35095334,
        376140511, 456954641, 591865508, 739982764, 873306198, 90298443, 948812281,
      ];
    }
    
    console.log(`Fetching ${tabGids.length} tabs`);
    
    const allRows: Record<string, string>[] = [];

    // Fetch all tabs in parallel (batches of 5)
    for (let i = 0; i < tabGids.length; i += 5) {
      const batch = tabGids.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (gid) => {
          try {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
            const res = await fetch(url, { redirect: 'follow' });
            if (!res.ok) return [];
            const text = await res.text();
            const parsed = parseCSV(text);
            if (parsed.length < 2) return [];

            const headers = parsed[0].map(normalizeHeader);
            
            // Only process tabs that have a 'cliente' column
            if (!headers.includes('cliente')) return [];
            
            const dataRows = parsed.slice(1);

            return dataRows.map(row => {
              const obj: Record<string, string> = {};
              headers.forEach((h, idx) => {
                obj[h] = row[idx] || '';
              });
              return obj;
            }).filter(r => r.cliente && r.cliente.trim() !== '');
          } catch {
            return [];
          }
        })
      );
      results.forEach(rows => allRows.push(...rows));
    }

    return new Response(JSON.stringify({ success: true, data: allRows }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching sheet:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
