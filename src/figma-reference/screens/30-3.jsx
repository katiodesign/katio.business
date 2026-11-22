import { Action, Check, FieldValue, SearchValue } from "../controls";

const imgIcon = "/figma/a1f9b3c2-f28c-4003-8a2e-c1f74e543884.svg";
const imgIcon1 = "/figma/463244f9-8d47-4bd1-9849-75437f7f48c1.svg";
export default function AccesoInicioDeSesion() {
    return (<div className="bg-[var(--bg-canvas,#f9fafc)] content-stretch flex gap-[var(--spacing-3xl,32px)] items-start p-[var(--spacing-3xl,32px)] relative size-full" data-node-id="30:3" data-name="Acceso · Inicio de sesión">
      <div className="flex-[1_0_0] h-full min-w-px overflow-clip relative rounded-[var(--radius-3xl,32px)]" data-node-id="30:4" style={{ backgroundImage: "linear-gradient(150.472971311153deg, rgb(238, 242, 255) 0%, rgb(246, 251, 234) 76.923%)" }} data-name="Panel de marca">
        <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[var(--spacing-md,12px)] items-start left-[48px] overflow-clip right-[48px] top-[631px]" data-node-id="30:7" data-name="contenido">
          <div className="font-dm font-medium leading-[0] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-5xl,32px)] tracking-[-0.6px] whitespace-nowrap" data-node-id="30:25" style={{ fontVariationSettings: '"opsz" 14' }}>
            <p className="leading-[var(--font-line-height-5xl,40px)] mb-0">Todo tu negocio,</p>
            <p className="leading-[var(--font-line-height-5xl,40px)]">en un solo lugar.</p>
          </div>
          <p className="font-dm font-normal leading-[var(--font-line-height-base,20px)] min-w-full opacity-85 relative shrink-0 text-[color:var(--text-secondary,#4b5263)] text-[length:var(--font-size-base,14px)] w-[min-content]" data-node-id="30:26" style={{ fontVariationSettings: '"opsz" 14' }}>
            Cotizaciones, facturación, trabajos, clientes y finanzas en un espacio de trabajo interno, claro y ordenado.
          </p>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[var(--spacing-3xl,32px)] h-full items-center justify-center min-w-px overflow-clip px-[16px] relative" data-node-id="30:27" data-name="Formulario">
        <div className="login-brand" aria-label="Katio Business"><img className="login-brand-light" src="/logo_app_p.svg" alt="Katio Business"/><img className="login-brand-dark" src="/logo_app_n.svg" alt="" aria-hidden="true"/></div>
        <div className="bg-[var(--bg-surface,white)] border border-[var(--border-subtle,#f0f2f5)] border-solid content-stretch flex flex-col gap-[var(--spacing-xl,20px)] items-start max-w-[440px] overflow-clip p-[var(--spacing-3xl,32px)] relative rounded-[var(--radius-2xl,24px)] shadow-[0px_4px_16px_0px_rgba(26,28,35,0.06),0px_1px_3px_0px_rgba(26,28,35,0.04)] shrink-0 w-full" data-node-id="30:32" data-name="Tarjeta de acceso">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[var(--spacing-2xs,4px)] items-start overflow-clip relative shrink-0 w-full whitespace-nowrap" data-node-id="30:33" data-name="titulo">
            <p className="font-dm font-medium leading-[var(--font-line-height-3xl,32px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-3xl,24px)] tracking-[-0.3px]" data-node-id="30:34" style={{ fontVariationSettings: '"opsz" 14' }}>
              Bienvenida de nuevo
            </p>
            <p className="font-dm font-normal leading-[var(--font-line-height-base,20px)] relative shrink-0 text-[color:var(--text-secondary,#4b5263)] text-[length:var(--font-size-base,14px)]" data-node-id="30:35" style={{ fontVariationSettings: '"opsz" 14' }}>
              Inicia sesión para entrar al sistema interno.
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[var(--spacing-xs,6px)] items-start overflow-clip relative shrink-0 w-full" data-node-id="30:36" data-name="Field">
            <p className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-sm,16px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-sm,12px)] whitespace-nowrap" data-node-id="I30:36;7:21" style={{ fontVariationSettings: '"opsz" 14' }}>
              Correo electrónico
            </p>
            <div className="bg-[var(--bg-surface,white)] border border-[var(--border-default,#e5e9f0)] border-solid content-stretch flex gap-[var(--spacing-sm,8px)] items-center min-h-[44px] overflow-clip px-[var(--spacing-lg,16px)] py-[var(--spacing-md,12px)] relative rounded-[var(--radius-lg,16px)] shrink-0 w-full" data-node-id="I30:36;7:22" data-name="box">
              <FieldValue className="[word-break:break-word] flex-[1_0_0] font-dm font-normal leading-[var(--font-line-height-base,20px)] min-w-px relative text-[color:var(--text-tertiary,#6f768a)] text-[length:var(--font-size-base,14px)]" data-node-id="I30:36;7:26" style={{ fontVariationSettings: '"opsz" 14' }} label={"Correo electrónico"} sample={"correo@empresa.com"}>
                </FieldValue>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[var(--spacing-xs,6px)] items-start overflow-clip relative shrink-0 w-full" data-node-id="30:51" data-name="Field">
            <p className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-sm,16px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-sm,12px)] whitespace-nowrap" data-node-id="I30:51;7:21" style={{ fontVariationSettings: '"opsz" 14' }}>
              Contraseña
            </p>
            <div className="bg-[var(--bg-surface,white)] border border-[var(--border-default,#e5e9f0)] border-solid content-stretch flex gap-[var(--spacing-sm,8px)] items-center min-h-[44px] overflow-clip px-[var(--spacing-lg,16px)] py-[var(--spacing-md,12px)] relative rounded-[var(--radius-lg,16px)] shrink-0 w-full" data-node-id="I30:51;7:22" data-name="box">
              <FieldValue className="[word-break:break-word] flex-[1_0_0] font-dm font-normal leading-[var(--font-line-height-base,20px)] min-w-px relative text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-base,14px)]" data-node-id="I30:51;7:26" style={{ fontVariationSettings: '"opsz" 14' }} label={"Contraseña"} sample={"••••••••••"}>
                </FieldValue>
            </div>
          </div>
          <div className="content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-node-id="30:65" data-name="opciones">
            <Check className="content-stretch flex gap-[var(--spacing-sm,8px)] items-center overflow-clip relative shrink-0" data-node-id="30:66" data-name="Checkbox" label={"Recordarme"} checkedByDefault={true}>
              <div className="bg-[var(--brand-default,#4a72ff)] content-stretch flex items-center justify-center overflow-clip relative rounded-[var(--radius-xs,4px)] shrink-0 size-[20px]" data-node-id="I30:66;7:89" data-name="box">
                <div className="relative shrink-0 size-[14px]" data-node-id="I30:66;7:90" data-name="icon">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon}/>
                </div>
              </div>
              <p className="[word-break:break-word] font-dm font-normal leading-[var(--font-line-height-base,20px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-base,14px)] whitespace-nowrap" data-node-id="I30:66;7:92" style={{ fontVariationSettings: '"opsz" 14' }}>
                Recordarme
              </p>
            </Check>
            <div className="flex-[1_0_0] h-px min-w-px relative" data-node-id="30:72" data-name="spacer"/>
            <Action className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-sm,16px)] relative shrink-0 text-[color:var(--text-brand,#3b5bcc)] text-[length:var(--font-size-sm,12px)] whitespace-nowrap" data-node-id="30:73" style={{ fontVariationSettings: '"opsz" 14' }} label={"¿Olvidaste tu contraseña?"}>
              ¿Olvidaste tu contraseña?
            </Action>
          </div>
          <Action className="bg-[var(--brand-hover,#3b5bcc)] content-stretch flex gap-[var(--spacing-sm,8px)] h-[44px] items-center justify-center overflow-clip px-[var(--spacing-xl,20px)] relative rounded-[var(--radius-full,9999px)] shrink-0 w-full" data-node-id="30:74" data-name="Button" label={"Iniciar sesión"}>
            <p className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-base,20px)] relative shrink-0 text-[color:var(--text-on-brand,white)] text-[length:var(--font-size-base,14px)] whitespace-nowrap" data-node-id="I30:74;6:6" style={{ fontVariationSettings: '"opsz" 14' }}>
              Iniciar sesión
            </p>
          </Action>
          <div className="content-stretch flex gap-[var(--spacing-sm,8px)] items-center justify-center overflow-clip relative shrink-0 w-full" data-node-id="30:80" data-name="nota">
            <div className="relative shrink-0 size-[16px]" data-node-id="30:81" data-name="icon">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon1}/>
            </div>
            <p className="[word-break:break-word] font-dm font-normal leading-[var(--font-line-height-xs,14px)] relative shrink-0 text-[color:var(--text-tertiary,#6f768a)] text-[length:var(--font-size-xs,11px)] w-[340px]" data-node-id="30:83" style={{ fontVariationSettings: '"opsz" 14' }}>
              Acceso solo por invitación. Las cuentas las crea el superadministrador.
            </p>
          </div>
        </div>
        <p className="[word-break:break-word] font-dm font-normal leading-[var(--font-line-height-2xs,12px)] relative shrink-0 text-[color:var(--text-tertiary,#6f768a)] text-[length:var(--font-size-2xs,10px)] whitespace-nowrap" data-node-id="30:84" style={{ fontVariationSettings: '"opsz" 14' }}>
          © 2026 Katio Business · Uso interno · Privacidad · Términos
        </p>
      </div>
    </div>);
}
