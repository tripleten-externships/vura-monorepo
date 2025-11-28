import { CreateNotificationInput, NotificationType, NotificationPriority } from '../types';

/**
 * Input data for forum notification templates
 */
export interface ForumTemplateInput {
  postId: string;
  postTitle: string;
  postAuthor: string;
  topicTitle: string;
  excerpt: string;
  actionUrl: string;
}

/**
 * Return type for forum notification templates (omitting userId as it's provided separately)
 */
type ForumNotificationTemplate = Omit<CreateNotificationInput, 'userId'>;

/**
 * Creates a preview of the post excerpt with truncation
 */
function createExcerpt(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength)}...`;
}

/**
 * Template for new posts in subscribed topics
 */
export function newPostInSubscribedTopicTemplate(
  input: ForumTemplateInput
): ForumNotificationTemplate {
  const excerpt = createExcerpt(input.excerpt, 100);

  return {
    type: 'forum_new_post',
    notificationType: 'FORUM' as NotificationType,
    priority: 'MEDIUM' as NotificationPriority,
    content: `${input.postAuthor} posted in "${input.topicTitle}": ${input.postTitle}`,
    actionUrl: input.actionUrl,
    metadata: {
      postId: input.postId,
      postTitle: input.postTitle,
      postAuthor: input.postAuthor,
      topicTitle: input.topicTitle,
      excerpt,
      event: 'new_post_in_subscribed_topic',
    },
    relatedForumPostId: input.postId,
  };
}

/**
 * Template for replies to user's own posts
 */
export function replyToYourPostTemplate(input: ForumTemplateInput): ForumNotificationTemplate {
  const excerpt = createExcerpt(input.excerpt, 100);

  return {
    type: 'forum_reply_to_your_post',
    notificationType: 'FORUM' as NotificationType,
    priority: 'HIGH' as NotificationPriority,
    content: `${input.postAuthor} replied to your post in "${input.topicTitle}"`,
    actionUrl: input.actionUrl,
    metadata: {
      postId: input.postId,
      postTitle: input.postTitle,
      postAuthor: input.postAuthor,
      topicTitle: input.topicTitle,
      excerpt,
      event: 'reply_to_your_post',
      isDirectReply: true,
    },
    relatedForumPostId: input.postId,
  };
}

/**
 * Template for replies to subscribed posts
 */
export function replyToSubscribedPostTemplate(
  input: ForumTemplateInput
): ForumNotificationTemplate {
  const excerpt = createExcerpt(input.excerpt, 100);

  return {
    type: 'forum_reply_to_subscribed',
    notificationType: 'FORUM' as NotificationType,
    priority: 'MEDIUM' as NotificationPriority,
    content: `${input.postAuthor} replied in "${input.topicTitle}"`,
    actionUrl: input.actionUrl,
    metadata: {
      postId: input.postId,
      postTitle: input.postTitle,
      postAuthor: input.postAuthor,
      topicTitle: input.topicTitle,
      excerpt,
      event: 'reply_to_subscribed_post',
    },
    relatedForumPostId: input.postId,
  };
}

/**
 * Helper function to get the appropriate forum notification template
 */
export function getForumNotificationTemplate(
  type: 'new_post' | 'reply_to_your_post' | 'reply_to_subscribed',
  data: ForumTemplateInput
): ForumNotificationTemplate {
  switch (type) {
    case 'new_post':
      return newPostInSubscribedTopicTemplate(data);
    case 'reply_to_your_post':
      return replyToYourPostTemplate(data);
    case 'reply_to_subscribed':
      return replyToSubscribedPostTemplate(data);
    default:
      throw new Error(`Unknown forum notification type: ${type}`);
  }
}
(VURA - 39 / [Frontend] - Onboarding) & (Questionnaire - Flow);
