import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
// import ForumCard from '../../components/ForumCard/ForumCard';
// import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
// import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useNavigate } from 'react-router-dom';
import { colors, radii, spacing, typography } from '../../theme/designTokens';

type ForumPost = {
  id: string;
  title: string;
  content: string;
  topic: string;
  likes: number;
  createdAt: string;
};

const seedPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Anyone balancing caregiving with a full-time job?',
    content: 'How do you keep a schedule without burning out? Looking for time-boxing tips.',
    topic: 'Popular',
    likes: 42,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Lifehack: pre-portioning medication for the week',
    content: 'I use color-coded pill organizers to avoid confusion for my dad.',
    topic: 'Lifehack',
    likes: 18,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Win: Mom loved the memory-friendly music playlist we made',
    content: 'Sharing a small victory—it kept her engaged for an hour!',
    topic: 'Wins',
    likes: 27,
    createdAt: new Date().toISOString(),
  },
];

const templates = {
  question: 'I have a question about...',
  lifehack: 'A small hack that helped me is...',
  win: 'I am celebrating a win today...',
};

const peerGroup = [
  { id: 'p1', initials: 'A.B.', subtitle: 'Takes care of two elderly parents', age: '40y' },
  { id: 'p2', initials: 'A.B.', subtitle: 'Takes care of two elderly parents', age: '40y' },
  { id: 'p3', initials: 'A.B.', subtitle: 'Takes care of two elderly parents', age: '40y' },
];

const CommunityForumsScreen = () => {
  // const navigate = useNavigate();
  // const { hasUnread } = useUnreadNotifications();

  const [posts, setPosts] = useState<ForumPost[]>(seedPosts);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'Popular' | 'Topic'>('Popular');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [tab, setTab] = useState<'forums' | 'peer'>('forums');
  const [pageHeaderTitle, setPageHeaderTitle] = useState<string>('Find support and answers here');

  const filteredPosts = useMemo(() => {
    const result = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.content.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'Popular') {
      return [...result].sort((a, b) => b.likes - a.likes);
    }
    return [...result].sort((a, b) => a.topic.localeCompare(b.topic));
  }, [posts, search, sortBy]);

  const handleCreatePost = (templateKey?: keyof typeof templates) => {
    const templateContent = templateKey ? templates[templateKey] : '';
    if (!newTitle.trim() && !templateContent) return;
    const newPost: ForumPost = {
      id: `${Date.now()}`,
      title: newTitle.trim() || 'Untitled post',
      content: newContent.trim() || templateContent,
      topic: templateKey ? templateKey : 'General',
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setNewTitle('');
    setNewContent('');
  };

  useEffect(() => {
    if (tab === 'forums') {
      setPageHeaderTitle('Find support and answers here');
    } else {
      setPageHeaderTitle(
        'Welcome to a close group of people, who go through similar situations as you do'
      );
    }
  }, [tab]);

  const isForums = tab === 'forums';

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }} style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, isForums && styles.tabActive]}
          onPress={() => setTab('forums')}
        >
          <Text style={[styles.tabText, isForums && styles.tabTextActive]}>Forums</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !isForums && styles.tabActive]}
          onPress={() => setTab('peer')}
        >
          <Text style={[styles.tabText, !isForums && styles.tabTextActive]}>Peer community</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.heading}>{pageHeaderTitle}</Text>
        {/* <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} /> */}
      </View>

      {isForums ? (
        <>
          <View style={styles.searchRow}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search any topic"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </View>

          <View style={styles.sortInlineRow}>
            <View style={styles.sortPillRow}>
              <Text style={styles.sortPillLabel}>Sort by:</Text>
              <TouchableOpacity onPress={() => setSortBy('Popular')}>
                <Text
                  style={[
                    styles.sortLink,
                    sortBy === 'Popular' ? styles.sortLinkActive : undefined,
                  ]}
                >
                  Popular
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sortPillRow}>
              <Text style={styles.sortPillLabel}>Topic:</Text>
              <TouchableOpacity onPress={() => setSortBy('Topic')}>
                <Text style={styles.sortLink}>Any</Text>
              </TouchableOpacity>
            </View>
          </View>

          {filteredPosts.map((post) => (
            <View key={post.id} style={styles.feedCard}>
              <Text style={styles.feedTitle}>{post.title}</Text>
              <Text style={styles.feedPreview} numberOfLines={2}>
                {post.content}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>5</Text>
                <Text style={styles.metaText}>A.B.</Text>
                <Text style={styles.metaText}>2d ago</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.fab} onPress={() => handleCreatePost()}>
            <Text style={styles.fabText}>＋</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.peerBody}>
            This chat is meant as a support group and place where you can always discuss anything
            that comes up your way.
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Join the chat</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Here’s your peer group:</Text>
          {peerGroup.map((member) => (
            <View key={member.id} style={styles.peerCard}>
              <View style={styles.peerAvatar}>
                <Text style={styles.peerAvatarText}>{member.initials}</Text>
              </View>
              <View style={styles.peerInfo}>
                <Text style={styles.peerName}>
                  {member.initials}, {member.age}
                </Text>
                <Text style={styles.peerSubtitle}>{member.subtitle}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.base,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.base,
    borderColor: colors.base,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabText: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.headingSerif,
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  searchRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body18Medium,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: radii.card,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  sortInlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sortPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortPillLabel: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  sortLink: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  sortLinkActive: {
    color: colors.textPrimary,
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  feedTitle: {
    ...typography.body18Medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  feedPreview: {
    ...typography.body16Regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: colors.cta,
    paddingVertical: spacing.md,
    borderRadius: radii.button,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.base,
    ...typography.body18Medium,
  },
  peerHeading: {
    ...typography.headingSerif,
    color: colors.textPrimary,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  peerBody: {
    ...typography.body18Medium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  peerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerAvatarText: {
    ...typography.body16Regular,
    color: colors.base,
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    ...typography.body16Regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  peerSubtitle: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C7C6F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  fabText: {
    ...typography.body18Medium,
    color: colors.textPrimary,
  },
});

export default CommunityForumsScreen;
