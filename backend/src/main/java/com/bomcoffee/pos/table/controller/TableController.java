package com.bomcoffee.pos.table.controller;

import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.table.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RestaurantTable>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(tableService.getAllTables()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantTable>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getTableById(id)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RestaurantTable>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        RestaurantTable table = tableService.updateTableStatus(id, body);
        return ResponseEntity.ok(ApiResponse.success(table, "Cập nhật trạng thái bàn thành công"));
    }
}
