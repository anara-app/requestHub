import { createFileRoute } from '@tanstack/react-router'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Trans } from '@lingui/react/macro'

function NotFoundError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
        <span className='font-medium'><Trans>Oops! Page Not Found!</Trans></span>
        <p className='text-muted-foreground text-center'>
          <Trans>It seems like the page you're looking for</Trans> <br />
          <Trans>does not exist or might have been removed.</Trans>
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            <Trans>Go Back</Trans>
          </Button>
          <Button onClick={() => navigate({ to: '/' })}><Trans>Back to Home</Trans></Button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/(errors)/404')({
  component: NotFoundError,
})
