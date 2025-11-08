import { gql } from 'graphql-tag';

// SDL for custom types/inputs/enums
export const typeDefs = gql`
  # Custom scalars
  scalar DateTime
  scalar JSON

  # Questionnaire Input Types
  input SaveQuestionnaireResponseInput {
    questionnaireId: ID!
    carePlanId: ID
    checklistId: ID
    responses: [QuestionResponseInput!]!
    isDraft: Boolean
  }

  input QuestionResponseInput {
    questionId: ID!
    answer: JSON!
    confidence: Int
    notes: String
  }

  input SubmitQuestionnaireInput {
    questionnaireResponseId: ID!
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
    name: String!
    email: String!
    password: String!
    age: Int
    gender: String
    avatarUrl: String
  }

  input LoginInput {
    email: String!
    password: String!
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
    first: Int
    after: String
    checklistId: ID
    searchTerm: String
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
  input CustomCreateForumPostInput {
    title: String!
    topic: String!
    content: String!
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
    first: Int
    after: String
    topic: String
    authorId: ID
    searchTerm: String
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

  # Group Chat Types
  input CreateGroupChatInput {
    groupName: String!
    memberIds: [ID!]!
  }

  type CustomCreateGroupChatResult {
    groupId: ID!
    groupName: String!
    message: String!
  }

  input SendChatMessageInput {
    groupId: String!
    message: String!
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
    role: String!
    content: String!
  }

  input AiChatInput {
    messages: [AiChatMessageInput!]!
    systemPrompt: String
    temperature: Float
    provider: String
  }

  type AiChatResponse {
    content: String!
    usage: JSON
    metadata: JSON
  }

  # Single AI chat message create (persist & return session id)
  input CreateAiChatMessageInput {
    sessionId: ID
    prompt: String!
  }

  type CreateAiChatMessageResult {
    success: Boolean!
    message: String
    error: String
    sessionId: ID
  }

  # Profile Management
  input UpdateProfileInput {
    name: String
    email: String
    age: Int
    gender: String
    avatarUrl: String
    currentPassword: String
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
    groupId: ID!
    isTyping: Boolean!
  }

  # User status input
  input UserStatusInput {
    status: String!
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
    userId: ID!
    type: String!
    notificationType: NotificationType!
    priority: NotificationPriority
    content: String!
    actionUrl: String
    metadata: JSON
    relatedCarePlanId: ID
    relatedChatId: ID
    relatedForumPostId: ID
  }

  input GetNotificationsInput {
    read: Boolean
    notificationType: NotificationType
    priority: NotificationPriority
    take: Int
    skip: Int
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
  }
  type ForumSubscriptionNotification {
    id: ID!
    topic: String
    content: String
    actionUrl: String
  }

  type ForumSubscriptionResult {
    message: String
    notification: ForumSubscriptionNotification
  }
  # Root Types
  type Mutation {
    signup(input: SignupInput!): SignupResult!
    login(input: LoginInput!): LoginResult!
    customCreateForumPost(data: CustomCreateForumPostInput!): CustomCreateForumPostResult!
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
    customSubscribToForum(authorName: String!, topic: String!, postId: ID): ForumSubscriptionResult!
    customUnSubscribToForum(topic: String!): ForumSubscriptionResult!
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
  }
`;
