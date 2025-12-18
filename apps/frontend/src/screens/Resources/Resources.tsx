import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
// import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
// import { useUnreadNotifications `} from '../../hooks/useUnreadNotifications';
import { useNavigate } from 'react-router-dom';
import { colors, radii, spacing, typography } from '../../theme/designTokens';
import arrowRight from '../../../assets/arrow_right.svg';

type Resource = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  link: string;
};

const topics = [
  'All',
  'Care basics',
  'Medication',
  'Nutrition',
  'Memory care',
  'Self-care',
  'Community',
];

const baseResources: Resource[] = [
  {
    id: '1',
    title: 'Medication reminders that actually work',
    summary: 'Simple steps to keep track of doses and avoid missed refills.',
    topic: 'Medication',
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
    topic: 'Memory care',
    link: 'https://example.com/memory-activities',
  },
  {
    id: '4',
    title: 'Protecting your own energy as a caregiver',
    summary: 'Micro self-care moments you can layer into a busy day.',
    topic: 'Self-care',
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
  // const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [askValue, setAskValue] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<Resource[]>([
    {
      id: 'ai-1',
      title: 'How to balance work and caregiving',
      summary: 'Create a weekly cadence and block micro-breaks that recharge you.',
      topic: 'Self-care',
      link: '#',
    },
  ]);

  const filteredResources = useMemo(() => {
    if (selectedTopic === 'All') return baseResources;
    return baseResources.filter((resource) => resource.topic === selectedTopic);
  }, [selectedTopic]);

  const handleAsk = () => {
    const cleaned = askValue.trim();
    if (!cleaned) return;
    const suggestion: Resource = {
      id: `ai-${Date.now()}`,
      title: cleaned,
      summary: 'Here are a few steps and links tailored to your question.',
      topic: 'AI suggestion',
      link: '#',
    };
    setAiSuggestions((prev) => [suggestion, ...prev].slice(0, 5));
    setAskValue('');
  };

  useEffect(() => {
    console.log('aiSuggestions', aiSuggestions);
  }, [aiSuggestions]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Curated self and elderly care resources</Text>
        {/* <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} /> */}
      </View>

      <View style={styles.askInputWrapper}>
        <TextInput
          value={askValue}
          onChangeText={setAskValue}
          placeholder="Ask AI helper, any question"
          placeholderTextColor={colors.textSecondary}
          style={styles.askInput}
          returnKeyType="send"
          onSubmitEditing={handleAsk}
        />
        <TouchableOpacity style={styles.askSend} onPress={handleAsk}>
          <Image source={{ uri: arrowRight }} style={{ width: 25, height: 25 }} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Topics</Text>
      <View style={styles.topicRow}>
        {topics.map((topic) => {
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
        <TouchableOpacity style={styles.topicChip}>
          <Text style={styles.topicText}>More</Text>
        </TouchableOpacity>
      </View>

      {filteredResources.map((resource) => (
        <View key={resource.id} style={styles.card}>
          <Text style={styles.cardTitle}>{resource.title}</Text>
          <Text style={styles.cardSummary}>{resource.summary}</Text>
          <Text style={styles.cardMeta}>{resource.topic}</Text>
        </View>
      ))}
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
  askInput: {
    flex: 1,
    ...typography.body16Regular,
    color: colors.textPrimary,
  },
  askSend: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.base,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  topicChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    borderColor: colors.stroke,
    borderWidth: 1,
  },
  topicChipActive: {
    backgroundColor: colors.cta,
    borderColor: colors.cta,
  },
  topicText: {
    ...typography.body16Regular,
    color: colors.textPrimary,
  },
  topicTextActive: {
    color: colors.base,
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
});

export default ResourcesScreen;
