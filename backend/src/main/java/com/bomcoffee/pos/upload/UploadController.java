package com.bomcoffee.pos.upload;

import com.bomcoffee.pos.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CloudinaryService.UploadResult>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(
                cloudinaryService.uploadImage(file),
                "Đã tải ảnh lên"
        ));
    }

    @DeleteMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @RequestParam(value = "url", required = false) String url) {
        if (url != null && !url.isBlank()) {
            cloudinaryService.deleteImage(url);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa ảnh"));
    }

    @PostMapping("/image/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteImagePost(
            @RequestParam(value = "url", required = false) String url) {
        if (url != null && !url.isBlank()) {
            cloudinaryService.deleteImage(url);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa ảnh"));
    }
}
