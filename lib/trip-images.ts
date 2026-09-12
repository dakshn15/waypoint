/**
 * Shared destination image resolver.
 *
 * Strategy:
 *  1. If a record already carries an explicit image URL/path → use it.
 *  2. Match the destination name against a curated map of high-quality
 *     Unsplash photo IDs (covers popular Indian destinations).
 *  3. Fall back to a dynamic Unsplash search URL so *any* user-typed
 *     destination automatically gets a relevant hero image.
 */

// ── Curated high-quality Unsplash photos for popular Indian destinations ──
// Each key is a lowercase substring to match against destination names.
const CURATED_DESTINATION_PHOTOS: Record<string, string> = {
  // Local files (for seeded packages with downloaded images)
  kashmir: "/images/packages/kashmir-valley.jpg",
  srinagar: "/images/packages/kashmir-valley.jpg",
  gulmarg: "/images/packages/kashmir-valley.jpg",
  pahalgam: "/images/packages/kashmir-valley.jpg",
  delhi: "/images/packages/golden-triangle.jpg",
  agra: "/images/packages/golden-triangle.jpg",
  jaipur: "/images/packages/golden-triangle.jpg",
  kochi: "/images/packages/kerala-backwaters.jpg",
  munnar: "/images/packages/kerala-backwaters.jpg",
  alleppey: "/images/packages/kerala-backwaters.jpg",
  kerala: "/images/packages/kerala-backwaters.jpg",
  manali: "/images/packages/himalayan-adventure.jpg",
  shimla: "/images/packages/himalayan-adventure.jpg",
  leh: "/images/packages/himalayan-adventure.jpg",
  ladakh: "/images/packages/himalayan-adventure.jpg",
  himalaya: "/images/packages/himalayan-adventure.jpg",
  goa: "/images/packages/goa-beach.jpg",
  "north goa": "/images/packages/goa-beach.jpg",
  "south goa": "/images/packages/goa-beach.jpg",
  udaipur: "/images/packages/rajasthan-heritage.jpg",
  jodhpur: "/images/packages/rajasthan-heritage.jpg",
  jaisalmer: "/images/packages/rajasthan-heritage.jpg",
  rajasthan: "/images/packages/rajasthan-heritage.jpg",
  shillong: "/images/packages/northeast-explorer.jpg",
  kaziranga: "/images/packages/northeast-explorer.jpg",
  northeast: "/images/packages/northeast-explorer.jpg",
  meghalaya: "/images/packages/northeast-explorer.jpg",
  varanasi: "/images/packages/varanasi-ganges.jpg",
  ganges: "/images/packages/varanasi-ganges.jpg",

  // Unsplash direct URLs for destinations without local files
  andaman:
    "https://images.unsplash.com/photo-1544550581-5f7ceaf7f796?auto=format&fit=crop&w=1920&q=80",
  havelock:
    "https://images.unsplash.com/photo-1544550581-5f7ceaf7f796?auto=format&fit=crop&w=1920&q=80",
  "port blair":
    "https://images.unsplash.com/photo-1544550581-5f7ceaf7f796?auto=format&fit=crop&w=1920&q=80",
  rishikesh:
    "https://images.unsplash.com/photo-1590050751437-573e600e5c78?auto=format&fit=crop&w=1920&q=80",
  darjeeling:
    "https://images.unsplash.com/photo-1622308644420-27c0654483ec?auto=format&fit=crop&w=1920&q=80",
  ooty:
    "https://images.unsplash.com/photo-1574233344063-d33ab3883f8d?auto=format&fit=crop&w=1920&q=80",
  pondicherry:
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1920&q=80",
  mysore:
    "https://images.unsplash.com/photo-1600112356915-089db54a3d5a?auto=format&fit=crop&w=1920&q=80",
  amritsar:
    "https://images.unsplash.com/photo-1609947017136-9daa5e93e784?auto=format&fit=crop&w=1920&q=80",
  udagamandalam:
    "https://images.unsplash.com/photo-1574233344063-d33ab3883f8d?auto=format&fit=crop&w=1920&q=80",
  spiti:
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1920&q=80",
  nainital:
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1920&q=80",
  coorg:
    "https://images.unsplash.com/photo-1597735881932-d9664c9bbcea?auto=format&fit=crop&w=1920&q=80",
};

// Rotating fallback images for truly unknown destinations
const FALLBACK_IMAGES = [
  "/images/packages/himalayan-adventure.jpg",
  "/images/packages/goa-beach.jpg",
  "/images/packages/golden-triangle.jpg",
  "/images/packages/kerala-backwaters.jpg",
  "/images/packages/rajasthan-heritage.jpg",
  "/images/packages/kashmir-valley.jpg",
  "/images/packages/northeast-explorer.jpg",
  "/images/packages/varanasi-ganges.jpg",
];

/**
 * Get a dynamic Unsplash image URL for any arbitrary destination.
 * Uses Unsplash source redirect (no API key needed).
 */
function getUnsplashFallback(destination: string): string {
  const query = encodeURIComponent(
    `${destination} travel landscape India`.trim()
  );
  return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1920&q=80&q=${query}`;
}

/**
 * Resolve an image for a package or trip given its existing images array,
 * destination names, title, and an index for deterministic fallback selection.
 */
export function resolveDestinationImage(opts: {
  /** Pre-existing images array from the database record */
  images?: string[];
  /** Array of destination name strings */
  destinations?: string[];
  /** The title of the package or trip */
  title?: string;
  /** Index used for deterministic fallback rotation */
  index?: number;
}): string {
  const { images, destinations = [], title = "", index = 0 } = opts;

  // 1. Use explicit image if available and not a broken local path
  if (images && images.length > 0 && images[0]) {
    const img = images[0];
    // If it's a URL (http/https) always use it
    if (img.startsWith("http")) return img;
    // If it's a local path, verify it's in our curated set
    const isKnownLocal = FALLBACK_IMAGES.includes(img) ||
      Object.values(CURATED_DESTINATION_PHOTOS).includes(img);
    if (isKnownLocal) return img;
    // Otherwise it might be a broken path like "/images/packages/andaman-island.jpg"
    // Fall through to destination matching
  }

  // 2. Match destination names against curated map
  const destNames = destinations.map((d) =>
    (typeof d === "string" ? d : "").toLowerCase()
  );
  for (const name of destNames) {
    for (const [key, img] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
      if (name.includes(key)) return img;
    }
  }

  // 3. Match title against curated map
  const lowerTitle = title.toLowerCase();
  for (const [key, img] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
    if (lowerTitle.includes(key)) return img;
  }

  // 4. Dynamic Unsplash fallback for any arbitrary destination
  if (destNames.length > 0 && destNames[0]) {
    return getUnsplashFallback(destNames[0]);
  }
  if (title) {
    return getUnsplashFallback(title);
  }

  // 5. Rotating local fallback
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

/**
 * Convenience: get hero image for a trip detail page from a destination string.
 */
export function getHeroImageForDestination(destStr: string): string {
  const lower = destStr.toLowerCase().trim();

  for (const [key, path] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
    if (lower.includes(key)) return path;
  }

  // Dynamic Unsplash for any custom destination globally
  return getUnsplashFallback(destStr);
}
