import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
// import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
// import { useUnreadNotifications `} from '../../hooks/useUnreadNotifications';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { colors, radii, spacing, typography } from '../../theme/designTokens';
import arrowRight from '../../../assets/arrow_right.svg';
import { AI_CHAT_MUTATION } from '../../graphql/mutations/ai';
import type { AiChatInput, AiChatMessageInput, AiChatMutation } from '../../__generated__/graphql';

type Resource = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  link: string;
};

const topics = [
  'Any',
  'Time-management',
  'Elderly health',
  'Anxiety',
  'Finances',
  'Mental health',
  'Community',
  'Nutrition',
  'Relationships',
  // 'AI suggestion'
];

const baseResources: Resource[] = [
  {
    id: '1',
    title: 'Medication reminders that actually work',
    summary: 'Simple steps to keep track of doses and avoid missed refills.',
    topic: 'Time-management',
    link: 'https://example.com/medication-reminders',
  },
  {
    id: '2',
    title: 'Weekly meal planning for parents',
    summary: 'Balanced, easy-to-prepare meals with prep steps and a shopping list.',
    topic: 'Nutrition',
    link: 'https://example.com/meal-plans',
  },
  {
    id: '3',
    title: 'Memory-friendly activities you can do together',
    summary: 'Light routines and games that keep the mind engaged without fatigue.',
    topic: 'Elderly health',
    link: 'https://example.com/memory-activities',
  },
  {
    id: '4',
    title: 'Protecting your own energy as a caregiver',
    summary: 'Micro self-care moments you can layer into a busy day.',
    topic: 'Mental health',
    link: 'https://example.com/self-care',
  },
  {
    id: '5',
    title: 'Finding local support groups',
    summary: 'Where to connect with other caregivers near you.',
    topic: 'Community',
    link: 'https://example.com/support-groups',
  },
];

const ResourcesScreen = () => {
  // const { hasUnread } = useUnreadNotifications();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string>('Any');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [askValue, setAskValue] = useState('');
  const [isAskFocused, setIsAskFocused] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Resource[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiChat] = useMutation<AiChatMutation, { input: AiChatInput }>(AI_CHAT_MUTATION);
  const defaultTopicCount = 6;
  const visibleTopics = showAllTopics ? topics : topics.slice(0, defaultTopicCount);
  const hasHiddenTopics = topics.length > defaultTopicCount;

  const filteredResources = useMemo(() => {
    if (selectedTopic === 'Any') return baseResources;
    return baseResources.filter((resource) => resource.topic === selectedTopic);
  }, [selectedTopic]);

  const coerceAiResources = (content: string, question: string): Resource[] => {
    try {
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : (parsed?.resources ?? parsed?.items ?? []);
      if (!Array.isArray(items)) return [];
      const cleaned = items
        .map((item, idx) => {
          if (!item || typeof item !== 'object') return null;
          const title = typeof item.title === 'string' ? item.title.trim() : '';
          const summary = typeof item.summary === 'string' ? item.summary.trim() : '';
          const topic = typeof item.topic === 'string' ? item.topic.trim() : 'AI suggestion';
          const link = typeof item.link === 'string' ? item.link.trim() : '#';
          if (!title || !summary) return null;
          return {
            id: `ai-${Date.now()}-${idx}`,
            title,
            summary,
            topic,
            link,
          } as Resource;
        })
        .filter(Boolean) as Resource[];
      return cleaned;
    } catch {
      if (!content.trim()) return [];
      return [
        {
          id: `ai-${Date.now()}`,
          title: question,
          summary: content.trim(),
          topic: 'AI suggestion',
          link: '#',
        },
      ];
    }
  };

  const isAskDisabled = aiLoading || !askValue.trim();

  const handleAsk = async () => {
    const cleaned = askValue.trim();
    if (!cleaned || aiLoading) return;
    navigate('/resources/chat', { state: { initialQuestion: cleaned } });
    setAskValue('');
    return;
    // setAiLoading(true);
    // setAiError(null);
    // try {
    //   const history: AiChatMessageInput[] = [
    //     {
    //       role: 'system',
    //       content:
    //         'You are a caregiving resource assistant. Return ONLY JSON for a list of 2-3 resources. Each item must include title, summary, topic, link. Keep summaries under 140 chars.',
    //     },
    //     {
    //       role: 'user',
    //       content: `Question: ${cleaned}`,
    //     },
    //   ];

    //   const { data } = await aiChat({
    //     variables: {
    //       input: {
    //         messages: history,
    //         temperature: 0.3,
    //         provider: 'gemini',
    //       },
    //     },
    //   });

    //   const content = data?.aiChat?.content ?? '';
    //   const nextSuggestions = coerceAiResources(content, cleaned);
    //   if (!nextSuggestions.length) {
    //     throw new Error('AI response was empty or invalid.');
    //   }
    //   setAiSuggestions((prev) => [...nextSuggestions, ...prev].slice(0, 5));
    //   setAskValue('');
    // } catch (error: any) {
    //   setAiError(error?.message ?? 'Failed to load AI suggestions.');
    // } finally {
    //   setAiLoading(false);
    // }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Curated self and elderly care resources</Text>
        {/* <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} /> */}
      </View>

      <View style={[styles.askInputWrapper, isAskFocused && styles.askInputWrapperFocused]}>
        <TextInput
          value={askValue}
          onChangeText={setAskValue}
          placeholder="Ask AI helper any question"
          placeholderTextColor={colors.textSecondary}
          style={styles.askInput}
          returnKeyType="send"
          onSubmitEditing={handleAsk}
          onFocus={() => setIsAskFocused(true)}
          onBlur={() => setIsAskFocused(false)}
        />
        <TouchableOpacity style={styles.askSend} onPress={handleAsk} disabled={isAskDisabled}>
          <Image
            source={{ uri: arrowRight }}
            style={[styles.askSendIcon, isAskDisabled && styles.askSendIconDisabled]}
          />
        </TouchableOpacity>
      </View>

      {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}

      <Text style={styles.sectionTitle}>Topics</Text>
      <View style={styles.topicRow}>
        {visibleTopics.map((topic) => {
          const active = topic === selectedTopic;
          return (
            <TouchableOpacity
              key={topic}
              style={[styles.topicChip, active && styles.topicChipActive]}
              onPress={() => setSelectedTopic(topic)}
            >
              <Text style={[styles.topicText, active && styles.topicTextActive]}>{topic}</Text>
            </TouchableOpacity>
          );
        })}
        {hasHiddenTopics ? (
          <TouchableOpacity
            style={styles.moreOption}
            onPress={() => setShowAllTopics((prev) => !prev)}
          >
            <Text style={styles.moreOptionText}>{showAllTopics ? 'Less' : 'More'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* {aiSuggestions.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>AI suggestions</Text>
          {aiSuggestions.map((resource) => (
            <View key={resource.id} style={styles.card}>
              <Text style={styles.cardTitle}>{resource.title}</Text>
              <Text style={styles.cardSummary}>{resource.summary}</Text>
              <View style={styles.cardMetaContainer}>
                <Text style={styles.cardMeta}>{resource.topic}</Text>
              </View>
            </View>
          ))}
        </>
      ) : null} */}
      {filteredResources.map((resource) => (
        <View key={resource.id} style={styles.card}>
          <Text style={styles.cardTitle}>{resource.title}</Text>
          <Text style={styles.cardSummary}>{resource.summary}</Text>
          <View style={styles.cardMetaContainer}>
            <Text style={styles.cardMeta}>{resource.topic}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    backgroundColor: colors.base,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.headingSerif,
    // fontSize: 28,
    lineHeight: 38,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.body18Medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  askInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.base,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  askInputWrapperFocused: {
    borderColor: colors.cta,
    shadowColor: colors.cta,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  askInput: {
    flex: 1,
    ...typography.body16Regular,
    color: colors.textPrimary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  askSend: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.base,
  },
  askSendIcon: {
    width: 25,
    height: 25,
  },
  askSendIconDisabled: {
    opacity: 0.4,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  topicChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.chip,
    borderColor: colors.stroke,
    borderWidth: 1,
  },
  topicChipActive: {
    backgroundColor: colors.cta,
    borderColor: colors.cta,
  },
  topicText: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  topicTextActive: {
    color: colors.base,
  },
  moreOption: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },
  moreOptionText: {
    ...typography.body16Regular,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  cardTitle: {
    ...typography.body18Medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSummary: {
    ...typography.body16Regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  cardMetaContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.chip,
    borderColor: colors.stroke,
    borderWidth: 1,
  },
  errorText: {
    ...typography.body16Regular,
    color: colors.danger ?? '#B42318',
    marginBottom: spacing.sm,
  },
});

export default ResourcesScreen;
