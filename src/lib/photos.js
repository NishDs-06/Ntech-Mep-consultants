const files = import.meta.glob('../assets/photos/*.jpg', { eager: true, import: 'default' });

/** Resolve a photo filename from src/assets/photos to its Astro image metadata. */
export function photo(name) {
  const img = files[`../assets/photos/${name}`];
  if (!img) throw new Error(`Missing photo: ${name}`);
  return img;
}
