import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const retailers = [
  {
    name: 'Carrefour',
    buildSearchUrl: (query) =>
      `https://www.carrefour.com.ar/s?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'Jumbo',
    buildSearchUrl: (query) =>
      `https://www.jumbo.com.ar/${encodeURIComponent(query)}`,
  },
  {
    name: 'Coto',
    buildSearchUrl: (query) =>
      `https://www.cotodigital3.com.ar/sitios/cdigi/busqueda?Ntt=${encodeURIComponent(
        query
      )}`,
  },
  {
    name: 'Frávega',
    buildSearchUrl: (query) =>
      `https://www.fravega.com/l/?keyword=${encodeURIComponent(query)}`,
  },
];

function parsePrice(raw) {
  const cleaned = raw.replace(/\s/g, '');
  const match = cleaned.match(/(\d[\d\.,]*)/);
  if (!match) return null;
  let value = match[1];
  value = value.replace(/\./g, '').replace(',', '.');
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function extractPriceFromHtml(html) {
  const $ = cheerio.load(html);

  // 1) Meta tags
  const metaPrice =
    $('meta[itemprop="price"]').attr('content') ||
    $('meta[property="product:price:amount"]').attr('content');
  if (metaPrice) {
    const n = parsePrice(metaPrice);
    if (n != null) return n;
  }

  // 2) Textos con $
  const textCandidates = [];
  $('body')
    .find('span, div, p')
    .each((_, el) => {
      const t = $(el).text().trim();
      if (t.includes('$')) textCandidates.push(t);
    });

  for (const t of textCandidates) {
    const n = parsePrice(t);
    if (n != null) return n;
  }

  // 3) Scripts con "price"
  const scriptTexts = [];
  $('script').each((_, el) => {
    const t = $(el).html();
    if (t && t.includes('"price"')) scriptTexts.push(t);
  });

  for (const s of scriptTexts) {
    const match = s.match(/"price"\s*:\s*"?(?<value>[\d\.,]+)"?/);
    const value = match && match.groups && match.groups.value;
    if (value) {
      const n = parsePrice(value);
      if (n != null) return n;
    }
  }

  return null;
}

async function fetchOffer(query, cfg) {
  const url = cfg.buildSearchUrl(query);

  const res = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });

  if (!res.ok) {
    console.error('Error HTTP en', cfg.name, res.status);
    return null;
  }

  const html = await res.text();
  const price = extractPriceFromHtml(html);

  if (price == null) {
    console.warn('No se pudo extraer precio para', cfg.name);
    return null;
  }

  return {
    retailer: cfg.name,
    price,
    url,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const query = (body.query || '').trim();

    if (!query) {
      return NextResponse.json(
        { ok: false, error: 'Falta el nombre del producto' },
        { status: 400 }
      );
    }

    const promises = retailers.map((r) => fetchOffer(query, r));
    const results = await Promise.all(promises);

    const offers = results.filter((o) => o !== null);

    offers.sort((a, b) => a.price - b.price);

    return NextResponse.json({ ok: true, query, offers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'Error interno en el comparador' },
      { status: 500 }
    );
  }
}
