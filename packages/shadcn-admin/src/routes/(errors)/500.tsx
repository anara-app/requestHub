import { createFileRoute } from '@tanstack/react-router'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trans } from '@lingui/react/macro'

interface GeneralErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  minimal?: boolean
}

function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        {!minimal && (
          <h1 className='text-[7rem] leading-tight font-bold'>500</h1>
        )}
        <span className='font-medium'><Trans>Oops! Something went wrong {`:')`}</Trans></span>
        <p className='text-muted-foreground text-center'>
          <Trans>We apologize for the inconvenience.</Trans> <br /> <Trans>Please try again later.</Trans>
        </p>
        {!minimal && (
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => history.go(-1)}>
              <Trans>Go Back</Trans>
            </Button>
            <Button onClick={() => navigate({ to: '/' })}><Trans>Back to Home</Trans></Button>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/(errors)/500')({
  component: GeneralError,
})
