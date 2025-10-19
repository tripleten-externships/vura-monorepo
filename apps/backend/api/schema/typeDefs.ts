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
  }

  type Query {
    userProfile: UserProfile
    getResources(input: GetResourcesInput): ResourceConnection!
    getForumPost(id: ID!): ForumPostDetails
    getForumPosts(input: GetForumPostsInput): ForumPostConnection!
  }
`;
