import sharp from 'sharp';
import { cubesSVG } from '../../lib/cubes.js';

export async function GET() {
  const webp = await sharp(Buffer.from(cubesSVG())).webp({ quality: 80, effort: 6 }).toBuffer();
  return new Response(webp, { headers: { 'Content-Type': 'image/webp' } });
}
