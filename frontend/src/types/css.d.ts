declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'postcss-import';
declare module 'tailwindcss/nesting'; 