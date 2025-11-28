export const metadata = {
  title: 'PricePilot / comparador',
  description: 'Comparador de precios entre Carrefour, Jumbo, Coto y Frávega',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          backgroundColor: '#020617',
          color: '#e2e8f0',
        }}
      >
        {children}
      </body>
    </html>
  );
}
