import { flameSVG } from '../../lib/flame.js';

export function GET() {
  return new Response(flameSVG(), { headers: { 'Content-Type': 'image/svg+xml' } });
}
