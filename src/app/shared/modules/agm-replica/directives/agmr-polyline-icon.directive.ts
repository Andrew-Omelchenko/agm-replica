import { Directive, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'agmr-polyline agmr-icon-sequence',
})
// tslint:disable:directive-class-suffix
export class AgmrPolylineIcon implements OnInit {
  /**
   * If `true`, each icon in the sequence has the same fixed rotation regardless of the
   * angle of the edge on which it lies. Defaults to `false`, in which case each icon
   * in the sequence is rotated to align with its edge.
   */
  @Input() public fixedRotation: boolean | undefined;

  /**
   * The distance from the start of the line at which an icon is to be rendered. This
   * distance may be expressed as a percentage of line's length (e.g. '50%') or in pixels
   * (e.g. '50px'). Defaults to '100%'.
   */
  @Input() public offset: string | undefined;

  /**
   * The distance between consecutive icons on the line. This distance may be expressed as
   * a percentage of the line's length (e.g. '50%') or in pixels (e.g. '50px'). To disable
   * repeating of the icon, specify '0'. Defaults to '0'.
   */
  @Input() public repeat: string | undefined;

  /**
   * The x coordinate of the position of the symbol relative to the polyline. The coordinate
   * of the symbol's path is translated _left_ by the anchor's x coordinate. By default, a
   * symbol is anchored at (0, 0). The position is expressed in the same coordinate system as the
   * symbol's path.
   */
  @Input() public anchorX: number | undefined;

  /**
   * The y coordinate of the position of the symbol relative to the polyline. The coordinate
   * of the symbol's path is translated _up_ by the anchor's y coordinate. By default, a
   * symbol is anchored at (0, 0). The position is expressed in the same coordinate system as the
   * symbol's path.
   */
  @Input() public anchorY: number | undefined;

  /**
   * The symbol's fill color. All CSS3 colors are supported except for extended named
   * colors. Defaults to the stroke color of the corresponding polyline.
   */
  @Input() public fillColor: string | undefined;

  /**
   * The symbol's fill opacity. Defaults to 0.
   */
  @Input() public fillOpacity: number | undefined;

  /**
   * The symbol's path, which is a built-in symbol path, or a custom path expressed using
   * SVG path notation. Required.
   */
  @Input() public path: keyof typeof google.maps.SymbolPath | string | undefined;

  /**
   * The angle by which to rotate the symbol, expressed clockwise in degrees.
   * Defaults to 0. A symbol where `fixedRotation` is `false` is rotated relative to
   * the angle of the edge on which it lies.
   */
  @Input() public rotation: number | undefined;

  /**
   * The amount by which the symbol is scaled in size. Defaults to the stroke weight
   * of the polyline; after scaling, the symbol must lie inside a square 22 pixels in
   * size centered at the symbol's anchor.
   */
  @Input() public scale: number | undefined;

  /**
   * The symbol's stroke color. All CSS3 colors are supported except for extended named
   * colors. Defaults to the stroke color of the polyline.
   */
  @Input() public strokeColor: string | undefined;

  /**
   * The symbol's stroke opacity. Defaults to the stroke opacity of the polyline.
   */
  @Input() public strokeOpacity: number | undefined;

  /**
   * The symbol's stroke weight. Defaults to the scale of the symbol.
   */
  @Input() public strokeWeight: number | undefined;

  public ngOnInit(): void {
    console.log('init');
    if (!this.path) {
      throw new Error('Icon Sequence path is required');
    }
  }
}
