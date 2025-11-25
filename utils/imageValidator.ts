export const checkIfImageUrl = (url: string) => {
  if (!url) {
    return;
  }
  // Define an array of common image file extensions
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
    ".tiff",
  ];

  // Get the file extension from the URL
  const fileExtension = url.split(".").pop().toLowerCase();

  // Check if the file extension is in the array of image extensions
  return imageExtensions.includes(`.${fileExtension}`);
};
