import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";

/**
 * 防抖导航 hook，防止快速重复点击导致多次导航
 * 使用方法: const debouncedPush = useDebouncedNavigation();
 *         debouncedPush("/path");
 */
export function useDebouncedNavigation(delayMs: number = 500) {
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  const push = useCallback(
    (href: string | { pathname: string; params?: Record<string, string> }) => {
      if (isNavigatingRef.current) {
        return;
      }

      isNavigatingRef.current = true;
      router.push(href as any);

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, delayMs);
    },
    [router, delayMs]
  );

  const replace = useCallback(
    (href: string | { pathname: string; params?: Record<string, string> }) => {
      if (isNavigatingRef.current) {
        return;
      }

      isNavigatingRef.current = true;
      router.replace(href as any);

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, delayMs);
    },
    [router, delayMs]
  );

  const back = useCallback(() => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    router.back();

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, delayMs);
  }, [router, delayMs]);

  return { push, replace, back };
}