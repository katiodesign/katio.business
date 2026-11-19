import Link from "next/link";
export default function Forbidden(){return <main className="login-side" style={{minHeight:"100vh"}}><div className="login-card"><h1>Acceso restringido</h1><p style={{marginTop:12}}>Tu cuenta no tiene permiso para abrir esta sección.</p><Link className="button primary" href="/inicio">Volver al inicio</Link></div></main>}
