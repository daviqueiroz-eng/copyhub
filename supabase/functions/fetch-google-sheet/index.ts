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

  // htmlview is the most reliable for GID discovery
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/htmlview`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pubhtml`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) continue;
      const text = await res.text();

      for (const match of text.matchAll(/gid[=:](\d+)/g)) {
        gids.add(parseInt(match[1], 10));
      }
      for (const match of text.matchAll(/"sheetId"\s*:\s*(\d+)/g)) {
        gids.add(parseInt(match[1], 10));
      }

      if (gids.size > 10) break;
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e);
    }
  }

  return Array.from(gids);
}

// Brute-force scan: try sequential GIDs 0..N to discover tabs not found via scraping
async function bruteForceGids(existingGids: Set<number>, maxProbe: number = 50): Promise<number[]> {
  const found: number[] = [];
  const toCheck: number[] = [];
  
  for (let i = 0; i <= maxProbe; i++) {
    if (!existingGids.has(i)) toCheck.push(i);
  }
  
  // Check in batches of 15
  for (let i = 0; i < toCheck.length; i += 15) {
    const batch = toCheck.slice(i, i + 15);
    const results = await Promise.all(
      batch.map(async (gid) => {
        try {
          const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
          const res = await fetch(url, { redirect: 'follow' });
          if (res.ok) {
            const text = await res.text();
            if (text.length > 10) return gid;
          }
          return null;
        } catch {
          return null;
        }
      })
    );
    results.forEach(gid => { if (gid !== null) found.push(gid); });
  }
  
  return found;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let tabGids = await discoverSheetGids();

    // Expanded fallback with all known GIDs
    const knownGids = [
      0, 1037992, 1138619598, 1145442945, 124469389, 1326452590, 1360991519,
      138315171, 1388286700, 1525942462, 1622349896, 166782956, 1702646058,
      172830072, 1762908962, 1985883801, 2139262870, 262901597, 35095334,
      376140511, 456954641, 591865508, 739982764, 873306198, 90298443, 948812281,
      278638133, 114287148, 778773390,
    ];

    // Merge discovered + known
    const allGidSet = new Set([...tabGids, ...knownGids]);
    
    // Also brute-force scan low GIDs (0-50) to catch new tabs
    const bruteForced = await bruteForceGids(allGidSet, 50);
    bruteForced.forEach(g => allGidSet.add(g));

    tabGids = Array.from(allGidSet);

    console.log(`Fetching ${tabGids.length} tabs: ${JSON.stringify(tabGids)}`);

    const allRows: Record<string, string>[] = [];

    // Fetch all tabs in parallel (batches of 15)
    for (let i = 0; i < tabGids.length; i += 15) {
      const batch = tabGids.slice(i, i + 15);
      const results = await Promise.all(
        batch.map(async (gid) => {
          try {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
            const res = await fetch(url, { redirect: 'follow' });
            if (!res.ok) {
              console.log(`GID ${gid} failed: ${res.status}`);
              return [];
            }
            const text = await res.text();
            const parsed = parseCSV(text);
            if (parsed.length < 2) return [];

            const headers = parsed[0].map(normalizeHeader);
            console.log(`GID ${gid}: headers=${JSON.stringify(headers.slice(0,5))}, rows=${parsed.length - 1}`);

            // Accept tabs that have ANY column resembling client/copy/name data
            const hasRelevantHeader = headers.some(h =>
              h === 'cliente' || h === 'copy' || h === 'nome' ||
              h.includes('cliente') || h.includes('mentorado') || h.includes('copy') ||
              h.includes('prazo') || h.includes('leva')
            );
            if (!hasRelevantHeader) {
              console.log(`GID ${gid}: skipped - no relevant header`);
              return [];
            }

            const dataRows = parsed.slice(1);

            return dataRows.map(row => {
              const obj: Record<string, string> = {};
              headers.forEach((h, idx) => {
                obj[h] = row[idx] || '';
              });
              return obj;
            }).filter(r => {
              // Accept rows that have at least a cliente OR nome field with content
              const cliente = r.cliente || r.nome || '';
              return cliente.trim() !== '';
            });
          } catch {
            return [];
          }
        })
      );
      results.forEach(rows => allRows.push(...rows));
    }

    // Deduplicate by cliente + prazo_atual + copy combo
    const seen = new Set<string>();
    const deduped = allRows.filter(r => {
      const key = `${(r.cliente || r.nome || '').trim()}|${(r.prazo_atual || '').trim()}|${(r.copy || '').trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`Returning ${deduped.length} rows from ${tabGids.length} tabs`);

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
