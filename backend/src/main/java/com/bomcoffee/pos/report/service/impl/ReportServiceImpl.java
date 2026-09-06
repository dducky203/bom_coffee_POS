package com.bomcoffee.pos.report.service.impl;

import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;

    @Override
    public Map<String, Object> getRevenue(LocalDate from, LocalDate to) {
        List<Order> orders = orderRepository.findCompletedOrdersBetween(
                from.atStartOfDay(), to.plusDays(1).atStartOfDay());

        BigDecimal totalRevenue = orders.stream()
                .map(Order::getFinalAmount)
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
        List<Order> orders = orderRepository.findCompletedOrdersBetween(
                from.atStartOfDay(), to.plusDays(1).atStartOfDay());

        Map<String, Long> productCount = orders.stream()
                .flatMap(o -> o.getItems().stream())
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
        List<Order> orders = orderRepository.findCompletedOrdersBetween(
                from.atStartOfDay(), to.plusDays(1).atStartOfDay());

        Map<String, BigDecimal> byStaff = orders.stream()
                .filter(o -> o.getStaff() != null)
                .collect(Collectors.groupingBy(
                        o -> o.getStaff().getFullName(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getFinalAmount, BigDecimal::add)));

        return byStaff.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("staffName", e.getKey());
                    m.put("revenue", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
