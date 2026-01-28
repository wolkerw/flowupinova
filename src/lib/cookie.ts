"use client";

/**
 * Sets a browser cookie.
 * @param name The name of the cookie.
 * @param value The value of the cookie.
 * @param days The number of days until the cookie expires.
 */
export function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // This check is important for Server-Side Rendering (SSR) environments
  if (typeof document !== 'undefined') {
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }
}

/**
 * Erases a browser cookie by setting its max-age to a past value.
 * @param name The name of the cookie to erase.
 */
export function eraseCookie(name: string) {
    // This check is important for SSR
    if (typeof document !== 'undefined') {
      document.cookie = name+'=; Max-Age=-99999999; path=/;';
    }
}
