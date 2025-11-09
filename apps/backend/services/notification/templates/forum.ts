// apps/backend/services/notification/templates/forum.ts

// This defines a TypeScript type named ForumNotificationContext.
// It specifies the shape of the data each template will receive

type ForumNotificationContext = {
  postTitle: string;
  postAuthor: string;
  topicTitle: string;
  excerpt: string;
  postUrl: string;
};

//  This creates and exports a constant named forumTemplates.
//  It’s an object that holds multiple template-generating functions.
// This is a function that takes a ForumNotificationContext object.
// It destructures the input for readability.
// It returns an object with subject and body for the notification

export const forumTemplates = {
  newPostInSubscribedTopic: ({
    postTitle,
    postAuthor,
    topicTitle,
    excerpt,
    postUrl,
  }: ForumNotificationContext) => ({
    // The subject line includes the topic title.
    subject: `New post in topic you're following: "${topicTitle}"`,

    // The body provides details about the new post.
    // The body text is trimmed to remove extra whitespace.
    body: `
${postAuthor} just posted in "${topicTitle}":

"${postTitle}"

${excerpt}

Read more: ${postUrl}

    `.trim(),
  }),

  // This template is for notifying users about replies to their own posts.
  replyToYourPost: ({
    postTitle,
    postAuthor,
    topicTitle,
    excerpt,
    postUrl,
  }: ForumNotificationContext) => ({
    subject: `${postAuthor} replied to your post in "${topicTitle}"`,
    body: `
You received a reply to your post:

"${postTitle}" — by ${postAuthor}

"${excerpt}"

View the reply: ${postUrl}
    `.trim(),
  }),

  // This template is for notifying users about replies to posts they are subscribed to.
  replyToSubscribedPost: ({
    postTitle,
    postAuthor,
    topicTitle,
    excerpt,
    postUrl,
  }: ForumNotificationContext) => ({
    subject: `New reply in a thread you're subscribed to: "${topicTitle}"`,
    body: `
${postAuthor} replied in "${topicTitle}":

"${postTitle}"

"${excerpt}"

Join the discussion: ${postUrl}
    `.trim(),
  }),
};
