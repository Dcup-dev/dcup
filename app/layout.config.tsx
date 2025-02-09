import { Logo } from '@/components/Logo/logo';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = { 
  nav: {
    enableSearch: true,
    enabled: false,
    transparentMode: "always",
    children: <Logo href='/'/>
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
  ],
  
};
