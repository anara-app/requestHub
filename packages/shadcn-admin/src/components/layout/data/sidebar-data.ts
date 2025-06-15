import {
  IconBarrierBlock,
  IconBrowserCheck,
  IconBug,
  IconChecklist,
  IconError404,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: t`Shadcn Admin`,
      logo: Command,
      plan: t`Vite + ShadcnUI`,
    },
    {
      name: t`Acme Inc`,
      logo: GalleryVerticalEnd,
      plan: t`Enterprise`,
    },
    {
      name: t`Acme Corp.`,
      logo: AudioWaveform,
      plan: t`Startup`,
    },
  ],
  navGroups: [
    {
      title: t`General`,
      items: [
        {
          title: t`Dashboard`,
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: t`Tasks`,
          url: '/tasks',
          icon: IconChecklist,
        },
        {
          title: t`Apps`,
          url: '/apps',
          icon: IconPackages,
        },
        {
          title: t`Chats`,
          url: '/chats',
          badge: '3',
          icon: IconMessages,
        },
        {
          title: t`Users`,
          url: '/users',
          icon: IconUsers,
        }
      ],
    },
    {
      title: t`Pages`,
      items: [
        {
          title: t`Auth`,
          icon: IconLockAccess,
          items: [
            {
              title: t`Sign In`,
              url: '/sign-in',
            },
            {
              title: t`Sign In (2 Col)`,
              url: '/sign-in-2',
            },
            {
              title: t`Sign Up`,
              url: '/sign-up',
            },
            {
              title: t`Forgot Password`,
              url: '/forgot-password',
            },
            {
              title: t`OTP`,
              url: '/otp',
            },
          ],
        },
        {
          title: t`Errors`,
          icon: IconBug,
          items: [
            {
              title: t`Unauthorized`,
              url: '/401',
              icon: IconLock,
            },
            {
              title: t`Forbidden`,
              url: '/403',
              icon: IconUserOff,
            },
            {
              title: t`Not Found`,
              url: '/404',
              icon: IconError404,
            },
            {
              title: t`Internal Server Error`,
              url: '/500',
              icon: IconServerOff,
            },
            {
              title: t`Maintenance Error`,
              url: '/503',
              icon: IconBarrierBlock,
            },
          ],
        },
      ],
    },
    {
      title: t`Other`,
      items: [
        {
          title: t`Settings`,
          icon: IconSettings,
          items: [
            {
              title: t`Profile`,
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: t`Account`,
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: t`Appearance`,
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: t`Notifications`,
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: t`Display`,
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: t`Help Center`,
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}
