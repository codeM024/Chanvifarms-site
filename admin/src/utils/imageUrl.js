const url = import.meta.env.VITE_BACKEND_URL;

// Product images are either a full (Cloudinary) URL or a legacy filename served by the backend.
export const imageUrl = (img) => {
  if (!img) return '';
  return /^https?:\/\//i.test(img) ? img : `${url}/images/${img}`;
};

export default imageUrl;
