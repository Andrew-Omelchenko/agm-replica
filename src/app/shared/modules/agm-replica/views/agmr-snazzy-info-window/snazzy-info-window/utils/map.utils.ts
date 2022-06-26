// Converts the value into a Google Map LatLng
export function toLatLng(v: google.maps.LatLng | { lat: number; lng: number } | null): google.maps.LatLng | null {
  if (!!v) {
    if (v instanceof google.maps.LatLng) {
      return v;
    }
    if (typeof v.lat === 'number' && typeof v.lng === 'number') {
      return new google.maps.LatLng(v);
    }
  }
  return null;
}
