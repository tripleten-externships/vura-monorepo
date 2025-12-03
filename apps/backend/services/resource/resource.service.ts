import { GraphQLError } from 'graphql';
import { BaseService, ServiceDependencies } from '../core';
import { GetResourcesInput, ResourceOrderBy } from './types';
import { decodeCursor, encodeCursor } from '../../api/pagination/cursor';

type OrderByInput = { id?: 'asc' | 'desc' | null; content?: 'asc' | 'desc' | null };

const MIN_SEARCH_LENGTH = 2;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

export class ResourceService extends BaseService {
  constructor(deps: ServiceDependencies) {
    super(deps);
  }

  async listResources(input: GetResourcesInput = {}) {
    const { first = DEFAULT_PAGE_SIZE, after, checklistId, searchTerm, orderBy = 'ID_ASC' } = input;

    if (first <= 0 || first > MAX_PAGE_SIZE) {
      throw new GraphQLError(`'first' must be between 1 and ${MAX_PAGE_SIZE}, received: ${first}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (searchTerm && searchTerm.length < MIN_SEARCH_LENGTH) {
      throw new GraphQLError(`Search term must be at least ${MIN_SEARCH_LENGTH} characters`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (checklistId) {
      const checklist = await this.context.db.Checklist.findOne({ where: { id: checklistId } });
      if (!checklist) {
        throw new GraphQLError('Checklist not found', { extensions: { code: 'NOT_FOUND' } });
      }
    }

    let decodedCursor: { id: number } | undefined;
    if (after) {
      try {
        decodedCursor = decodeCursor(after) as { id: number };
        if (!decodedCursor?.id || typeof decodedCursor.id !== 'number') {
          throw new Error('Invalid cursor format');
        }
      } catch {
        throw new GraphQLError('Invalid cursor', { extensions: { code: 'BAD_USER_INPUT' } });
      }
    }

    const where: any = {};
    if (checklistId) {
      where.checklist = { id: { equals: checklistId } };
    }
    if (searchTerm) {
      where.OR = [
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { link: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const orderByClause = this.buildOrderBy(orderBy);

    const totalCount = await this.context.db.Resource.count({ where });

    const resources = await this.context.db.Resource.findMany({
      where,
      orderBy: [orderByClause],
      take: first + 1,
      ...(decodedCursor ? { skip: 1, cursor: { id: decodedCursor.id } } : {}),
    });

    const hasNextPage = resources.length > first;
    const paginatedResources = hasNextPage ? resources.slice(0, first) : resources;

    const edges = paginatedResources.map((resource) => ({
      node: resource,
      cursor: encodeCursor({ id: resource.id }),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null,
      },
      totalCount,
    };
  }

  private buildOrderBy(orderBy: ResourceOrderBy): OrderByInput {
    switch (orderBy) {
      case 'ID_ASC':
        return { id: 'asc' };
      case 'ID_DESC':
        return { id: 'desc' };
      case 'CONTENT_ASC':
        return { content: 'asc' };
      case 'CONTENT_DESC':
        return { content: 'desc' };
      default:
        throw new GraphQLError(`Invalid order parameter: ${orderBy}`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
    }
  }
}
