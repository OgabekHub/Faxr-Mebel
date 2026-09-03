import type * as React from 'react';

/** Runtime API of the <model-viewer> custom element that the app relies on. */
export interface ModelViewerElement extends HTMLElement {
  cameraOrbit: string;
  activateAR(): Promise<void>;
  resetTurntableRotation(): void;
}

type ModelViewerAttributes = React.DetailedHTMLProps<
  React.HTMLAttributes<ModelViewerElement>,
  ModelViewerElement
> & {
  src?: string;
  'ios-src'?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: string;
  'ar-placement'?: string;
  'camera-controls'?: boolean;
  'camera-orbit'?: string;
  'auto-rotate'?: boolean;
  'auto-rotate-delay'?: number | string;
  'rotation-per-second'?: string;
  'shadow-intensity'?: string | number;
  'shadow-softness'?: string | number;
  exposure?: string | number;
  'environment-image'?: string;
  skybox?: string;
  loading?: 'auto' | 'lazy' | 'eager';
  reveal?: 'auto' | 'manual';
  'disable-zoom'?: boolean;
  'touch-action'?: string;
  'interaction-prompt'?: string;
  'field-of-view'?: string;
  'min-field-of-view'?: string;
  'max-field-of-view'?: string;
};

// React 19 keeps JSX types under the `react` module, so the custom element is
// registered through module augmentation instead of a global JSX namespace
// (a global declaration would replace React's own intrinsic elements).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}
