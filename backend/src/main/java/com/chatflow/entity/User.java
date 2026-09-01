package com.chatflow.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_username", columnList = "username"),
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    @NotBlank(message = "Username is required")
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank(message = "Full name is required")
    @Column(nullable = false)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(unique = true, nullable = false)
    private String email;

    @Column
    private String phone;

    @Column(nullable = false)
    private String passwordHash;

    @Column(columnDefinition = "LONGTEXT")
    private String profileImage;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.OFFLINE;

    @UpdateTimestamp
    private LocalDateTime lastSeen;

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_who_can_message")
    private PrivacyOption privacyWhoCanMessage = PrivacyOption.EVERYONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_who_can_see_online")
    private PrivacyOption privacyWhoCanSeeOnline = PrivacyOption.EVERYONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_who_can_see_last_seen")
    private PrivacyOption privacyWhoCanSeeLastSeen = PrivacyOption.EVERYONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_who_can_add_to_groups")
    private PrivacyOption privacyWhoCanAddToGroups = PrivacyOption.EVERYONE;

    @OneToMany(mappedBy = "blocker", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<BlockedUser> blockedUsers = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<ConversationMember> conversationMemberships = new HashSet<>();

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<Message> sentMessages = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<Notification> notifications = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<Reaction> reactions = new HashSet<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Enums
    public enum UserRole {
        USER, ADMIN
    }

    public enum UserStatus {
        ONLINE, OFFLINE, AWAY
    }

    public enum PrivacyOption {
        EVERYONE, CONTACTS, NOBODY
    }
}
