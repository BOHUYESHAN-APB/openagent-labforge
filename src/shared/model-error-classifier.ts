import {
  getNextFallback,
  hasMoreFallbacks,
  isRetryableModelError,
  selectFallbackProviderWithCache,
  shouldRetryError,
} from "./model-core-shim"
import type { ErrorInfo } from "./model-core-shim"
import * as connectedProvidersCache from "./connected-providers-cache"

export type { ErrorInfo }
export {
  isRetryableModelError,
  shouldRetryError,
  getNextFallback,
  hasMoreFallbacks,
  selectFallbackProviderWithCache,
}

export function selectFallbackProvider(
  providers: string[],
  preferredProviderID?: string,
): string {
  return selectFallbackProviderWithCache(
    providers,
    connectedProvidersCache,
    preferredProviderID,
  )
}
