import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://stylora.xyz',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: 'Stylora Docs',
      description: 'Deploy, run, and understand Stylora - the browser-native PostgreSQL workspace for teams.',
      logo: {
        src: './src/assets/stylora-mark.svg',
        alt: 'Stylora',
      },
      customCss: ['./src/styles/starlight.css'],
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'robots',
            content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'googlebot',
            content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#f4f0e6',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'alternate',
            type: 'text/plain',
            href: '/llms.txt',
            title: 'LLMs guide',
          },
        },
      ],
      components: {
        PageTitle: './src/components/starlight/PageTitle.astro',
      },
      editLink: {
        baseUrl: 'https://github.com/thomasorgeval/stylora/edit/main/apps/site/',
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/thomasorgeval/stylora' }],
      sidebar: [
        {
          label: 'Start Here',
          items: ['docs/getting-started', 'docs/cloud'],
        },
        {
          label: 'Deploy',
          items: ['docs/self-hosting'],
        },
        {
          label: 'Concepts',
          autogenerate: { directory: 'docs/concepts' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'docs/reference' },
        },
      ],
    }),
  ],
})
