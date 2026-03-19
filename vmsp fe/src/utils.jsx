export const preloadImages = (images = []) => {
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};