// src/api/uploadToCloudinary.ts
{/*
/**
 * Hàm upload ảnh lên Cloudinary
 * @param file - File ảnh được chọn từ input
 * @returns URL ảnh trên Cloudinary hoặc null nếu thất bại
 */
/**
export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  // Tạo FormData để gửi file lên Cloudinary
  const formData = new FormData();
  formData.append("file", file); // File cần upload
  formData.append("upload_preset", "unsigned_upload"); 
  // 🔹 "unsigned_upload" là preset bạn đã tạo trong Cloudinary, 
  // cần để Cloudinary biết cách xử lý file mà không cần API key bí mật

  try {
    // Gửi request POST lên Cloudinary
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dxgsnkyr5/image/upload", 
      // 🔹 Thay "dxgsnkyr5" bằng cloud_name của bạn nếu khác
      {
        method: "POST",
        body: formData,
      }
    );

    // Kiểm tra response
    if (!response.ok) {
      throw new Error("Upload thất bại!");
    }

    // Lấy kết quả trả về
    const data = await response.json();
    console.log("✅ Ảnh đã upload Cloudinary:", data.secure_url);

    return data.secure_url; // 🔹 URL ảnh có thể dùng trong project
  } catch (error) {
    console.error("❌ Lỗi upload:", error);
    return null; // Trả về null nếu upload thất bại
  }
}; */}
// src/api/uploadToCloudinary.ts

// uploadToCloudinary.ts
export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_upload"); 
  formData.append("cloud_name", "dxgsnkyr5");

  // Determine resource type based on file type
  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dxgsnkyr5/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error("Cloudinary Error:", data);
      return null;
    }
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
};
