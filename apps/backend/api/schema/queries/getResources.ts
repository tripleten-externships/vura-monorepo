import { GraphQLError } from 'graphql';
import type { KeystoneContext } from '@keystone-6/core/types';
import { decodeCursor, encodeCursor } from '../../pagination/cursor';

const MIN_SEARCH_LENGTH = 2;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

export type ResourceOrderBy = 'ID_ASC' | 'ID_DESC' | 'CONTENT_ASC' | 'CONTENT_DESC';

export interface GetResourcesInput {
  first?: number;
  after?: string;
  checklistId?: string;
  searchTerm?: string;
  orderBy?: ResourceOrderBy;
}

interface DecodedCursor {
  id: number;
}

interface ResourceWhereInput {
  checklist?: {
    id: {
      equals: string;
    };
  };
  OR?: Array<{
    content?: {
      contains: string;
      mode: 'insensitive';
    };
    link?: {
      contains: string;
      mode: 'insensitive';
    };
  }>;
}

type OrderByInput = { id: 'asc' | 'desc' } | { content: 'asc' | 'desc' };

export const getResources = async (
  _parent: unknown,
  { input }: { input?: GetResourcesInput },
  context: KeystoneContext
) => {
  try {
    // 1. Validate input
    const {
      first = DEFAULT_PAGE_SIZE,
      after,
      checklistId,
      searchTerm,
      orderBy = 'ID_ASC',
    } = input || {};

    // Validate pagination parameters
    if (first <= 0 || first > MAX_PAGE_SIZE) {
      throw new GraphQLError(`'first' must be between 1 and ${MAX_PAGE_SIZE}, received: ${first}`);
    }

    // Validate search term length
    if (searchTerm && searchTerm.length < MIN_SEARCH_LENGTH) {
      throw new GraphQLError(`Search term must be at least ${MIN_SEARCH_LENGTH} characters`);
    }

    // 2. Validate checklistId if provided
    if (checklistId) {
      const checklist = await context.db.Checklist.findOne({ where: { id: checklistId } });
      if (!checklist) {
        throw new GraphQLError('Checklist not found');
      }
    }

    // 3. Build filters
    const where: ResourceWhereInput = {};
    if (checklistId) {
      where.checklist = { id: { equals: checklistId } };
    }
    if (searchTerm) {
      where.OR = [
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { link: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // 4. Handle ordering
    let orderByObj: OrderByInput;
    switch (orderBy) {
      case 'ID_ASC':
        orderByObj = { id: 'asc' };
        break;
      case 'ID_DESC':
        orderByObj = { id: 'desc' };
        break;
      case 'CONTENT_ASC':
        orderByObj = { content: 'asc' };
        break;
      case 'CONTENT_DESC':
        orderByObj = { content: 'desc' };
        break;
      default:
        throw new GraphQLError(`Invalid order parameter: ${orderBy}`);
    }

    // 5. Handle cursor
    let decodedCursor: DecodedCursor | undefined;
    if (after) {
      try {
        decodedCursor = decodeCursor(after) as DecodedCursor;
        if (!decodedCursor?.id || typeof decodedCursor.id !== 'number') {
          throw new Error('Invalid cursor format');
        }
      } catch (error) {
        throw new GraphQLError('Invalid cursor');
      }
    }

    // 6. Query total count for pagination metadata
    const totalCount = await context.db.Resource.count({ where });

    // 7. Query resources with pagination - fetch first + 1 to check if there are more
    const resources = await context.db.Resource.findMany({
      where,
      orderBy: orderByObj,
      take: first + 1, // Fetch one extra to determine hasNextPage
      ...(decodedCursor ? { skip: 1, cursor: { id: decodedCursor.id } } : {}),
    });

    // 8. Determine if there are more results
    const hasNextPage = resources.length > first;
    const paginatedResources = hasNextPage ? resources.slice(0, first) : resources;

    // 9. Prepare edges and cursors
    const edges = paginatedResources.map((resource) => ({
      node: resource,
      cursor: encodeCursor({ id: resource.id }),
    }));

    // 10. PageInfo
    const hasPreviousPage = !!after;
    const startCursor = edges[0]?.cursor || null;
    const endCursor = edges[edges.length - 1]?.cursor || null;

    return {
      edges,
      pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor },
      totalCount,
    };
  } catch (err: unknown) {
    // Re-throw GraphQL errors as-is
    if (err instanceof GraphQLError) {
      throw err;
    }

    // Log unexpected errors and throw a generic message
    console.error('Failed to fetch resources:', err);
    throw new GraphQLError('Failed to fetch resources', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
