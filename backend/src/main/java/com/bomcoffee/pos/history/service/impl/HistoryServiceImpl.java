package com.bomcoffee.pos.history.service.impl;

import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.history.controller.HistoryController.HistorySearchCriteria;
import com.bomcoffee.pos.history.service.HistoryService;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.repository.OrderRepository;
import com.bomcoffee.pos.payment.entity.Payment;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HistoryServiceImpl implements HistoryService {

    private final OrderRepository orderRepository;

    @Override
    public Page<Order> searchOrders(HistorySearchCriteria criteria, Pageable pageable) {
        Page<Order> page = orderRepository.findAll(buildSpec(criteria), pageable);
        page.getContent().forEach(this::initializeBasicOrder);
        return page;
    }

    @Override
    public Order getOrderDetailById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        initializeDetail(order);
        return order;
    }

    private Specification<Order> buildSpec(HistorySearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(root.get("status").in(
                    OrderStatus.COMPLETED, OrderStatus.PAID, OrderStatus.CANCELLED));

            if (criteria.getFrom() != null) {
                predicates.add(cb.or(
                        cb.greaterThanOrEqualTo(root.get("closedAt"), criteria.getFrom()),
                        cb.and(cb.isNull(root.get("closedAt")),
                                cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.getFrom()))
                ));
            }
            if (criteria.getTo() != null) {
                predicates.add(cb.or(
                        cb.lessThan(root.get("closedAt"), criteria.getTo()),
                        cb.and(cb.isNull(root.get("closedAt")),
                                cb.lessThan(root.get("createdAt"), criteria.getTo()))
                ));
            }
            if (criteria.getTableId() != null) {
                predicates.add(cb.equal(root.get("table").get("id"), criteria.getTableId()));
            }
            if (criteria.getStaffId() != null) {
                predicates.add(cb.equal(root.get("staff").get("id"), criteria.getStaffId()));
            }
            if (criteria.getTableType() != null) {
                predicates.add(cb.equal(root.get("table").get("type"), criteria.getTableType()));
            }
            if (criteria.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("finalAmount"), criteria.getMinAmount()));
            }
            if (criteria.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("finalAmount"), criteria.getMaxAmount()));
            }
            if (Boolean.TRUE.equals(criteria.getHasPreviousOrder())) {
                predicates.add(cb.isNotNull(root.get("previousOrder")));
            } else if (Boolean.FALSE.equals(criteria.getHasPreviousOrder())) {
                predicates.add(cb.isNull(root.get("previousOrder")));
            }
            if (criteria.getPaymentMethod() != null) {
                query.distinct(true);
                predicates.add(cb.equal(
                        root.join("payments", JoinType.INNER).get("method"),
                        criteria.getPaymentMethod()));
            }
            if (criteria.getStatus() != null) {
                if (criteria.getStatus() == OrderStatus.COMPLETED) {
                    predicates.add(root.get("status").in(OrderStatus.COMPLETED, OrderStatus.PAID));
                } else {
                    predicates.add(cb.equal(root.get("status"), criteria.getStatus()));
                }
            }
            if (criteria.getKeyword() != null && !criteria.getKeyword().trim().isEmpty()) {
                String keyword = criteria.getKeyword().trim().toLowerCase();
                try {
                    predicates.add(cb.equal(root.get("id"), Long.parseLong(keyword)));
                } catch (NumberFormatException ignored) {
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("table").get("name")), "%" + keyword + "%"),
                            cb.like(cb.lower(root.get("staff").get("fullName")), "%" + keyword + "%")
                    ));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void initializeBasicOrder(Order order) {
        if (order.getTable() != null) {
            order.getTable().getName();
        }
        if (order.getStaff() != null) {
            order.getStaff().getFullName();
        }
        if (order.getPreviousOrder() != null) {
            order.getPreviousOrder().getId();
        }
    }

    private void initializeDetail(Order order) {
        initializeBasicOrder(order);
        if (order.getPreviousOrder() != null) {
            order.getPreviousOrder().getId();
        }
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                item.getProduct().getName();
            }
        }
        if (order.getPayments() != null) {
            for (Payment payment : order.getPayments()) {
                if (payment.getCashier() != null) {
                    payment.getCashier().getFullName();
                }
            }
        }
        if (order.getBilliardSessions() != null) {
            order.getBilliardSessions().size();
        }
    }
}
