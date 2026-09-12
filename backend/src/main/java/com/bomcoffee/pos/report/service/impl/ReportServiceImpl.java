package com.bomcoffee.pos.report.service.impl;

import com.bomcoffee.pos.common.enums.PaymentMethod;
import com.bomcoffee.pos.common.enums.TableType;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.payment.repository.PaymentRepository;
import com.bomcoffee.pos.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public Map<String, Object> getRevenue(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<Order> orders = orderRepository.findCompletedOrdersBetween(start, end);

        BigDecimal totalRevenue = orders.stream()
                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("totalOrders", orders.size());
        result.put("from", from);
        result.put("to", to);
        return result;
    }

    @Override
    public List<Map<String, Object>> getTopProducts(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<Order> orders = orderRepository.findCompletedOrdersBetweenWithItems(start, end);

        Map<String, Long> productCount = orders.stream()
                .flatMap(o -> o.getItems().stream())
                .filter(item -> item.getProduct() != null)
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getName(),
                        Collectors.summingLong(OrderItem::getQuantity)));

        return productCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("productName", e.getKey());
                    m.put("quantity", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getRevenueByStaff(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<Order> orders = orderRepository.findCompletedOrdersBetweenWithStaff(start, end);

        Map<String, BigDecimal> byStaff = orders.stream()
                .filter(o -> o.getStaff() != null)
                .collect(Collectors.groupingBy(
                        o -> o.getStaff().getFullName(),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO,
                                BigDecimal::add)));

        return byStaff.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("staffName", e.getKey());
                    m.put("revenue", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getRevenueByPaymentMethod(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<Object[]> rows = paymentRepository.sumAmountGroupedByMethod(start, end);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            PaymentMethod method = (PaymentMethod) row[0];
            BigDecimal amount = toBigDecimal(row[1]);
            if (amount.signum() <= 0) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("method", method.name());
            m.put("label", paymentLabel(method));
            m.put("revenue", amount);
            result.add(m);
        }
        result.sort((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")));
        return result;
    }

    @Override
    public List<Map<String, Object>> getRevenueByTableType(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<Object[]> rows = orderRepository.sumFinalAmountGroupedByTableType(start, end);

        BigDecimal drink = BigDecimal.ZERO;
        BigDecimal billiard = BigDecimal.ZERO;
        for (Object[] row : rows) {
            TableType type = resolveTableType(row[0]);
            BigDecimal amount = toBigDecimal(row[1]);
            if (type == TableType.BILLIARD) {
                billiard = billiard.add(amount);
            } else {
                drink = drink.add(amount);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        if (drink.signum() > 0) {
            result.add(serviceRow("DRINK", "Bàn nước", drink));
        }
        if (billiard.signum() > 0) {
            result.add(serviceRow("BILLIARD", "Bàn bi-a", billiard));
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getRevenueByService(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        BigDecimal drink = toBigDecimal(orderRepository.sumDrinkItemRevenue(start, end));
        BigDecimal billiard = toBigDecimal(orderRepository.sumBilliardSessionRevenue(start, end));

        List<Map<String, Object>> result = new ArrayList<>();
        if (drink.signum() > 0) {
            result.add(serviceRow("DRINK_ITEMS", "Đồ uống", drink));
        }
        if (billiard.signum() > 0) {
            result.add(serviceRow("BILLIARD_TIME", "Giờ bi-a", billiard));
        }
        return result;
    }

    private Map<String, Object> serviceRow(String key, String label, BigDecimal revenue) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("label", label);
        m.put("revenue", revenue);
        return m;
    }

    private TableType resolveTableType(Object raw) {
        if (raw == null) return TableType.DRINK;
        if (raw instanceof TableType type) return type;
        try {
            return TableType.valueOf(String.valueOf(raw));
        } catch (Exception ex) {
            return TableType.DRINK;
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }

    private String paymentLabel(PaymentMethod method) {
        return switch (method) {
            case CASH -> "Tiền mặt";
            case QR -> "Chuyển khoản QR";
            case BANK_TRANSFER -> "Chuyển khoản";
            case CARD -> "Thẻ";
            case EWALLET -> "Ví điện tử";
        };
    }
}
