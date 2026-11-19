# Katio Business

Aplicación de gestión construida con Next.js, Prisma y PostgreSQL. El repositorio no incluye datos comerciales, archivos privados ni valores de acceso.

## Despliegue en EasyPanel

1. Sube el contenido de esta carpeta a la raíz de un repositorio de GitHub y conecta ese repositorio a un servicio **App**. Selecciona la rama correspondiente y el constructor **Dockerfile**, con ruta de compilación `/`.
2. Crea un servicio PostgreSQL independiente. Utiliza PostgreSQL 16 para que las herramientas de respaldo incluidas en la imagen sean compatibles con la instalación local actual. Si usas otra versión, verifica que `pg_dump` y `pg_restore` sean compatibles con ella.
3. En **Environment** configura las variables que aparecen en `.env.example`: `DATABASE_URL` con la dirección interna de PostgreSQL; `NEXTAUTH_URL` con la dirección HTTPS pública completa; `NEXTAUTH_SECRET` con un valor aleatorio largo; `MASTER_KEY` con 32 bytes aleatorios codificados en base64; `STORAGE_PATH` con `/data`; y `MAX_ATTACHMENT_MB` con el límite deseado. Genera los secretos fuera del repositorio y consérvalos en un gestor seguro.
4. En **Mounts**, crea un volumen persistente y móntalo en `/data`. El proceso usa el usuario `node`; asegúrate de que pueda escribir en el volumen. Este volumen contiene adjuntos, respaldos y el buzón local.
5. Configura el dominio HTTPS apuntando al puerto interno **3000** y despliega. El arranque aplica las migraciones pendientes y prepara roles y métodos de pago. No crea usuarios de ejemplo.
6. En **Shell** del servicio, ejecuta `sh scripts/crear-administrador.sh` y sigue las indicaciones para crear el primer administrador. El script solicita la contraseña sin mostrarla y solo permite crear esa cuenta si aún no existe un superadministrador. Después cierra la consola.

La imagen se construye con Node.js 24 y pnpm. Prisma se genera durante la compilación; las migraciones se aplican al iniciar. Para verificar un cambio antes de publicarlo, utiliza un entorno de prueba y revisa los registros de compilación y arranque.

## Datos existentes y respaldos

Un despliegue nuevo comienza con una base de datos vacía. El código de GitHub no transfiere automáticamente los datos del computador. Para trasladarlos se necesita una migración o restauración planificada de la base y de los archivos. La `MASTER_KEY` original es necesaria para abrir los secretos y respaldos que fueron cifrados con ella; nunca la publiques ni la sustituyas sin un proceso de migración.

Protege y prueba periódicamente los respaldos tanto de PostgreSQL como del volumen `/data`. No elimines un volumen ni cambies la clave de cifrado al actualizar el servicio. Configura una sola instancia de la aplicación salvo que se haya preparado almacenamiento compartido y revisado la concurrencia.

## Recuperación de contraseña

En Configuración → Correo electrónico, un administrador autorizado puede conectar una cuenta personal de Gmail mediante una contraseña de aplicación. Google requiere verificación en dos pasos y puede imponer límites de envío. La clave se almacena cifrada con MASTER_KEY; no se muestra de nuevo. Usa el botón de comprobar conexión y prueba el flujo completo de recuperación con una cuenta propia antes de habilitarlo para usuarios remotos.

En producción no se envían mensajes hasta configurar Gmail. En desarrollo, si no hay una cuenta configurada, los mensajes se guardan cifrados en el buzón local.
