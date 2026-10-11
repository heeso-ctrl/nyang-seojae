declare module '*vendor/foliate-js/view.js' {
  export function makeBook(file: File): Promise<unknown>;
}

declare module '*vendor/foliate-js/overlayer.js' {
  export class Overlayer {
    static underline(rects: DOMRectList, options?: { color?: string; width?: number; writingMode?: string }): SVGElement;
  }
}
