package com.bomcoffee.pos.table.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.entity.Zone;
import com.bomcoffee.pos.table.service.TableService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RestaurantTable>>> getAll(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getAllTables(includeInactive)));
    }

    @GetMapping("/zones")
    public ResponseEntity<ApiResponse<List<Zone>>> getZones() {
        return ResponseEntity.ok(ApiResponse.success(tableService.getAllZones()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantTable>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getTableById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RestaurantTable>> create(@Valid @RequestBody TableRequest req) {
        return ResponseEntity.ok(ApiResponse.success(tableService.createTable(req), "Tạo bàn thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RestaurantTable>> update(
            @PathVariable Long id,
            @Valid @RequestBody TableRequest req) {
        return ResponseEntity.ok(ApiResponse.success(tableService.updateTable(id, req), "Cập nhật bàn thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        tableService.deactivateTable(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã ẩn bàn thành công"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RestaurantTable>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        RestaurantTable table = tableService.updateTableStatus(id, body);
        return ResponseEntity.ok(ApiResponse.success(table, "Cập nhật trạng thái bàn thành công"));
    }

    @Data
    public static class TableRequest {
        @NotBlank(message = "Tên bàn không được để trống")
        @Size(max = 50)
        private String name;

        @NotBlank(message = "Loại bàn không được để trống")
        private String type;

        private Long zoneId;
        private Integer capacity;
        private Boolean active;
    }
}
