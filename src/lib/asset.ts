/** URL of a file in `public/`, prefixed with the deploy base (e.g. `/ptptn-grad/` on GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
