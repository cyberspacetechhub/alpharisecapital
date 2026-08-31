import cloudinary from "../config/cloudinary";

export const uploadImage = async (filePath: string, folder: string) => {
  const result = await cloudinary.uploader.upload(filePath, { folder });
  return result.secure_url;
};

export const deleteImage = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId);
};
