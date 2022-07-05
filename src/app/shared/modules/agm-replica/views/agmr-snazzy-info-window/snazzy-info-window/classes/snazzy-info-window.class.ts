import { toLatLng } from '../utils/map.utils';
import { mergeDefaultOptions } from '../utils/common.utils';
import {
  CLASS_PREFIX,
  DEFAULT_OPTIONS,
  DEFAULT_SHADOW,
  EVENT_PREFIX,
  INVERSE_ROOT_2,
  ROOT_2,
} from '../constants/common.constants';
import { IListenerRecord } from '../models/listener-record.model';
import { IDOMListenerRecord } from '../models/dom-listener-record.model';
import { capitalizePlacement, oppositePlacement, parseAttribute, setHTML } from '../utils/content.utils';
import { IParsedAttribute } from '../models/parsed-attribute.model';

export function getSnazzyInfoWindowReplicaInstance(options: any) {
  class SnazzyInfoWindowReplica extends google.maps.OverlayView {
    private _html: any;
    private _opts: { [key: string]: any };
    private readonly _callbacks: { [key: string]: () => any };
    private readonly _marker: google.maps.Marker;
    private readonly _map: google.maps.Map;
    private _position: google.maps.LatLng | null;
    private _isOpen = false;
    private _listeners: IListenerRecord[] = [];
    private _domListeners: IDOMListenerRecord[] = [];

    private _previousWidth: number | null = null;
    private _previousHeight: number | null = null;

    constructor(opts: { [key: string]: any }) {
      super();

      // Private properties
      this._html = null;
      this._opts = mergeDefaultOptions(opts);
      this._callbacks = this._opts.callbacks || {};
      this._marker = this._opts.marker;
      this._map = this._opts.map;
      this._position = toLatLng(this._opts.position);

      // This listener remains active when the info window is closed.
      if (this._marker && this._opts.openOnMarkerClick) {
        this.trackListener(
          google.maps.event.addListener(this._marker, 'click', () => {
            if (!this.getMap()) {
              this.open();
            }
          }),
          true,
        );
      }

      // When using a position the default option for the offset is 0
      if (this._position && !this._opts.offset) {
        this._opts.offset = {
          top: '0px',
          left: '0px',
        };
      }

      // Validate the placement option
      let p = opts.placement || this._opts.position;
      // The position variable was renamed to placement, so we must type check
      if (typeof p === 'string' || p instanceof String) {
        p = p.toLowerCase();
      }
      if (p !== 'top' && p !== 'bottom' && p !== 'left' && p !== 'right') {
        this._opts.placement = DEFAULT_OPTIONS.placement;
      } else {
        this._opts.placement = p;
      }

      // Validate the position option
      p = this._opts.position;
      if (p !== undefined && p !== null && typeof p !== 'string' && !(p instanceof String)) {
        this._opts.position = p;
      }

      // Validate the other options
      if (this._opts.border === undefined || this._opts.border === true) {
        this._opts.border = {};
      }
      if (this._opts.pointer === undefined) {
        this._opts.pointer = DEFAULT_OPTIONS.pointer;
      }
      if (this._opts.shadow === undefined || this._opts.shadow === true) {
        this._opts.shadow = {};
      }
    }

    // Activate the specified callback and return the result
    public activateCallback(callback: any): any {
      const lambda = this._callbacks[callback];
      return lambda ? lambda.apply(this) : undefined;
    }

    // Track the provided listener. A persistent listener means it remains
    // tracked even if the info window is closed.
    public trackListener(listener: google.maps.MapsEventListener, persistent: boolean = false): void {
      this._listeners.push({ listener, persistent });
    }

    // Track the provided DOM listener. A persistent listener means it remains
    // tracked even if the info window is closed.
    public trackDOMListener(
      type: string,
      listener: google.maps.MapsEventListener,
      domElement: HTMLElement,
      persistent: boolean = false,
    ): void {
      this._domListeners.push({ type, listener, domElement, persistent });
    }

    // Will clear all listeners that are used during the open state.
    public clearListeners(clearPersistent: boolean = false): void {
      if (this._listeners) {
        this._listeners.forEach((e) => {
          if ((clearPersistent || !e.persistent) && e.listener) {
            google.maps.event.removeListener(e.listener);
            e.listener = null;
          }
        });
        this._listeners = this._listeners.filter((e) => {
          return e.listener !== null;
        });
      }
      if (this._domListeners) {
        this._domListeners.forEach((e) => {
          if ((clearPersistent || !e.persistent) && e.listener) {
            e.domElement.removeEventListener(e.type as string, (e.listener as unknown) as EventListener);
            e.listener = null;
          }
        });
        this._domListeners = this._domListeners.filter((e) => !!e.listener);
      }
    }

    public isOpen(): boolean {
      return this._isOpen;
    }

    // Open the info window after attaching to a specific marker.
    public open(): void {
      const result = this.activateCallback('beforeOpen');
      if (result !== undefined && !result) {
        return;
      }
      const m = this._marker ? this._marker.getMap() : null;
      if (m) {
        this.setMap(m);
      } else if (this._map && this._position) {
        this.setMap(this._map);
      }
    }

    // Close the info window.
    public close(): void {
      const result = this.activateCallback('beforeClose');
      if (result !== undefined && !result) {
        return;
      }
      this.clearListeners(false);
      this.setMap(null);
    }

    // Force close the map and remove any event listeners attached to google
    public destroy(): void {
      if (this.getMap()) {
        this.setMap(null);
      }
      // Make sure to clear all persistent listeners
      this.clearListeners(true);
    }

    public setContent(content: any): void {
      this._opts.content = content;
      if (this._html && this._html.content) {
        setHTML(this._html.content, content);
      }
    }

    public setPosition(latLng: google.maps.LatLng | { lat: number; lng: number }): void {
      this._position = toLatLng(latLng);
      if (this._isOpen && this._position) {
        this.draw();
        this.resize();
        this.reposition();
      }
    }

    public setWrapperClass(wrapperClass: string): void {
      if (this._html && this._html.wrapper) {
        const w = this._html.wrapper;
        w.className = `${CLASS_PREFIX}wrapper-${this._opts.placement}`;
        if (this._opts.border) {
          w.className += ` ${CLASS_PREFIX}has-border`;
        }
        if (wrapperClass) {
          w.className += ` ${wrapperClass}`;
        }
      }
      this._opts.wrapperClass = wrapperClass;
    }

    public getWrapper(): any {
      if (this._html) {
        return this._html.wrapper;
      }
      return null;
    }

    // Implementation of OverlayView draw method.
    public draw(): void {
      if (!this.getMap() || !this._html || (!this._marker && !this._position)) {
        return;
      }

      // 1. Assign offset
      const offset = this._opts.offset;
      if (offset) {
        if (offset.left) {
          this._html.wrapper.style.marginLeft = offset.left;
        }
        if (offset.top) {
          this._html.wrapper.style.marginTop = offset.top;
        }
      }
      // 2. Set the background color
      const bg = this._opts.backgroundColor;
      if (bg) {
        this._html.contentWrapper.style.backgroundColor = bg;
        if (this._opts.pointer) {
          this._html.pointerBg.style[`border${capitalizePlacement(this._opts.placement)}Color`] = bg;
        }
      }
      // 3. Padding
      if (this._opts.padding) {
        this._html.contentWrapper.style.padding = this._opts.padding;
        if (this._opts.shadow) {
          this._html.shadowFrame.style.padding = this._opts.padding;
        }
      }
      // 4. Border radius
      if (this._opts.borderRadius) {
        this._html.contentWrapper.style.borderRadius = this._opts.borderRadius;
        if (this._opts.shadow) {
          this._html.shadowFrame.style.borderRadius = this._opts.borderRadius;
        }
      }
      // 5. Font Size
      if (this._opts.fontSize) {
        this._html.wrapper.style.fontSize = this._opts.fontSize;
      }
      // 6. Font Color
      if (this._opts.fontColor) {
        this._html.contentWrapper.style.color = this._opts.fontColor;
      }
      // 7. Pointer
      // Check if the pointer is enabled. Also make sure the value isn't just the boolean true value.
      if (this._opts.pointer && this._opts.pointer !== true) {
        if (this._opts.shadow) {
          this._html.shadowPointer.style.width = this._opts.pointer;
          this._html.shadowPointer.style.height = this._opts.pointer;
        }
        if (this._html.pointerBorder) {
          this._html.pointerBorder.style.borderWidth = this._opts.pointer;
        }
        this._html.pointerBg.style.borderWidth = this._opts.pointer;
      }
      // 8. Border
      if (this._opts.border) {
        // Calculate the border width
        let bWidth: IParsedAttribute | number = 0;
        if (this._opts.border.width !== undefined) {
          bWidth = parseAttribute(this._opts.border.width, '0px');
          this._html.contentWrapper.style.borderWidth = bWidth.value + bWidth.units;
        }
        bWidth = Math.round((this._html.contentWrapper.offsetWidth - this._html.contentWrapper.clientWidth) / 2.0);
        bWidth = parseAttribute(`${bWidth}px`, '0px');

        if (this._opts.pointer) {
          // Calculate the pointer length
          let pLength: IParsedAttribute | number = Math.min(
            this._html.pointerBorder.offsetHeight,
            this._html.pointerBorder.offsetWidth,
          );
          pLength = parseAttribute(`${pLength}px`, '0px');

          let triangleDiff = Math.round(bWidth.value * (ROOT_2 - 1));
          triangleDiff = Math.min(triangleDiff, pLength.value);

          this._html.pointerBg.style.borderWidth = pLength.value - triangleDiff + pLength.units;

          const reverseP = capitalizePlacement(oppositePlacement(this._opts.placement));
          this._html.pointerBg.style[`margin${reverseP}`] = triangleDiff + bWidth.units;
          this._html.pointerBg.style[this._opts.placement] = -bWidth.value + bWidth.units;
        }
        const color = this._opts.border.color;
        if (color) {
          this._html.contentWrapper.style.borderColor = color;
          if (this._html.pointerBorder) {
            this._html.pointerBorder.style[`border${capitalizePlacement(this._opts.placement)}Color`] = color;
          }
        }
      }
      // 9. Shadow
      if (this._opts.shadow) {
        // Check if any of the shadow settings have actually been set
        const shadow = this._opts.shadow;
        const isSet = (attribute: string) => {
          const v = shadow[attribute];
          return v !== undefined && v != null;
        };

        if (isSet('h') || isSet('v') || isSet('blur') || isSet('spread') || isSet('color')) {
          const hOffset = parseAttribute(shadow.h, DEFAULT_SHADOW.h);
          const vOffset = parseAttribute(shadow.v, DEFAULT_SHADOW.v);
          const blur = parseAttribute(shadow.blur, DEFAULT_SHADOW.blur);
          const spread = parseAttribute(shadow.spread, DEFAULT_SHADOW.spread);
          const color = shadow.color || DEFAULT_SHADOW.color;
          const formatBoxShadow = (h: string, v: string) => {
            return `${h} ${v} ${blur.original} ${spread.original} ${color}`;
          };

          this._html.shadowFrame.style.boxShadow = formatBoxShadow(
            hOffset.original || '0px',
            vOffset.original || '0px',
          );

          // Correctly rotate the shadows before the css transform
          const hRotated = INVERSE_ROOT_2 * (hOffset.value - vOffset.value) + hOffset.units;
          const vRotated = INVERSE_ROOT_2 * (hOffset.value + vOffset.value) + vOffset.units;
          if (this._html.shadowPointerInner) {
            this._html.shadowPointerInner.style.boxShadow = formatBoxShadow(hRotated, vRotated);
          }
        }
        if (this._opts.shadow.opacity) {
          this._html.shadowWrapper.style.opacity = this._opts.shadow.opacity;
        }
      }

      const divPixel = this.getProjection().fromLatLngToDivPixel(
        this._position || this._marker.getPosition() || new google.maps.LatLng({ lat: 0, lng: 0 }),
      );
      if (divPixel) {
        this._html.floatWrapper.style.top = `${Math.floor(divPixel.y)}px`;
        this._html.floatWrapper.style.left = `${Math.floor(divPixel.x)}px`;
      }
      if (!this._isOpen) {
        this._isOpen = true;
        this.resize();
        this.reposition();
        this.activateCallback('afterOpen');
        google.maps.event.trigger(this.getMap(), `${EVENT_PREFIX}opened`, this);
      }
    }

    // Implementation of OverlayView onAdd method.
    public onAdd(): void {
      if (this._html) {
        return;
      }
      // Used for creating new elements
      const applyCss = (element: HTMLDivElement, args: string[]) => {
        if (element && args) {
          for (const arg of args) {
            if (arg) {
              if (element.className) {
                element.className += ' ';
              }
              element.className += CLASS_PREFIX + arg;
            }
          }
        }
      };
      const newElement = (...args: string[]) => {
        const element = document.createElement('div');
        applyCss(element, args);
        return element;
      };

      this._html = {};

      // 1. Create the wrapper
      this._html.wrapper = newElement();
      this.setWrapperClass(this._opts.wrapperClass);

      // 2. Create the shadow
      if (this._opts.shadow) {
        this._html.shadowWrapper = newElement(`shadow-wrapper-${this._opts.placement}`);
        this._html.shadowFrame = newElement('frame', 'shadow-frame');
        this._html.shadowWrapper.appendChild(this._html.shadowFrame);

        if (this._opts.pointer) {
          this._html.shadowPointer = newElement(`shadow-pointer-${this._opts.placement}`);
          this._html.shadowPointerInner = newElement(`shadow-inner-pointer-${this._opts.placement}`);
          this._html.shadowPointer.appendChild(this._html.shadowPointerInner);
          this._html.shadowWrapper.appendChild(this._html.shadowPointer);
        }

        this._html.wrapper.appendChild(this._html.shadowWrapper);
      }

      // 3. Create the content
      this._html.contentWrapper = newElement('frame', 'content-wrapper');
      this._html.content = newElement('content');
      if (this._opts.content) {
        setHTML(this._html.content, this._opts.content);
      }

      // 4. Create the close button
      if (this._opts.showCloseButton) {
        if (this._opts.closeButtonMarkup) {
          const d = document.createElement('div');
          setHTML(d, this._opts.closeButtonMarkup);
          this._html.closeButton = d.firstChild;
        } else {
          this._html.closeButton = document.createElement('button');
          this._html.closeButton.setAttribute('type', 'button');
          this._html.closeButton.innerHTML = '&#215;';
          applyCss(this._html.closeButton, ['close-button']);
        }
        this._html.contentWrapper.appendChild(this._html.closeButton);
      }
      this._html.contentWrapper.appendChild(this._html.content);
      this._html.wrapper.appendChild(this._html.contentWrapper);

      // 5. Create the pointer
      if (this._opts.pointer) {
        if (this._opts.border) {
          this._html.pointerBorder = newElement(
            `pointer-${this._opts.placement}`,
            `pointer-border-${this._opts.placement}`,
          );
          this._html.wrapper.appendChild(this._html.pointerBorder);
        }
        this._html.pointerBg = newElement(`pointer-${this._opts.placement}`, `pointer-bg-${this._opts.placement}`);
        this._html.wrapper.appendChild(this._html.pointerBg);
      }

      // Create an outer wrapper
      this._html.floatWrapper = newElement('float-wrapper');
      this._html.floatWrapper.appendChild(this._html.wrapper);

      // Add the wrapper to the Google Maps float pane
      this.getPanes().floatPane.appendChild(this._html.floatWrapper);

      // Now add all the event listeners
      const map = this.getMap();
      this.clearListeners();
      if (this._opts.closeOnMapClick) {
        this.trackListener(
          google.maps.event.addListener(map, 'click', () => {
            this.close();
          }),
        );
      }
      if (this._opts.closeWhenOthersOpen) {
        this.trackListener(
          google.maps.event.addListener(map, `${EVENT_PREFIX}opened`, (other) => {
            if (this !== other) {
              this.close();
            }
          }),
        );
      }

      // Clear out the previous map bounds
      this._previousWidth = null;
      this._previousHeight = null;
      this.trackListener(
        google.maps.event.addListener(map, 'bounds_changed', () => {
          const d = (map as google.maps.Map).getDiv() as HTMLDivElement;
          const ow = d.offsetWidth;
          const oh = d.offsetHeight;
          const pw = this._previousWidth;
          const ph = this._previousHeight;
          if (pw === null || ph === null || pw !== ow || ph !== oh) {
            this._previousWidth = ow;
            this._previousHeight = oh;
            this.resize();
          }
        }),
      );

      // Marker moves
      if (this._marker) {
        this.trackListener(
          google.maps.event.addListener(this._marker, 'position_changed', () => {
            this.draw();
          }),
        );
      }

      // Close button
      if (this._opts.showCloseButton && !this._opts.closeButtonMarkup) {
        const type = 'click';
        this.trackDOMListener(
          type,
          this._html.closeButton.addEventListener(type, (e: Event) => {
            e.cancelBubble = true;
            if (e.stopPropagation) {
              e.stopPropagation();
            }
            this.close();
          }),
          this._html.closeButton,
        );
      }

      // Stop the mouse event propagation
      const mouseEvents = [
        'click',
        'dblclick',
        'rightclick',
        'contextmenu',
        'drag',
        'dragend',
        'dragstart',
        'mousedown',
        'mouseout',
        'mouseover',
        'mouseup',
        'touchstart',
        'touchend',
        'touchmove',
        'wheel',
        'mousewheel',
        'DOMMouseScroll',
        'MozMousePixelScroll',
      ];
      mouseEvents.forEach((event) => {
        this.trackDOMListener(
          event,
          this._html.wrapper.addEventListener(event, (e: Event) => {
            e.cancelBubble = true;
            if (e.stopPropagation) {
              e.stopPropagation();
            }
          }),
          this._html.wrapper,
        );
      });

      this.activateCallback('open');
    }

    // Implementation of OverlayView onRemove method
    public onRemove(): void {
      this.activateCallback('close');
      if (this._html) {
        const parent = this._html.floatWrapper.parentElement;
        if (parent) {
          parent.removeChild(this._html.floatWrapper);
        }
        this._html = null;
      }
      this._isOpen = false;
      this.activateCallback('afterClose');
    }

    // The map inner bounds used for panning and resizing
    public getMapInnerBounds(): {
      top: number;
      right: number;
      bottom: number;
      left: number;
      width: number;
      height: number;
    } {
      const mb = (this.getMap() as google.maps.Map).getDiv().getBoundingClientRect();
      const mib = {
        top: mb.top + this._opts.edgeOffset.top,
        right: mb.right - this._opts.edgeOffset.right,
        bottom: mb.bottom - this._opts.edgeOffset.bottom,
        left: mb.left + this._opts.edgeOffset.left,
        width: 0,
        height: 0,
      };
      mib.width = mib.right - mib.left;
      mib.height = mib.bottom - mib.top;
      return mib;
    }

    // Pan the Google Map such that the info window is visible
    public reposition(): void {
      if (!this._opts.panOnOpen || !this._html) {
        return;
      }
      const mib = this.getMapInnerBounds();
      const wb = this._html.wrapper.getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      if (mib.left >= wb.left) {
        dx = wb.left - mib.left;
      } else if (mib.right <= wb.right) {
        dx = wb.left - (mib.right - wb.width);
      }
      if (mib.top >= wb.top) {
        dy = wb.top - mib.top;
      } else if (mib.bottom <= wb.bottom) {
        dy = wb.top - (mib.bottom - wb.height);
      }
      if (dx !== 0 || dy !== 0) {
        (this.getMap() as google.maps.Map).panBy(dx, dy);
      }
    }

    // Resize the info window to fit within the map bounds and edge offset
    public resize(): void {
      if (!this._html) {
        return;
      }
      const mib = this.getMapInnerBounds();
      // Handle the max width
      let maxWidth = mib.width;
      if (this._opts.maxWidth !== undefined) {
        maxWidth = Math.min(maxWidth, this._opts.maxWidth);
      }
      maxWidth -= this._html.wrapper.offsetWidth - this._html.content.offsetWidth;
      this._html.content.style.maxWidth = `${maxWidth}px`;

      // Handle the max height
      let maxHeight = mib.height;
      if (this._opts.maxHeight !== undefined) {
        maxHeight = Math.min(maxHeight, this._opts.maxHeight);
      }
      maxHeight -= this._html.wrapper.offsetHeight - this._html.content.offsetHeight;
      this._html.content.style.maxHeight = `${maxHeight}px`;
    }
  }

  return new SnazzyInfoWindowReplica(options);
}
