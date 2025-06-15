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

// Core imports from the Tasks feature - these would be moved inline in a full migration
import { columns } from '@/features/tasks/components/columns'
import { DataTable } from '@/features/tasks/components/data-table'
import { TasksDialogs } from '@/features/tasks/components/tasks-dialogs'
import TasksProvider from '@/features/tasks/context/tasks-context'
import { tasks } from '@/features/tasks/data/tasks'

// Simplified TasksPrimaryButtons component - moved from features/tasks/components/tasks-primary-buttons.tsx
function TasksPrimaryButtons() {
  return (
    <div className='flex gap-2'>
      <Button variant='outline' size='sm'>
        <Trans>Import</Trans>
      </Button>
      <Button size='sm'>
        <Trans>Add Task</Trans>
      </Button>
    </div>
  )
}

// Main Tasks component - moved from features/tasks/index.tsx
function Tasks() {
  return (
    <TasksProvider>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'><Trans>Tasks</Trans></h2>
            <p className='text-muted-foreground'>
              <Trans>Here&apos;s a list of your tasks for this month!</Trans>
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable data={tasks} columns={columns} />
        </div>
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: Tasks,
})
