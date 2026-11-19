import { createContext, useContext, useState } from "react";
import { destination, normalize } from "./navigation";

export const ScreenContext = createContext(/** @type {any} */ (null));
const icons = {
  eye: "69614334-231a-4fb1-8cd1-63be8766ed21.svg",
  eyeOff: "c9491a96-6b25-42c3-a931-966beefca25d.svg",
  lock: "b5189825-ddd1-46f6-ade7-0e7e062cd847.svg",
  menu: "526cb24e-ccf1-4283-a095-4e74cf69243b.svg",
  mail: "b1c8acf2-2260-42be-a0d3-407a75a5a492.svg",
  chevron: "5bc3fd58-583e-4ead-aa6e-ec022917354c.svg",
};

export function Icon({ name }) {
  return <img className="design-icon" src={"/figma/" + icons[name]} alt="" />;
}

export function Action({ label, leading, children, ...props }) {
  const screen = useContext(ScreenContext);
  const layer = props["data-name"];
  const target = destination(screen.path, label, layer);
  const filter = layer === "Chip" || layer === "Filtro";
  const submit = /^(iniciar sesion|enviar instrucciones|enviar enlace|restablecer contrasena)$/.test(normalize(label));
  const navigate = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    screen.go(target);
  };

  if (target && !submit && !filter) {
    return <a {...props} href={target} onClick={navigate} aria-label={label} data-control="link">{leading && <Icon name={leading} />}{children}</a>;
  }
  return (
    <button {...props} type={submit ? "submit" : "button"} aria-label={label}
      aria-pressed={filter ? screen.filter === label || (!screen.filter && /^todos|^todas/i.test(label)) : undefined}
      data-control={filter ? "filter" : "button"}
      onClick={submit ? undefined : () => filter ? screen.setFilter(label) : screen.run(label, target)}>
      {leading && <Icon name={leading} />}{children}
    </button>
  );
}

export function FieldValue({ label, sample, ...props }) {
  const screen = useContext(ScreenContext);
  const name = normalize(label);
  const isPassword = /contrasena|clave secreta/.test(name);
  const isEmail = /correo|email/.test(name);
  const [show, setShow] = useState(false);
  const inputName = isPassword ? "password" : isEmail ? "email" : name.replace(/[^a-z0-9]+/g, "_").replace(/_$/, "");
  const passwordPlaceholder = /^[•●*]+$/.test(sample) ? sample : "••••••••••";
  return <>
    {screen.path.startsWith("/acceso") && (isEmail || isPassword) && <Icon name={isEmail ? "mail" : "lock"} />}
    <input {...props} className={(props.className ?? "") + " field-value"} name={inputName} aria-label={label}
      placeholder={isPassword ? passwordPlaceholder : sample}
      type={isPassword && !show ? "password" : isEmail ? "email" : "text"}
      inputMode={/^(monto|importe|cantidad|precio|valor)/.test(name) ? "decimal" : undefined}
      autoComplete={isPassword ? "current-password" : isEmail ? "email" : "off"} />
    {isPassword && <button type="button" className="reveal-field" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={show} onClick={() => setShow(!show)}>
      <Icon name={show ? "eyeOff" : "eye"} />
    </button>}
  </>;
}

export function SearchValue({ sample, ...props }) {
  const screen = useContext(ScreenContext);
  const global = /todo el sistema/.test(normalize(sample));
  return <input {...props} className={(props.className ?? "") + " field-value"} type="search" aria-label={sample} placeholder={sample}
    onChange={(event) => global ? screen.setGlobalSearch(event.target.value) : screen.setSearch(event.target.value)} />;
}

export function Check({ label, checkedByDefault, children, ...props }) {
  return <label {...props} data-control="checkbox">
    <input type="checkbox" name={normalize(label) === "recordarme" ? "remember" : normalize(label)} defaultChecked={checkedByDefault} aria-label={label} />
    {children}
  </label>;
}
