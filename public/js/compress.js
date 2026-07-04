// Resizes + compresses an image file in the browser before upload, to keep
// R2 storage and bandwidth usage low on the free tier.
// Returns a Promise<File> (JPEG, capped at maxDimension on the longest side).
window.compressImage = function compressImage(file, { maxDimension = 1200, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Could not process image"));
            resolve(new File([blob], (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg", {
              type: "image/jpeg",
            }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
};
