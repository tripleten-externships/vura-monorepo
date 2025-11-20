import { gql } from 'graphql-tag';

// SDL for custom types/inputs/enums
export const typeDefs = gql`
  # Custom scalars
  scalar DateTime
  scalar JSON

  # Questionnaire Input Types
  input SaveQuestionnaireResponseInput {
    questionnaireId: ID! @constraint(minLength: 1)
    carePlanId: ID @constraint(minLength: 1)
    checklistId: ID @constraint(minLength: 1)
    responses: [QuestionResponseInput!]!
    isDraft: Boolean
  }

  input QuestionResponseInput {
    questionId: ID! @constraint(minLength: 1)
    answer: JSON!
    confidence: Int @constraint(min: 1, max: 5)
    notes: String @constraint(maxLength: 2000)
  }

  input SubmitQuestionnaireInput {
    questionnaireResponseId: ID! @constraint(minLength: 1)
    updateCarePlanProgress: Boolean
  }

  # Questionnaire Output Types
  type SaveQuestionnaireResponseResult {
    questionnaireResponseId: ID!
    message: String!
    completionPercentage: Float!
    carePlanUpdated: Boolean
    checklistUpdated: Boolean
  }

  type SubmitQuestionnaireResult {
    questionnaireResponseId: ID!
    message: String!
    completedAt: DateTime!
    carePlanProgressScore: Float
    checklistCompletionScore: Float
  }

  # Authentication Types
  input SignupInput {
    name: String! @constraint(minLength: 2, maxLength: 120)
    email: String! @constraint(format: "email")
    password: String! @constraint(minLength: 8, maxLength: 128)
    age: Int @constraint(min: 13, max: 120)
    gender: String @constraint(maxLength: 50)
    avatarUrl: String @constraint(format: "uri")
  }

  input LoginInput {
    email: String! @constraint(format: "email")
    password: String! @constraint(minLength: 8, maxLength: 128)
  }

  type SignupResult {
    user: UserProfile!
    token: String!
  }

  type LoginResult {
    user: UserProfile!
    token: String!
  }

  # User Profile
  type UserProfile {
    id: ID!
    name: String
    email: String
    avatarUrl: String
    age: Int
    gender: String
    privacyToggle: Boolean
    isAdmin: Boolean
    createdAt: DateTime
    lastLoginDate: DateTime
    lastUpdateDate: DateTime
  }

  # Resources Types
  input GetResourcesInput {
    first: Int @constraint(min: 1, max: 100)
    after: String @constraint(minLength: 1, maxLength: 256)
    checklistId: ID @constraint(minLength: 1)
    searchTerm: String @constraint(maxLength: 120)
    orderBy: ResourceOrderBy
  }

  enum ResourceOrderBy {
    ID_ASC
    ID_DESC
    CONTENT_ASC
    CONTENT_DESC
  }

  type ResourceConnection {
    edges: [ResourceEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ResourceEdge {
    node: Resource!
    cursor: String!
  }

  type Resource {
    id: ID!
    link: String!
    content: String!
    checklist: Checklist
  }

  type Checklist {
    id: ID!
    name: String!
  }

  # Common Pagination Type
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Forum Post Types

  input CreateForumPostInput {
    title: String! @constraint(minLength: 3, maxLength: 140)
    topic: String! @constraint(minLength: 2, maxLength: 60)
    content: String! @constraint(minLength: 3, maxLength: 5000)
    priority: ForumPostPriority
    forumPostType: ForumPostType!
    type: String! @constraint(maxLength: 50)
    metadata: JSON
  }

  type ForumSubscriptionNotification {
    id: ID!
    topic: String!
    content: String!
    actionUrl: String!
  }

  type CustomCreateForumPostResult {
    forumPost: ForumPostDetails!
    message: String!
  }

  type CustomDeleteForumPostResult {
    success: Boolean!
    message: String!
    deletedPostId: ID!
  }

  input GetForumPostsInput {
    first: Int @constraint(min: 1, max: 50)
    after: String @constraint(minLength: 1, maxLength: 256)
    topic: String @constraint(maxLength: 60)
    authorId: ID @constraint(minLength: 1)
    searchTerm: String @constraint(maxLength: 120)
    dateFrom: DateTime
    dateTo: DateTime
    orderBy: ForumPostOrderBy
  }

  enum ForumPostOrderBy {
    CREATED_AT_ASC
    CREATED_AT_DESC
    UPDATED_AT_ASC
    UPDATED_AT_DESC
    TITLE_ASC
    TITLE_DESC
  }

  enum ForumPostPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum ForumPostType {
    NEW_POST
    REPLY_TO_YOUR_POST
    REPLY_TO_SUBSCRIBED_POST
  }

  type ForumPostConnection {
    edges: [ForumPostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ForumPostEdge {
    node: ForumPostDetails!
    cursor: String!
  }

  type ForumPostDetails {
    id: ID!
    title: String!
    topic: String!
    content: String!
    createdAt: DateTime!
    updatedAt: DateTime
    author: UserProfile
  }

  type ForumPostCreatedEvent {
    postId: ID!
    topic: String!
    content: String!
    authorName: String!
    subscriberIds: [ID!]!
    createdAt: String!
  }

  type NotificationCreatedEvent {
    notificationId: ID!
    userId: ID!
    type: String!
    notificationType: String!
    priority: String!
    content: String!
    actionUrl: String
    metadata: JSON
    createdAt: String!
  }

  # Group Chat Types
  input CreateGroupChatInput {
    groupName: String! @constraint(minLength: 3, maxLength: 80)
    memberIds: [ID!]!
  }

  type CustomCreateGroupChatResult {
    groupId: ID!
    groupName: String!
    message: String!
  }

  input SendChatMessageInput {
    groupId: String! @constraint(minLength: 1)
    message: String! @constraint(minLength: 1, maxLength: 2000)
  }

  type SendChatMessageResult {
    chatMessage: ChatMessageType!
    message: String!
  }

  # Using a custom ChatMessageType to avoid conflicts with the system-generated ChatMessage type
  type ChatMessageType {
    id: ID!
    message: String!
    createdAt: DateTime!
    sender: UserProfile
    group: ID!
  }

  # AI Chat Types
  input AiChatMessageInput {
    role: String! @constraint(pattern: "^(user|assistant|system|tool)$")
    content: String! @constraint(minLength: 1, maxLength: 4000)
  }

  input AiChatInput {
    messages: [AiChatMessageInput!]!
    systemPrompt: String @constraint(maxLength: 2000)
    temperature: Float
    provider: String @constraint(maxLength: 40)
  }

  type AiChatResponse {
    content: String!
    usage: JSON
    metadata: JSON
  }

  # Single AI chat message create (persist & return session id)
  input CreateAiChatMessageInput {
    sessionId: ID @constraint(minLength: 1)
    prompt: String! @constraint(minLength: 1, maxLength: 4000)
  }

  type CreateAiChatMessageResult {
    success: Boolean!
    message: String
    error: String
    sessionId: ID
  }

  # Profile Management
  input UpdateProfileInput {
    name: String @constraint(minLength: 2, maxLength: 120)
    email: String @constraint(format: "email")
    age: Int @constraint(min: 13, max: 120)
    gender: String @constraint(maxLength: 50)
    avatarUrl: String @constraint(format: "uri")
    currentPassword: String @constraint(minLength: 8, maxLength: 128)
  }

  type UpdateProfileResponse {
    success: Boolean!
    message: String
    error: String
    userId: ID
  }

  # Generic success response
  type SuccessResponse {
    success: Boolean!
    message: String
  }

  # Typing indicator input
  input TypingIndicatorInput {
    groupId: ID! @constraint(minLength: 1)
    isTyping: Boolean!
  }

  # User status input
  input UserStatusInput {
    status: String! @constraint(maxLength: 32)
  }

  # Notification Types
  enum NotificationType {
    CARE_PLAN
    CHAT
    FORUM
    SYSTEM
  }

  enum NotificationPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  input CreateNotificationInput {
    userId: ID! @constraint(minLength: 1)
    type: String! @constraint(maxLength: 50)
    notificationType: NotificationType!
    priority: NotificationPriority
    content: String! @constraint(minLength: 1, maxLength: 500)
    actionUrl: String @constraint(format: "uri")
    metadata: JSON
    relatedCarePlanId: ID @constraint(minLength: 1)
    relatedChatId: ID @constraint(minLength: 1)
    relatedForumPostId: ID @constraint(minLength: 1)
  }

  input GetNotificationsInput {
    read: Boolean
    notificationType: NotificationType
    priority: NotificationPriority
    take: Int @constraint(min: 1, max: 50)
    skip: Int @constraint(min: 0, max: 200)
  }

  type NotificationDetails {
    id: ID!
    type: String!
    notificationType: NotificationType!
    priority: NotificationPriority!
    content: String!
    actionUrl: String
    metadata: JSON
    read: Boolean!
    readAt: DateTime
    createdAt: DateTime!
  }

  type CreateNotificationResult {
    notification: NotificationDetails!
    message: String!
  }

  type MarkAsReadResult {
    notification: NotificationDetails!
    message: String!
  }

  type MarkAllAsReadResult {
    count: Int!
    message: String!
  }

  type NotificationsResult {
    notifications: [NotificationDetails!]!
    total: Int!
    hasMore: Boolean!
    skip: Int!
    take: Int!
  }

  type UnreadCountResult {
    count: Int!
    notificationType: NotificationType
  }

  type ForumSubscriptionResult {
    success: Boolean!
    message: String
    subscriptionId: ID
    notification: ForumSubscriptionNotification
  }

  type ForumSubscriptionNotification {
    id: ID!
    topic: String
    content: String
    actionUrl: String
  }

  # Questionnaire assignment
  input AssignQuestionnaireInput {
    questionnaireId: ID! @constraint(minLength: 1)
    assignedToId: ID! @constraint(minLength: 1)
    carePlanId: ID @constraint(minLength: 1)
  }

  type AssignQuestionnaireResult {
    success: Boolean!
    message: String!
    assignment: JSON
  }

  # Root Types
  type Mutation {
    signup(input: SignupInput!): SignupResult!
    login(input: LoginInput!): LoginResult!
    customCreateForumPost(data: CreateForumPostInput!): CustomCreateForumPostResult!
    customDeleteForumPost(id: ID!): CustomDeleteForumPostResult!
    customCreateGroupChat(input: CreateGroupChatInput!): CustomCreateGroupChatResult!
    sendChatMessage(input: SendChatMessageInput!): SendChatMessageResult!
    saveQuestionnaireResponse(
      input: SaveQuestionnaireResponseInput!
    ): SaveQuestionnaireResponseResult!
    submitQuestionnaire(input: SubmitQuestionnaireInput!): SubmitQuestionnaireResult!
    updateProfile(input: UpdateProfileInput!): UpdateProfileResponse
    aiChat(input: AiChatInput!): AiChatResponse!
    createAiChatMessage(input: CreateAiChatMessageInput!): CreateAiChatMessageResult!
    typingIndicator(input: TypingIndicatorInput!): SuccessResponse!
    updateUserStatus(input: UserStatusInput!): SuccessResponse!
    customCreateNotification(input: CreateNotificationInput!): CreateNotificationResult!
    customMarkNotificationAsRead(notificationId: ID!): MarkAsReadResult!
    customMarkAllNotificationsAsRead: MarkAllAsReadResult!
    customSubscribeToForum(
      authorName: String!
      topic: String!
      postId: ID
    ): ForumSubscriptionResult!
    customUnsubscribeFromForum(topic: String!): ForumSubscriptionResult!
    assignQuestionnaire(input: AssignQuestionnaireInput!): AssignQuestionnaireResult!
  }

  type Query {
    userProfile: UserProfile
    getResources(input: GetResourcesInput): ResourceConnection!
    getForumPost(id: ID!): ForumPostDetails
    getForumPosts(input: GetForumPostsInput): ForumPostConnection!
    customGetNotifications(input: GetNotificationsInput): NotificationsResult!
    customGetUnreadCount(notificationType: NotificationType): UnreadCountResult!
  }

  # Typing indicator payload
  type TypingIndicatorPayload {
    userId: ID!
    username: String
    groupId: ID!
    isTyping: Boolean!
  }

  # User status payload
  type UserStatusPayload {
    userId: ID!
    username: String
    status: String! # "online" or "offline"
  }

  # Subscription type for real-time events
  type Subscription {
    # Subscribe to new chat messages in a specific group
    messageSent(groupId: ID!): ChatMessageType!

    # Subscribe to typing indicators in a specific group
    typingIndicator(groupId: ID!): TypingIndicatorPayload!

    # Subscribe to user status changes
    userStatusChanged(userId: ID): UserStatusPayload!

    # Subscribe to AI chat messages for a specific session
    aiMessageReceived(sessionId: ID!): AiChatResponse!

    # Subscribe to new notifications for a specific user
    notificationReceived(userId: ID!): NotificationDetails!

    # Subscribe to unread count changes for a specific user
    unreadCountChanged(userId: ID!): UnreadCountResult!

    # Subscribe to forum post created events
    forumPostCreated: ForumPostCreatedEvent!

    # Subscribe to forum notifications for a specific user
    forumNotification(userId: String!): NotificationCreatedEvent!
  }
`;
//
