import { InteractionStatus } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { loginRequest } from './msalConfig'

type ProtectedRouteProps = {
  children: ReactNode
  authEnabled: boolean
}

export default function ProtectedRoute({ children, authEnabled }: ProtectedRouteProps) {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = accounts.length > 0

  useEffect(() => {
    if (!authEnabled) {
      return
    }
    if (inProgress !== InteractionStatus.None) {
      return
    }
    if (!isAuthenticated) {
      void instance.loginRedirect(loginRequest)
    }
  }, [authEnabled, inProgress, isAuthenticated, instance])

  if (!authEnabled) {
    return <>{children}</>
  }

  if (inProgress !== InteractionStatus.None || !isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground" role="status">
        Signing you in with Microsoft...
      </div>
    )
  }

  return <>{children}</>
}
