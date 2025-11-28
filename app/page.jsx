'use client';

import { useState } from 'react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState(null);

  async function handleCompare(e) {
    e.preventDefault();
    setError(null);
    setOffers([]);

    const q = query.trim();
    if (!q) {
      setError('Escribí el nombre del producto');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'No se pudo comparar precios');
      } else {
        setOffers(json.offers || []);
      }
    } catch (err) {
      console.error(err);
      setError('Error de red al comparar precios');
    } finally {
      setLoading(false);
    }
  }

  const cheapest =
    offers.length > 0
      ? offers.reduce((min, o) => (o.price < min.price ? o : min), offers[0])
      : null;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background:
          'radial-gradient(circle at top, #1e293b 0, #020617 55%, #000 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 960 }}>
        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              lineHeight: 1.1,
              fontWeight: 600,
              margin: 0,
            }}
          >
            PricePilot <span style={{ color: '#38bdf8' }}>/ comparador</span>
          </h1>
          <p
            style={{
              marginTop: '0.75rem',
              maxWidth: 540,
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: 1.6,
            }}
          >
            Escribí el nombre de un producto (idealmente el título que ves en
            Carrefour) y vamos a buscarlo en Carrefour, Jumbo, Coto y Frávega.
            Los precios que se muestren salen directo del HTML de cada sitio
            (cuando podemos detectarlos).
          </p>
        </header>

        {/* Card principal */}
        <section
          style={{
            borderRadius: '1.25rem',
            border: '1px solid #1f2937',
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85))',
            padding: '1.75rem 1.9rem',
            boxShadow: '0 18px 45px rgba(0,0,0,0.45)',
          }}
        >
          <form
            onSubmit={handleCompare}
            style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Lavarropas Drean Next 8kg..."
              style={{
                flex: 1,
                padding: '0.7rem 0.9rem',
                borderRadius: '0.7rem',
                border: '1px solid #334155',
                background: '#020617',
                color: '#e2e8f0',
                fontSize: '0.95rem',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#0ea5e9' : '#38bdf8',
                border: 'none',
                padding: '0.7rem 1.1rem',
                borderRadius: '0.7rem',
                color: '#000',
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                minWidth: '120px',
              }}
            >
              {loading ? 'Buscando...' : 'Comparar'}
            </button>
          </form>

          {error && (
            <p style={{ color: '#f97373', fontSize: '0.9rem' }}>{error}</p>
          )}

          {!error && !loading && offers.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Ingresá un producto y te mostramos un ranking de precios por
              retailer. Si no encontramos precio en algún sitio, se omite de la
              tabla.
            </p>
          )}

          {offers.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    color: '#9ca3af',
                    borderBottom: '1px solid #1f2937',
                  }}
                >
                  <th style={{ padding: '0.35rem 0.4rem' }}>Retailer</th>
                  <th style={{ padding: '0.35rem 0.4rem' }}>Precio</th>
                  <th style={{ padding: '0.35rem 0.4rem' }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => {
                  const isCheapest =
                    cheapest && o.retailer === cheapest.retailer;
                  return (
                    <tr
                      key={o.retailer}
                      style={{
                        borderBottom: '1px solid #020617',
                        backgroundColor: isCheapest ? '#022c22' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.45rem 0.4rem' }}>
                        {o.retailer}
                        {isCheapest && (
                          <span
                            style={{
                              marginLeft: '0.4rem',
                              fontSize: '0.75rem',
                              color: '#4ade80',
                            }}
                          >
                            mejor precio
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.45rem 0.4rem' }}>
                        ${o.price.toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '0.45rem 0.4rem' }}>
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#38bdf8',
                            textDecoration: 'underline',
                          }}
                        >
                          ver en sitio
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
