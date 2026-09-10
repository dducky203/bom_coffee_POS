package com.bomcoffee.pos.upload;

import com.bomcoffee.pos.common.exception.BusinessException;
import com.bomcoffee.pos.config.CloudinaryProperties;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    public UploadResult uploadImage(MultipartFile file) {
        if (properties.getCloudName() == null || properties.getCloudName().isBlank()
                || properties.getApiKey() == null || properties.getApiSecret() == null) {
            throw new BusinessException("Chưa cấu hình Cloudinary", "CLOUDINARY_NOT_CONFIGURED");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Chưa chọn file ảnh", "FILE_REQUIRED");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException("Ảnh tối đa 5MB", "FILE_TOO_LARGE");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new BusinessException("Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF", "INVALID_FILE_TYPE");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploaded = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "bom-coffee/products",
                    "resource_type", "image",
                    "unique_filename", true,
                    "overwrite", false
            ));
            String url = (String) uploaded.get("secure_url");
            String publicId = (String) uploaded.get("public_id");
            if (url == null || url.isBlank()) {
                throw new BusinessException("Cloudinary không trả về URL ảnh", "UPLOAD_FAILED");
            }
            return new UploadResult(url, publicId);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException("Không tải được ảnh lên Cloudinary", "UPLOAD_FAILED");
        }
    }

    public record UploadResult(String url, String publicId) {}
}
