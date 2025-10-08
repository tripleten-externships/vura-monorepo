export const carePlanTypeDefs = 
`
  input GetUserCarePlanInput {
    carePlanId: ID
    includeArchived: Boolean
    detailLevel: CarePlanDetailLevel
    includeProgress: Boolean
    includeResources: Boolean
    includeQuestionnaireData: Boolean
  }

  enum CarePlanDetailLevel {
    SUMMARY
    DETAILED
    FULL
  }

  enum MilestoneStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    OVERDUE
  }

  type CarePlanProgress {
    overallProgress: Float!
    goalsCompleted: Int!
    totalGoals: Int!
    milestonesAchieved: Int!
    totalMilestones: Int!
    lastUpdated: DateTime!
    nextMilestone: CarePlanMilestone
  }

  type CarePlanMilestone {
    id: ID!
    title: String!
    description: String!
    targetDate: DateTime!
    completedDate: DateTime
    status: MilestoneStatus!
  }

  type GetUserCarePlanResult {
    carePlans: [CarePlan!]!
    activeCarePlan: CarePlan
    totalCount: Int!
    message: String!
  }

  extend type Query {
    getUserCarePlan(input: GetUserCarePlanInput): GetUserCarePlanResult!
  }
`;