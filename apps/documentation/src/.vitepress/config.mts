import { defineConfig } from 'vitepress'

const coreSidebarEn = [
  { text: 'Overview', link: '/core-api/' },
  { text: 'Compression', link: '/core-api/compress' },
  { text: 'Inspect and Check', link: '/core-api/inspect-check' },
  { text: 'Split', link: '/core-api/split' },
  { text: 'Merge', link: '/core-api/merge' },
  { text: 'Organize', link: '/core-api/organize' },
  { text: 'Watermark', link: '/core-api/watermark' },
  { text: 'Extract Images', link: '/core-api/extract-images' }
]

const runtimeSidebarEn = [
  { text: 'By Build Type (Centralized)', link: '/runtime-endpoints/build-types' },
  { text: 'Overview', link: '/runtime-endpoints/' },
  { text: 'React Native JSI', link: '/runtime-endpoints/jsi' },
  { text: 'Native C FFI', link: '/runtime-endpoints/native-c' }
]

const coreSidebarFr = [
  { text: "Vue d'ensemble", link: '/fr/core-api/' },
  { text: 'Compression', link: '/fr/core-api/compress' },
  { text: 'Inspecter et Vérifier', link: '/fr/core-api/inspect-check' },
  { text: 'Diviser', link: '/fr/core-api/split' },
  { text: 'Fusionner', link: '/fr/core-api/merge' },
  { text: 'Organiser', link: '/fr/core-api/organize' },
  { text: 'Filigrane', link: '/fr/core-api/watermark' },
  { text: "Extraction d'Images", link: '/fr/core-api/extract-images' }
]

const runtimeSidebarFr = [
  { text: 'Par Type de Build (Centralisé)', link: '/fr/runtime-endpoints/build-types' },
  { text: "Vue d'ensemble", link: '/fr/runtime-endpoints/' },
  { text: 'React Native JSI', link: '/fr/runtime-endpoints/jsi' },
  { text: 'Native C FFI', link: '/fr/runtime-endpoints/native-c' }
]

export default defineConfig({
  title: 'Giovanni API Docs',
  description: 'Core API reference for @acajoo/giovanni-core',
  cleanUrls: true,
  head: [['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        logo: '/favicon.svg',
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Core API', link: '/core-api/' },
          { text: 'Runtime Endpoints', link: '/runtime-endpoints/build-types' }
        ],
        sidebar: [
          { text: 'Core API', items: coreSidebarEn },
          { text: 'Runtime Endpoints', items: runtimeSidebarEn }
        ],
        socialLinks: [{ icon: 'github', link: 'https://github.com/acajoohq/giovanni' }],
        docFooter: { prev: 'Previous page', next: 'Next page' },
        outline: { label: 'On this page' },
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Back to top',
        darkModeSwitchLabel: 'Theme',
        darkModeSwitchTitle: 'Toggle dark mode'
      }
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      link: '/fr/',
      themeConfig: {
        logo: '/favicon.svg',
        nav: [
          { text: 'Accueil', link: '/fr/' },
          { text: 'API Core', link: '/fr/core-api/' },
          { text: 'Endpoints Runtime', link: '/fr/runtime-endpoints/build-types' }
        ],
        sidebar: [
          { text: 'API Core', items: coreSidebarFr },
          { text: 'Endpoints Runtime', items: runtimeSidebarFr }
        ],
        socialLinks: [{ icon: 'github', link: 'https://github.com/acajoohq/giovanni' }],
        docFooter: { prev: 'Page précédente', next: 'Page suivante' },
        outline: { label: 'Sur cette page' },
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Retour en haut',
        darkModeSwitchLabel: 'Thème',
        darkModeSwitchTitle: 'Changer le mode sombre'
      }
    }
  }
})