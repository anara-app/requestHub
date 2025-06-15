import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Trans } from '@lingui/react/macro'

// NOTE: In a real-world scenario, you would move all the complex components here.
// For demonstration purposes, I'm showing the core structure and importing the 
// complex components from the feature folder. You could migrate them one by one.

// Core imports from the Users feature - these would be moved inline in a full migration
import { columns } from '@/features/users/components/users-columns'
import { UsersDialogs } from '@/features/users/components/users-dialogs'
import { UsersTable } from '@/features/users/components/users-table'
import UsersProvider from '@/features/users/context/users-context'
import { userListSchema } from '@/features/users/data/schema'
import { users } from '@/features/users/data/users'

// Simplified UsersPrimaryButtons component - moved from features/users/components/users-primary-buttons.tsx
function UsersPrimaryButtons() {
  return (
    <div className='flex gap-2'>
      <Button variant='outline' size='sm'>
        <Trans>Import</Trans>
      </Button>
      <Button size='sm'>
        <Trans>Add User</Trans>
      </Button>
    </div>
  )
}

// Main Users component - moved from features/users/index.tsx
function Users() {
  // Parse user list
  const userList = userListSchema.parse(users)

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'><Trans>User List</Trans></h2>
            <p className='text-muted-foreground'>
              <Trans>Manage your users and their roles here.</Trans>
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <UsersTable data={userList} columns={columns} />
        </div>
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}

export const Route = createFileRoute('/_authenticated/users/')({
  component: Users,
})
