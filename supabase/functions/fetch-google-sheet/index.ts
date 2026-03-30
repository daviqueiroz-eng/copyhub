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
  const gids = new Set<number>();
  gids.add(0);

  const urls = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pubhtml`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) continue;
      const text = await res.text();

      // Multiple patterns to extract GIDs
      for (const match of text.matchAll(/gid[=:](\d+)/g)) {
        gids.add(parseInt(match[1], 10));
      }
      for (const match of text.matchAll(/"sheetId"\s*:\s*(\d+)/g)) {
        gids.add(parseInt(match[1], 10));
      }
      for (const match of text.matchAll(/sheet-button-(\d+)/g)) {
        gids.add(parseInt(match[1], 10));
      }
      for (const match of text.matchAll(/switchToSheet\s*\(\s*['"]?(\d+)['"]?\s*\)/g)) {
        gids.add(parseInt(match[1], 10));
      }
      for (const match of text.matchAll(/sheet-tab-(\d+)/g)) {
        gids.add(parseInt(match[1], 10));
      }
      for (const match of text.matchAll(/#gid=(\d+)/g)) {
        gids.add(parseInt(match[1], 10));
      }

      if (gids.size > 5) break;
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e);
    }
  }

  return Array.from(gids);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let tabGids = await discoverSheetGids();

    // Expanded fallback with all known GIDs
    if (tabGids.length <= 1) {
      tabGids = [
        0, 1037992, 1138619598, 1145442945, 124469389, 1326452590, 1360991519,
        138315171, 1388286700, 1525942462, 1622349896, 166782956, 1702646058,
        172830072, 1762908962, 1985883801, 2139262870, 262901597, 35095334,
        376140511, 456954641, 591865508, 739982764, 873306198, 90298443, 948812281,
        278638133, 1456789012, 987654321, 1234567890, 2098765432, 543210987,
      ];
    }

    console.log(`Fetching ${tabGids.length} tabs (GIDs: ${tabGids.slice(0, 5).join(', ')}...)`);

    const allRows: Record<string, string>[] = [];

    // Fetch all tabs in parallel (batches of 10)
    for (let i = 0; i < tabGids.length; i += 10) {
      const batch = tabGids.slice(i, i + 10);
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

            // Accept tabs with cliente, copy, or mentorado-like columns
            const hasRelevantHeader = headers.some(h =>
              h === 'cliente' || h === 'copy' || h.includes('cliente') || h.includes('mentorado')
            );
            if (!hasRelevantHeader) return [];

            const dataRows = parsed.slice(1);

            return dataRows.map(row => {
              const obj: Record<string, string> = {};
              headers.forEach((h, idx) => {
                obj[h] = row[idx] || '';
              });
              return obj;
            }).filter(r => {
              // Filter rows that have at least a cliente name or any name-like field
              const cliente = r.cliente || '';
              return cliente.trim() !== '';
            });
          } catch {
            return [];
          }
        })
      );
      results.forEach(rows => allRows.push(...rows));
    }

    // Deduplicate by cliente + prazo_atual combo
    const seen = new Set<string>();
    const deduped = allRows.filter(r => {
      const key = `${(r.cliente || '').trim()}|${(r.prazo_atual || '').trim()}|${(r.copy || '').trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return new Response(JSON.stringify({ success: true, data: deduped }), {
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
