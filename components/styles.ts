// Button and link styles, shared by every screen (neutral styling, D9).

const base =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed";

export const btn = {
  primary: `${base} bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-300 disabled:text-zinc-600`,
  secondary: `${base} border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 disabled:text-zinc-500`,
  toggleOn: `${base} border-2 border-blue-600 bg-blue-50 text-blue-900`,
  toggleOff: `${base} border-2 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100`,
  link: "text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-600 rounded-sm",
};
