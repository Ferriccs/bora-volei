import { Capacitor } from '@capacitor/core'

// true quando o app está rodando como APK (Android), false no navegador / PWA
export const ehApp = Capacitor.isNativePlatform()

// Endereço público do site (ex.: https://bora-volei.vercel.app), definido em VITE_SITE_URL.
// No navegador usamos o endereço aberto agora (assim funciona também no localhost).
// No APK o endereço interno é "https://localhost", que não serve para links: usamos o do site.
export const SITE_URL = (ehApp ? import.meta.env.VITE_SITE_URL || '' : window.location.origin).replace(/\/$/, '')
