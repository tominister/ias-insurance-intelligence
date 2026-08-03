import {
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser'
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser'
import { MsalProvider, useMsal } from '@azure/msal-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { setAccessTokenGetter } from './authApi'
import { isAuthEnabled, msalConfig, tokenRequest } from './msalConfig'

type AuthProviderProps = {
  children: ReactNode
}

function AuthTokenBridge() {
  const { instance, accounts } = useMsal()

  useEffect(() => {
    if (!isAuthEnabled()) {
      setAccessTokenGetter(null)
      return
    }

    setAccessTokenGetter(async () => {
      const account = accounts[0]
      if (!account) {
        return null
      }
      return acquireAccessToken(instance, account)
    })
  }, [instance, accounts])

  return null
}

async function acquireAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<string | null> {
  try {
    const response = await instance.acquireTokenSilent({
      ...tokenRequest,
      account,
    })
    return response.accessToken
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await instance.acquireTokenRedirect({
        ...tokenRequest,
        account,
      })
      return null
    }
    throw error
  }
}

function MsalAuthProvider({ children }: AuthProviderProps) {
  const msalInstance = useMemo(() => new PublicClientApplication(msalConfig), [])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      await msalInstance.initialize()
      await msalInstance.handleRedirectPromise()
      if (active) {
        setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [msalInstance])

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground" role="status">
        Preparing sign-in...
      </div>
    )
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthTokenBridge />
      {children}
    </MsalProvider>
  )
}

export default function AuthProvider({ children }: AuthProviderProps) {
  if (!isAuthEnabled()) {
    return <>{children}</>
  }
  return <MsalAuthProvider>{children}</MsalAuthProvider>
}
