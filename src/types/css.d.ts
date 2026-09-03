// Allows CSS custom properties in React style objects,
// e.g. style={{ '--mouse-x': '12px' }} without @ts-ignore.
import 'react';

declare module 'react' {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined;
  }
}
