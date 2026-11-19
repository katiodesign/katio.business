#!/bin/sh
set -eu

printf 'Nombre del administrador: '
read -r BOOTSTRAP_NAME
printf 'Correo electrónico: '
read -r BOOTSTRAP_EMAIL
printf 'Contraseña (mínimo 14 caracteres): '
stty -echo
trap 'stty echo' EXIT HUP INT TERM
read -r BOOTSTRAP_PASSWORD
stty echo
trap - EXIT HUP INT TERM
printf '\n'
export BOOTSTRAP_NAME BOOTSTRAP_EMAIL BOOTSTRAP_PASSWORD
pnpm bootstrap
unset BOOTSTRAP_NAME BOOTSTRAP_EMAIL BOOTSTRAP_PASSWORD
