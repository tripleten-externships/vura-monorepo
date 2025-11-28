import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import ForumCard from '../../components/ForumCard/ForumCard';
import { useForumStore } from '../../store/StoreContext';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useNavigate } from 'react-router-dom';

const CommunityForumsScreen = observer(() => {
  const forumStore = useForumStore();
  const navigate = useNavigate();
  const { hasUnread } = useUnreadNotifications();

  useEffect(() => {
    forumStore.fetchPosts({ first: 5 });
  }, [forumStore]);

  return (
    <View style={styles.container}>
      <PageHeader
        title="Find support and answers here"
        rightIcon={{
          icon: (
            <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} />
          ),
        }}
      />
      {forumStore.loading ? (
        <ActivityIndicator size="small" color="#333" />
      ) : forumStore.error ? (
        <Text style={styles.error}>{forumStore.error}</Text>
      ) : (
        forumStore.posts.map((post) => (
          <ForumCard
            key={post.id}
            id={post.id}
            title={post.title}
            preview={post.content}
            commentsCount={0}
            author={post.author?.name || 'Anonymous'}
            timeAgo={new Date(post.createdAt).toLocaleDateString()}
          />
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  error: {
    color: '#b00020',
  },
});

export default CommunityForumsScreen;
