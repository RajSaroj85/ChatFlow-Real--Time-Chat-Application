-- Create Database
CREATE DATABASE IF NOT EXISTS chatflow_db;
USE chatflow_db;

-- Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    profile_image LONGTEXT,
    bio TEXT,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    status ENUM('ONLINE', 'OFFLINE', 'AWAY') DEFAULT 'OFFLINE',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    privacy_who_can_message ENUM('EVERYONE', 'CONTACTS', 'NOBODY') DEFAULT 'EVERYONE',
    privacy_who_can_see_online ENUM('EVERYONE', 'CONTACTS', 'NOBODY') DEFAULT 'EVERYONE',
    privacy_who_can_see_last_seen ENUM('EVERYONE', 'CONTACTS', 'NOBODY') DEFAULT 'EVERYONE',
    privacy_who_can_add_to_groups ENUM('EVERYONE', 'CONTACTS', 'NOBODY') DEFAULT 'EVERYONE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Blocked Users Table
CREATE TABLE blocked_users (
    id VARCHAR(36) PRIMARY KEY,
    blocker_id VARCHAR(36) NOT NULL,
    blocked_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_blocker_blocked (blocker_id, blocked_id),
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id)
);

-- Conversations Table (supports both 1:1 and group chats)
CREATE TABLE conversations (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('PRIVATE', 'GROUP') NOT NULL,
    name VARCHAR(255),
    description TEXT,
    group_image LONGTEXT,
    created_by VARCHAR(36) NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_type (type),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
);

-- Conversation Members Table
CREATE TABLE conversation_members (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('ADMIN', 'MODERATOR', 'MEMBER') DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id VARCHAR(36),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_conversation_user (conversation_id, user_id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_user (user_id)
);

-- Messages Table
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content LONGTEXT NOT NULL,
    message_type ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'SYSTEM') DEFAULT 'TEXT',
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    reply_to_message_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created_at (created_at)
);

-- Message Status Table (tracks delivery and read status per recipient)
CREATE TABLE message_statuses (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    status ENUM('SENT', 'DELIVERED', 'READ') DEFAULT 'SENT',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_message_recipient (message_id, recipient_id),
    INDEX idx_message (message_id),
    INDEX idx_recipient (recipient_id)
);

-- Attachments Table
CREATE TABLE attachments (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36),
    file_name VARCHAR(255) NOT NULL,
    file_url LONGTEXT NOT NULL,
    file_type ENUM('IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'OTHER') DEFAULT 'OTHER',
    file_size BIGINT NOT NULL,
    duration INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_message (message_id)
);

-- Reactions Table (emoji reactions on messages)
CREATE TABLE reactions (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_message_user_reaction (message_id, user_id, reaction),
    INDEX idx_message (message_id),
    INDEX idx_user (user_id)
);

-- Notifications Table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('NEW_MESSAGE', 'GROUP_INVITE', 'ADDED_TO_GROUP', 'MENTION', 'REACTION', 'SYSTEM') DEFAULT 'SYSTEM',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id VARCHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read)
);

-- Reports Table (for reporting messages or users)
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY,
    reported_by VARCHAR(36) NOT NULL,
    reported_user VARCHAR(36),
    target_message_id VARCHAR(36),
    reason ENUM('SPAM', 'HARASSMENT', 'FAKE_ACCOUNT', 'INAPPROPRIATE_CONTENT', 'OTHER') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('PENDING', 'RESOLVED', 'DISMISSED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (target_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create Indexes for performance
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_message_statuses_status ON message_statuses(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
