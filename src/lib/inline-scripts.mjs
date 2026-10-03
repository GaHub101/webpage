// Inline-Skripte, die vor dem ersten Rendern laufen müssen.
// Ihr Hash wird in astro.config.mjs automatisch in die Content-Security-Policy eingetragen.
export const JS_FLAG = "document.documentElement.classList.add('js')";
