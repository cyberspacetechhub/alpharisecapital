import cloudinary from "../config/cloudinary";

export const uploadImage = async (filePath: string, folder: string) => {
  const result = await cloudinary.uploader.upload(filePath, { folder });
  return result.secure_url;
};

export const uploadBuffer = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteImage = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId);
};
