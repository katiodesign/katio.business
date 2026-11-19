export function AccessShell({ children }: { children: React.ReactNode }) {
  return <main className="login-layout"><section className="login-hero" aria-label="Katio Business">
    <div className="hero-content"><h1>Todo tu negocio,<br />en un solo lugar.</h1><p>Cotizaciones, facturación, trabajos, clientes y finanzas en un espacio de trabajo interno, claro y ordenado.</p></div>
  </section><section className="login-side"><div className="wordmark">KATIO<span>.</span><small>Business</small></div><div className="login-card">{children}</div><p className="copyright">© {new Date().getFullYear()} Katio Business · Uso interno{process.env.PRIVACY_URL && <> · <a href={process.env.PRIVACY_URL}>Privacidad</a></>}{process.env.TERMS_URL && <> · <a href={process.env.TERMS_URL}>Términos</a></>}</p></section></main>;
}
