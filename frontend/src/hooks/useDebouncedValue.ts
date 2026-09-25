import { useEffect, useState } from "react";

/**
 * Return a value that settles after the caller has stopped changing it.
 * The timer is recreated only when the source value or delay changes and is
 * always cleaned up when the component unmounts or the source changes.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
