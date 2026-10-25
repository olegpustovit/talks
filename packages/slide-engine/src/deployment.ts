declare const __TALKS_STATIC__: boolean;

/** Set by the standalone Vite build; Go builds retain their remote controls. */
export const isStaticDeployment =
  typeof __TALKS_STATIC__ !== "undefined" && __TALKS_STATIC__;
