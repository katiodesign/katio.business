import { Action, Check, FieldValue, SearchValue } from "../controls";

const imgIcon = "/figma/72164b2e-6c4e-4b2d-aa2a-b6d123b75eba.svg";
const imgIcon1 = "/figma/8e808034-9c25-40ed-aeaf-0806a7a15b7d.svg";
export default function MovilAcceso() {
    return (<div className="bg-[var(--bg-canvas,#f9fafc)] content-stretch flex flex-col gap-[24px] items-start pb-[16px] pt-[64px] px-[16px] relative size-full" data-node-id="229:399" data-name="Móvil · Acceso">
      <div className="login-brand" aria-label="Katio Business"><img className="login-brand-light" src="/logo_app_p.svg" alt="Katio Business"/><img className="login-brand-dark" src="/logo_app_n.svg" alt="" aria-hidden="true"/></div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[var(--spacing-2xs,4px)] items-start overflow-clip relative shrink-0 w-full" data-node-id="229:404" data-name="t">
        <p className="font-dm font-medium leading-[var(--font-line-height-3xl,32px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-3xl,24px)] tracking-[-0.3px] whitespace-nowrap" data-node-id="229:405" style={{ fontVariationSettings: '"opsz" 14' }}>
          Bienvenida de nuevo
        </p>
        <p className="font-dm font-normal leading-[var(--font-line-height-base,20px)] min-w-full relative shrink-0 text-[color:var(--text-secondary,#4b5263)] text-[length:var(--font-size-base,14px)] w-[min-content]" data-node-id="229:406" style={{ fontVariationSettings: '"opsz" 14' }}>
          Inicia sesión para entrar al sistema interno.
        </p>
      </div>
      <div className="content-stretch flex flex-col gap-[var(--spacing-xs,6px)] items-start overflow-clip relative shrink-0 w-full" data-node-id="229:407" data-name="Field">
        <p className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-sm,16px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-sm,12px)] whitespace-nowrap" data-node-id="I229:407;7:21" style={{ fontVariationSettings: '"opsz" 14' }}>
          Correo electrónico
        </p>
        <div className="bg-[var(--bg-surface,white)] border border-[var(--border-default,#e5e9f0)] border-solid content-stretch flex gap-[var(--spacing-sm,8px)] items-center min-h-[44px] overflow-clip px-[var(--spacing-lg,16px)] py-[var(--spacing-md,12px)] relative rounded-[var(--radius-lg,16px)] shrink-0 w-full" data-node-id="I229:407;7:22" data-name="box">
          <FieldValue className="[word-break:break-word] flex-[1_0_0] font-dm font-normal leading-[var(--font-line-height-base,20px)] min-w-px relative text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-base,14px)]" data-node-id="I229:407;7:26" style={{ fontVariationSettings: '"opsz" 14' }} label={"Correo electrónico"} sample={"correo@empresa.com"}>
            </FieldValue>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[var(--spacing-xs,6px)] items-start overflow-clip relative shrink-0 w-full" data-node-id="229:422" data-name="Field">
        <p className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-sm,16px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-sm,12px)] whitespace-nowrap" data-node-id="I229:422;7:21" style={{ fontVariationSettings: '"opsz" 14' }}>
          Contraseña
        </p>
        <div className="bg-[var(--bg-surface,white)] border border-[var(--border-default,#e5e9f0)] border-solid content-stretch flex gap-[var(--spacing-sm,8px)] items-center min-h-[44px] overflow-clip px-[var(--spacing-lg,16px)] py-[var(--spacing-md,12px)] relative rounded-[var(--radius-lg,16px)] shrink-0 w-full" data-node-id="I229:422;7:22" data-name="box">
          <FieldValue className="[word-break:break-word] flex-[1_0_0] font-dm font-normal leading-[var(--font-line-height-base,20px)] min-w-px relative text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-base,14px)]" data-node-id="I229:422;7:26" style={{ fontVariationSettings: '"opsz" 14' }} label={"Contraseña"} sample={"••••••••••"}>
            </FieldValue>
        </div>
      </div>
      <div className="content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-node-id="229:436" data-name="opciones">
        <Check className="content-stretch flex gap-[var(--spacing-sm,8px)] items-center overflow-clip relative shrink-0" data-node-id="229:437" data-name="Checkbox" label={"Recordarme"} checkedByDefault={true}>
          <div className="bg-[var(--brand-default,#4a72ff)] content-stretch flex items-center justify-center overflow-clip relative rounded-[var(--radius-xs,4px)] shrink-0 size-[20px]" data-node-id="I229:437;7:89" data-name="box">
            <div className="relative shrink-0 size-[14px]" data-node-id="I229:437;7:90" data-name="icon">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon}/>
            </div>
          </div>
          <p className="[word-break:break-word] font-dm font-normal leading-[var(--font-line-height-base,20px)] relative shrink-0 text-[color:var(--text-primary,#181b26)] text-[length:var(--font-size-base,14px)] whitespace-nowrap" data-node-id="I229:437;7:92" style={{ fontVariationSettings: '"opsz" 14' }}>
            Recordarme
          </p>
        </Check>
        <div className="flex-[1_0_0] h-px min-w-px relative" data-node-id="229:443" data-name="spacer"/>
        <Action className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-sm,16px)] relative shrink-0 text-[color:var(--text-brand,#3b5bcc)] text-[length:var(--font-size-sm,12px)] whitespace-nowrap" data-node-id="229:444" style={{ fontVariationSettings: '"opsz" 14' }} label={"¿Olvidaste tu contraseña?"}>
          ¿Olvidaste tu contraseña?
        </Action>
      </div>
      <Action className="bg-[var(--brand-hover,#3b5bcc)] content-stretch flex gap-[var(--spacing-sm,8px)] h-[44px] items-center justify-center overflow-clip px-[var(--spacing-xl,20px)] relative rounded-[var(--radius-full,9999px)] shrink-0 w-full" data-node-id="229:445" data-name="Button" label={"Iniciar sesión"}>
        <p className="[word-break:break-word] font-dm font-medium leading-[var(--font-line-height-base,20px)] relative shrink-0 text-[color:var(--text-on-brand,white)] text-[length:var(--font-size-base,14px)] whitespace-nowrap" data-node-id="I229:445;6:6" style={{ fontVariationSettings: '"opsz" 14' }}>
          Iniciar sesión
        </p>
      </Action>
      <div className="content-stretch flex gap-[var(--spacing-sm,8px)] items-center overflow-clip relative shrink-0 w-full" data-node-id="229:450" data-name="nota">
        <div className="relative shrink-0 size-[16px]" data-node-id="229:451" data-name="icon">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon1}/>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-dm font-normal leading-[var(--font-line-height-xs,14px)] min-w-px relative text-[color:var(--text-tertiary,#6f768a)] text-[length:var(--font-size-xs,11px)]" data-node-id="229:453" style={{ fontVariationSettings: '"opsz" 14' }}>
          Acceso solo por invitación. Las cuentas las crea el superadministrador.
        </p>
      </div>
    </div>);
}
