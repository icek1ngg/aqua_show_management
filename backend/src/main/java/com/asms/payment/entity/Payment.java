package com.asms.payment.entity;

import com.asms.booking.entity.Booking;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.enums.PaymentReconciliationReason;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(nullable = false, unique = true, length = 80)
    private String payosOrderCode;

    @Column(length = 120)
    private String transactionId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 1000)
    private String paymentLink;

    @Column(length = 1000)
    private String qrCode;

    @Column(length = 120)
    private String paymentLinkId;

    @Column(length = 30)
    private String bankBin;

    @Column(length = 60)
    private String accountNumber;

    @Column(length = 255)
    private String accountName;

    @Column(length = 100)
    private String paymentDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column
    private Instant paidAt;

    @Column
    private Instant inventoryCommittedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 80)
    private PaymentReconciliationReason reconciliationReason;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Payment() {
    }

    public Payment(Booking booking, String payosOrderCode, BigDecimal amount, String paymentLink) {
        this.id = UUID.randomUUID();
        this.booking = booking;
        this.payosOrderCode = payosOrderCode;
        this.amount = amount;
        this.paymentLink = paymentLink;
        this.status = PaymentStatus.PENDING;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public Booking getBooking() {
        return booking;
    }

    public String getPayosOrderCode() {
        return payosOrderCode;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getPaymentLink() {
        return paymentLink;
    }

    public void setPaymentLink(String paymentLink) {
        this.paymentLink = paymentLink;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public String getPaymentLinkId() {
        return paymentLinkId;
    }

    public void setPaymentLinkId(String paymentLinkId) {
        this.paymentLinkId = paymentLinkId;
    }

    public String getBankBin() {
        return bankBin;
    }

    public void setBankBin(String bankBin) {
        this.bankBin = bankBin;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getPaymentDescription() {
        return paymentDescription;
    }

    public void setPaymentDescription(String paymentDescription) {
        this.paymentDescription = paymentDescription;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getInventoryCommittedAt() {
        return inventoryCommittedAt;
    }

    public PaymentReconciliationReason getReconciliationReason() {
        return reconciliationReason;
    }

    public void markInventoryCommitted(Instant committedAt) {
        this.inventoryCommittedAt = committedAt == null ? Instant.now() : committedAt;
        this.reconciliationReason = null;
    }

    public void markInventoryReconciliationRequired(PaymentReconciliationReason reason) {
        this.inventoryCommittedAt = null;
        this.reconciliationReason = reason;
    }
}
