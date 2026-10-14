import { useState, useEffect, useCallback } from "react"

export interface SyncedStorageOptions<T> {
  eventName?: string
  transform?: (val: any) => T
  validate?: (val: any) => boolean
}

export function useSyncedStorage<T>(
  key: string,
  defaultValue: T,
  options?: string | SyncedStorageOptions<T>,
): [T, (val: T | ((prev: T) => T)) => void] {
  const eventName = typeof options === "string" ? options : options?.eventName
  const transform = typeof options === "object" ? options?.transform : undefined
  const validate = typeof options === "object" ? options?.validate : undefined

  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return defaultValue
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (validate && !validate(parsed)) return defaultValue
        return transform ? transform(parsed) : parsed
      }
    } catch {
      // Retornar valor por defecto si ocurre error de parseo
    }
    return defaultValue
  }, [key, defaultValue, transform, validate])

  const [value, setValue] = useState<T>(readValue)

  useEffect(() => {
    const handleSync = () => {
      setValue(readValue())
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) handleSync()
    }

    if (eventName) {
      window.addEventListener(eventName, handleSync)
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      if (eventName) {
        window.removeEventListener(eventName, handleSync)
      }
      window.removeEventListener("storage", handleStorage)
    }
  }, [key, eventName, readValue])

  const updateValue = useCallback(
    (action: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof action === "function" ? (action as (prev: T) => T)(prev) : action
        try {
          localStorage.setItem(key, JSON.stringify(next))
          if (eventName) {
            window.dispatchEvent(new Event(eventName))
          }
        } catch {
          // LocalStorage lleno o restringido
        }
        return next
      })
    },
    [key, eventName],
  )

  return [value, updateValue]
}
