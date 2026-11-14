// Product / tiffin images are either a full URL (Cloudinary uploads) or a legacy
// filename that the backend serves from /images/<file>.
const ABSOLUTE = /^(https?:)?\/\/|^data:|^blob:/i

export const imageUrl = (image, base = import.meta.env.VITE_BACKEND_URL) => {
  if (!image) return ''
  if (ABSOLUTE.test(image)) return image
  const root = String(base || '').replace(/\/+$/, '')
  return `${root}/images/${String(image).replace(/^\/+/, '').replace(/^images\//, '')}`
}

/**
 * For Cloudinary URLs, ask for an auto-format, auto-quality, width-limited
 * rendition. Any other URL is returned unchanged.
 */
export const sizedImageUrl = (image, width, base) => {
  const src = imageUrl(image, base)
  if (!src || !width || !src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src
  const [head, tail] = src.split('/upload/')
  // Leave URLs that already carry a transformation alone
  if (/^[a-z]{1,3}_[^/]*\//.test(tail) && !/^v\d+\//.test(tail)) return src
  return `${head}/upload/f_auto,q_auto,c_limit,w_${Math.round(width)}/${tail}`
}

export default imageUrl
