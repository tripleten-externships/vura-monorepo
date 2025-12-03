export type ResourceOrderBy = 'ID_ASC' | 'ID_DESC' | 'CONTENT_ASC' | 'CONTENT_DESC';

export interface GetResourcesInput {
  first?: number;
  after?: string;
  checklistId?: string;
  searchTerm?: string;
  orderBy?: ResourceOrderBy;
}
