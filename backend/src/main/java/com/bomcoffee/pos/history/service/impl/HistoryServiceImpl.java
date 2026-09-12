package com.bomcoffee.pos.history.service.impl;

import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.common.exception.ResourceNotFoundException;
import com.bomcoffee.pos.history.controller.HistoryController.HistorySearchCriteria;
import com.bomcoffee.pos.history.service.HistoryService;
import com.bomcoffee.pos.order.entity.Order;
import com.bomcoffee.pos.order.entity.OrderItem;
import com.bomcoffee.pos.order.repository.OrderRepository;
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
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        orderRepository.findByIdWithBilliardSessions(id);
        orderRepository.findByIdWithPayments(id);
        return order;
    }

    private Specification<Order> buildSpec(HistorySearchCriteria criteria) {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("table", JoinType.LEFT);
                root.fetch("staff", JoinType.LEFT);
                root.fetch("previousOrder", JoinType.LEFT);
                query.distinct(true);
            }
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
                            cb.like(cb.lower(root.get("staff").get("fullName")), "%" + keyword + "%"),
                            cb.like(cb.lower(cb.coalesce(root.get("customerName"), "")), "%" + keyword + "%")
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
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    item.getProduct().getName();
                }
            }
        }
        if (order.getBilliardSessions() != null) {
            for (var session : order.getBilliardSessions()) {
                session.getStartTime();
                if (session.getTable() != null) {
                    session.getTable().getName();
                }
            }
        }
        if (order.getPayments() != null) {
            for (var payment : order.getPayments()) {
                payment.getMethod();
                payment.getAmount();
            }
        }
    }
}
