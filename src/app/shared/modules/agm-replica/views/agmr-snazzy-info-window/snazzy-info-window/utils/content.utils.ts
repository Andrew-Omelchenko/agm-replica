// Set the html of a container. Should support both raw text and a single
// DOM Element.
import { IParsedAttribute } from '../models/parsed-attribute.model';

export function setHTML(container: HTMLElement, content: string | null | undefined): void {
  if (container) {
    // Clear out everything in the container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    if (content) {
      if (typeof content === 'string') {
        container.innerHTML = content;
      } else {
        container.appendChild(content);
      }
    }
  }
}

// Return the placement with the first letter capitalized
export function capitalizePlacement(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// Parse a css attribute into the numeric portion and the units
export function parseAttribute(attribute?: string, defaultValue?: string): IParsedAttribute {
  // 1em, 1.0em, 0.1em, .1em, 1.    em
  const re = /^(-?\.?\d+(\.\d+)?)[\s|.]*(\w*)$/;
  if (attribute && re.test(attribute)) {
    const match = re.exec(attribute);
    // @ts-ignore
    const number: number = Number(match[1]) || 0;
    // @ts-ignore
    const units: string = match[3] || 'px';
    return { units, value: number, original: attribute };
  }
  if (defaultValue) {
    return parseAttribute(defaultValue);
  }
  return { value: 0, units: 'px', original: defaultValue };
}

// Get the opposite of a given placement
export function oppositePlacement(p: string): string {
  if (p === 'top') {
    return 'bottom';
  } else if (p === 'bottom') {
    return 'top';
  } else if (p === 'left') {
    return 'right';
  } else if (p === 'right') {
    return 'left';
  }
  return p;
}
