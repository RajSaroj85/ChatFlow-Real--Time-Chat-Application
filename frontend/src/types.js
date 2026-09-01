/**
 * @typedef {'USER' | 'ADMIN'} Role
 */

/**
 * @typedef {'ADMIN' | 'MODERATOR' | 'MEMBER'} GroupRole
 */

/**
 * @typedef {'PRIVATE' | 'GROUP'} ConversationType
 */

/**
 * @typedef {'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM'} MessageType
 */

/**
 * @typedef {'SENT' | 'DELIVERED' | 'READ'} MessageDeliveryStatus
 */

/**
 * @typedef {'EVERYONE' | 'CONTACTS' | 'NOBODY'} PrivacyOption
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} fullName
 * @property {string} email
 * @property {string} [phone]
 * @property {string} profileImage
 * @property {string} [bio]
 * @property {Role} role
 * @property {'ONLINE' | 'OFFLINE' | 'AWAY'} status
 * @property {string} [lastSeen]
 * @property {Object} privacy
 * @property {PrivacyOption} privacy.whoCanMessageMe
 * @property {PrivacyOption} privacy.whoCanSeeOnlineStatus
 * @property {PrivacyOption} privacy.whoCanSeeLastSeen
 * @property {PrivacyOption} privacy.whoCanAddToGroups
 * @property {string[]} blockedUserIds
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} [messageId]
 * @property {string} fileName
 * @property {string} fileUrl
 * @property {'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'OTHER'} fileType
 * @property {number} fileSize
 * @property {number} [duration]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Reaction
 * @property {string} id
 * @property {string} messageId
 * @property {string} userId
 * @property {string} userName
 * @property {string} reaction
 * @property {string} createdAt
 */

/**
 * @typedef {Object} MessageStatusEntry
 * @property {string} userId
 * @property {MessageDeliveryStatus} status
 * @property {string} timestamp
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} conversationId
 * @property {string} senderId
 * @property {string} senderName
 * @property {string} [senderAvatar]
 * @property {string} content
 * @property {MessageType} messageType
 * @property {Attachment[]} [attachments]
 * @property {string} [replyToMessageId]
 * @property {Object} [replyToMessage]
 * @property {string} replyToMessage.id
 * @property {string} replyToMessage.senderName
 * @property {string} replyToMessage.content
 * @property {boolean} [isEdited]
 * @property {boolean} [isDeleted]
 * @property {string[]} [deletedForUserIds]
 * @property {Reaction[]} reactions
 * @property {MessageDeliveryStatus} status
 * @property {MessageStatusEntry[]} [statuses]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ConversationMember
 * @property {string} id
 * @property {string} conversationId
 * @property {string} userId
 * @property {string} userName
 * @property {string} [userAvatar]
 * @property {GroupRole} role
 * @property {string} joinedAt
 * @property {string} [lastReadMessageId]
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {ConversationType} type
 * @property {string} [name]
 * @property {string} [description]
 * @property {string} [groupImage]
 * @property {string} createdBy
 * @property {ConversationMember[]} members
 * @property {Message} [lastMessage]
 * @property {number} [unreadCount]
 * @property {boolean} [isPinned]
 * @property {boolean} [isMuted]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {'NEW_MESSAGE' | 'GROUP_INVITE' | 'ADDED_TO_GROUP' | 'MENTION' | 'REACTION' | 'SYSTEM'} type
 * @property {string} title
 * @property {string} message
 * @property {string} [referenceId]
 * @property {boolean} isRead
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} reportedBy
 * @property {string} reporterName
 * @property {string} reportedUser
 * @property {string} reportedUserName
 * @property {string} [targetMessageId]
 * @property {string} [targetMessageContent]
 * @property {'SPAM' | 'HARASSMENT' | 'FAKE_ACCOUNT' | 'INAPPROPRIATE_CONTENT' | 'OTHER'} reason
 * @property {string} description
 * @property {'PENDING' | 'RESOLVED' | 'DISMISSED'} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AdminMetrics
 * @property {number} totalUsers
 * @property {number} activeUsers
 * @property {number} messagesToday
 * @property {number} groupsCount
 * @property {number} reportsCount
 * @property {number} blockedUsersCount
 * @property {Array} dailyMessagesData
 * @property {Array} activeUsersData
 * @property {Array} registrationTrend
 */

/**
 * @typedef {Object} WebSocketEvent
 * @property {'chat:message' | 'chat:typing' | 'chat:read' | 'chat:reaction' | 'chat:edit' | 'chat:delete' | 'user:status' | 'conversation:created' | 'group:update' | 'notification:new'} type
 * @property {any} payload
 */

export {};
