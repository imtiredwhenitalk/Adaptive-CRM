import { useCallback, useState } from 'react'
export function useChanges<T>(initial: T) {
  const [value, setValue] = useState(initial)
  const update = useCallback((next: T) => setValue(next), [])
  return { value, update, dirty: value !== initial }
}