import { graphql } from '@keystone-6/core';

// functions used for pagnation cursors
//reverses process for when client sends it back
function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
}
// turns ID into Base64 (safe text format to hide pagnation cursor data) so it is safe for client
function encodeCursor(id: string): string {
  return Buffer.from(id, 'utf-8').toString('base64');
}

export const getForumPosts = graphql.field({
  type: graphql.inputObject()({
    // fields are from JIRA output schema
    name: 'ForumPostConnection',
    fields: {
      // edges = array of post results w/ cursors
      edges: graphql.field({
        type: graphql.nonNull(
          graphql.list(
            graphql.nonNull(
              graphql.object()({
                name: 'ForumPostEdge', // edges is array > each item in array is ! > each item is obj Forum Post Edge >
                fields: {
                  node: graphql.field({ type: graphql.nonNull(graphql.type('POST')) }), // node is actual POST
                  cursor: graphql.field({ type: graphql.nonNull(graphql.String) }),
                },
              })
            )
          )
        ),
      }),
      // pageInfo holds pagination metadata
      pageInfo: graphql.field({
        type: graphql.nonNull(
          graphql.object()({
            name: 'PageInfo',
            fields: {
              hasNextPage: graphql.field({ type: graphql.nonNull(graphql.Boolean) }),
              hasPreviousPage: graphql.field({ type: graphql.nonNull(graphql.Boolean) }),
              startCursor: graphql.field({ type: graphql.String }),
              endCursor: graphql.field({ type: graphql.String }),
            },
          })
        ),
      }),
      // total count of posts matching filters (ex: Showing 1-10 of 100 posts)
      totalCount: graphql.field({ type: graphql.nonNull(graphql.Int) }),
    },
  }),
  //input arguments from JIRA
  args: {
    first: graphql.arg({ type: graphql.Int }), // code defaults to return 10 posts
    after: graphql.arg({ type: graphql.String }), // cursor to start after
    topic: graphql.arg({ type: graphql.String }), // optional filtering
    authorId: graphql.arg({ type: graphql.ID }),
    searchTerm: graphql.arg({ type: graphql.String }),
    dateFrom: graphql.arg({ type: graphql.DateTime }),
    dateTo: graphql.arg({ type: graphql.DateTime }),
    orderBy: graphql.arg({ type: graphql.String }),
  },
  async resolve(source: any, args: any, context: any) {
    if (!context.session?.itemId) {
      throw new Error('User must be authenticated to delete forum posts');
    }
    // Validation
    const first = args.first || 10;

    if (first < 1 || first > 100) {
      throw new Error('Invalid pagination paramaters');
    } // must be whole number

    if (!Number.isInteger(first)) {
      throw new Error('Invalid pagnation parameters');
    }

    if (args.after) {
      try {
        decodeCursor(args.after);
      } catch (error) {
        throw new Error('Invalid cursor');
      }
    }

    if (args.searchTerm.length < 3) {
      throw new Error('Search term must be at least 3 characters');
    }

    if (args.dateFrom && args.dateTo) {
      const fromDate = new Date(args.dateFrom); // converts to date object
      const toDate = new Date(args.dateTo);

      if (fromDate > toDate) {
        throw new Error('Invalide date range');
      }
    }

    if (args.authorId) {
      let author;
      try {
        author = await context.db.User.findOne({
          where: { id: args.authorId },
        });
        // checking if author ID does exist
      } catch (error) {
        console.error('Database error when fetching author:', error);
        throw new Error('Failed to fetch forum posts'); // network issue error
      }
      if (!author) {
        throw new Error('Author not found'); // if author ID does ont exist
      }
    }
    // search capabilties

    const where: any = {}; // empty array to house filter conditions

    if (args.topic) {
      where.topic = { equals: args.topic };
    }
    if (args.authorId) {
      where.author = { id: { equals: args.authorId } };
    }

    if (args.searchTerm) {
      where.OR = [
        { title: { contains: args.searchTerm, mode: 'insensitive' } },
        { content: { contains: args.searchTerm, mode: 'insensitive' } },
      ]; // settings to not be case sensitive and partial match w/ contains
    }

    if (args.dateFrom) {
      where.createdAt = { gte: args.dateFrom }; // gte = greater than or equal
    }

    if (args.dateTo) {
      if (where.createdAt) {
        // lte = less than equal
        where.createdAt.lte = args.dateTo;
      } else {
        where.createdAt = { lte: args.dateTo };
      }
    }

    if (args.after) {
      const cursorId = decodeCursor(args.after);
      where.id = { gt: cursorId };
    }

    // order capabilities

    let orderBy: any = { createdAt: 'desc' };

    if (args.orderBy) {
      switch (
        args.orderBy //checks which option user specified to soft
      ) {
        case 'CREATED_AT_ASC':
          orderBy = { createdAt: 'asc' };
          break;
        case 'CREATED_AT_DESC':
          orderBy = { createdAt: 'desc' };
          break;
        case 'UPDATED_AT_ASC':
          orderBy = { updatedAt: 'asc' };
          break;
        case 'UPDATED_AT_DESC':
          orderBy = { updatedAt: 'desc' };
          break;
        case 'TITLE_ASC':
          orderBy = { title: 'asc' };
          break;
        case 'TITLE_DESC':
          orderBy = { title: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    // fetch posts

    let posts; // holds array of posts
    let totalCount;

    try {
      posts = await context.db.Post.findMany({
        where, // dependent on filter conditions
        orderBy,
        take: first + 1, // fetch one extra to see if there is a next page
      });

      totalCount = await context.db.Post.count({
        where,
      }); // for showing counts, but not actually fetching the posts
    } catch (error) {
      console.error('Database error when fetching posts:', error);
      throw new Error('Failed to fetch forum posts');
    }
    const hasNextPage = posts.length > first;

    if (hasNextPage) {
      posts = posts.slice(0, first); // we don't actually want to return the extra post fetched to confirm if there is a next page
    }
    const hasPreviousPage = !!args.after;

    const startCursor = posts.length > 0 ? encodeCursor(posts[0].id) : null;
    const endCursor = posts.length > 0 ? encodeCursor(posts[posts.length - 1].id) : null;

    const edges = posts.map((post) => ({
      node: post,
      cursor: encodeCursor(post.id),
    }));

    const pageInfo = {
      hasNextPage,
      hasPreviousPage,
      startCursor,
      endCursor,
    };

    return {
      edges,
      pageInfo,
      totalCount,
    };
  },
});
