package com.chatflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "message_statuses", uniqueConstraints = {
    @UniqueConstraint(name = "uk_message_recipient", columnNames = {"message_id", "recipient_id"})
}, indexes = {
    @Index(name = "idx_message", columnList = "message_id"),
    @Index(name = "idx_recipient", columnList = "recipient_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageStatus {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status = DeliveryStatus.SENT;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Enum
    public enum DeliveryStatus {
        SENT, DELIVERED, READ
    }
}
