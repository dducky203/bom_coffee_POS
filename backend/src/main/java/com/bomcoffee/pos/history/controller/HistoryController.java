package com.bomcoffee.pos.history.controller;

import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.common.enums.PaymentMethod;
import com.bomcoffee.pos.common.enums.TableType;
import com.bomcoffee.pos.common.response.ApiResponse;
import com.bomcoffee.pos.history.service.HistoryService;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.user.entity.User;
import com.bomcoffee.pos.user.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class HistoryController {

    private static final Set<String> SORT_FIELDS = Set.of("closedAt", "createdAt", "finalAmount", "id");

    private final HistoryService historyService;
    private final UserRepository userRepository;

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<Order>>> getOrderHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long tableId,
            @RequestParam(required = false) Long staffId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) TableType tableType,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) Boolean hasPreviousOrder,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "closedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.plusDays(1).atStartOfDay() : null;
        String sortField = SORT_FIELDS.contains(sortBy) ? sortBy : "closedAt";
        int pageSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(sortDir, sortField));

        HistorySearchCriteria criteria = new HistorySearchCriteria();
        criteria.setFrom(fromDateTime);
        criteria.setTo(toDateTime);
        criteria.setTableId(tableId);
        criteria.setStaffId(staffId);
        criteria.setStatus(status);
        criteria.setPaymentMethod(paymentMethod);
        criteria.setTableType(tableType);
        criteria.setMinAmount(minAmount);
        criteria.setMaxAmount(maxAmount);
        criteria.setHasPreviousOrder(hasPreviousOrder);
        criteria.setKeyword(keyword);

        return ResponseEntity.ok(ApiResponse.success(historyService.searchOrders(criteria, pageable)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(historyService.getOrderDetailById(id)));
    }

    @GetMapping("/staffs")
    public ResponseEntity<ApiResponse<List<User>>> getStaffs() {
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAll()));
    }

    @Data
    public static class HistorySearchCriteria {
        private LocalDateTime from;
        private LocalDateTime to;
        private Long tableId;
        private Long staffId;
        private OrderStatus status;
        private PaymentMethod paymentMethod;
        private TableType tableType;
        private BigDecimal minAmount;
        private BigDecimal maxAmount;
        private Boolean hasPreviousOrder;
        private String keyword;
    }
}
