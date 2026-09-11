package com.bomcoffee.pos.order.entity;

import com.bomcoffee.pos.billiard.entity.BilliardSession;
import com.bomcoffee.pos.common.enums.OrderStatus;
import com.bomcoffee.pos.payment.entity.Payment;
import com.bomcoffee.pos.table.entity.RestaurantTable;
import com.bomcoffee.pos.user.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"zone", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    @JsonIgnoreProperties({"role", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    @JsonIgnoreProperties({"table", "staff", "items", "hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_order_id")
    private Order previousOrder;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.OPEN;

    @Builder.Default
    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "final_amount", precision = 12, scale = 2)
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @JsonIgnoreProperties({"order", "hibernateLazyInitializer", "handler"})
    @OneToMany(mappedBy = "order")
    @BatchSize(size = 50)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    @JsonIgnoreProperties({"order", "hibernateLazyInitializer", "handler"})
    @OneToMany(mappedBy = "order")
    @BatchSize(size = 50)
    @Builder.Default
    private List<BilliardSession> billiardSessions = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void recalculate() {
        if (items == null) {
            items = new ArrayList<>();
        }
        BigDecimal itemsTotal = items.stream()
                .map(i -> {
                    BigDecimal price = i.getUnitPrice() != null ? i.getUnitPrice() : BigDecimal.ZERO;
                    int qty = i.getQuantity() != null ? i.getQuantity() : 0;
                    return price.multiply(BigDecimal.valueOf(qty));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal billiardTotal = BigDecimal.ZERO;
        if (billiardSessions != null) {
            billiardTotal = billiardSessions.stream()
                    .filter(s -> s.getTotalAmount() != null)
                    .map(BilliardSession::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        this.totalAmount = itemsTotal.add(billiardTotal);
        if (this.discountAmount == null) {
            this.discountAmount = BigDecimal.ZERO;
        }
        this.finalAmount = this.totalAmount.subtract(this.discountAmount);
    }

    @PrePersist
    void prePersist() {
        if (status == null) {
            status = OrderStatus.OPEN;
        }
        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }
        if (discountAmount == null) {
            discountAmount = BigDecimal.ZERO;
        }
        if (finalAmount == null) {
            finalAmount = BigDecimal.ZERO;
        }
    }
}
