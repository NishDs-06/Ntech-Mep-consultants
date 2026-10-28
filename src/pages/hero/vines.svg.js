import { vinesSVG } from '../../lib/strokes.js';

export function GET() {
  return new Response(vinesSVG(), { headers: { 'Content-Type': 'image/svg+xml' } });
}
