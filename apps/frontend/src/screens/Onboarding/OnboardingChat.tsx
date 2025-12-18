import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { colors, radii, spacing, typography } from '../../theme/designTokens';
import sendArrow from '../../../assets/send-arrow.svg';
import { useMutation } from '@apollo/client/react';
import { AI_CHAT_MUTATION } from '../../graphql/mutations/ai';
import type { AiChatInput, AiChatMessageInput, AiChatMutation } from '../../__generated__/graphql';

type CarePlanSection = {
  label: string;
  key: string;
  resourceText?: string;
  resourceLink?: string;
};

type CarePlan = Record<'Daily' | 'Weekly' | 'Monthly', CarePlanSection[]>;

type Question = {
  id: keyof OnboardingAnswers;
  prompt: string;
};

type OnboardingAnswers = {
  age: string;
  parents: string;
  conditions: string;
  challenges: string;
};

type Message = {
  sender: 'bot' | 'user';
  text: string;
};

const questions: Question[] = [
  { id: 'age', prompt: 'How old are you?' },
  { id: 'parents', prompt: 'How many parents do you have to take care of?' },
  {
    id: 'conditions',
    prompt: 'Do they have any special conditions and/or needs?',
  },
  {
    id: 'challenges',
    prompt:
      'What are the challenges that you face in your everyday life? Maybe it’s balancing work and caregiving, or finding time for yourself?',
  },
];

function generateCarePlan(answers: OnboardingAnswers): CarePlan {
  const conditionNote =
    answers.conditions?.trim().length > 0 ? answers.conditions : 'their current needs';
  const challengeNote =
    answers.challenges?.trim().length > 0
      ? answers.challenges
      : 'balancing your time between work and caregiving';

  return {
    Daily: [
      {
        key: 'dailyCheckIn',
        label: `Check in on mood & energy (based on ${conditionNote})`,
        resourceText: 'How to have better daily check-ins ↗︎',
        resourceLink: '/resources/emotions',
      },
      {
        key: 'dailyHydration',
        label: 'Hydration & medication reminder',
        resourceText: 'Set up simple daily reminders ↗︎',
        resourceLink: '/resources/reminders',
      },
      {
        key: 'dailyYou',
        label: `10–15 min for you: stretch, walk, or deep breaths (${challengeNote})`,
        resourceText: 'Micro self-care ideas ↗︎',
        resourceLink: '/resources/self-care',
      },
    ],
    Weekly: [
      {
        key: 'weeklyMeals',
        label: 'Plan 3 balanced meals together',
        resourceText: 'Easy nutritious recipes ↗︎',
        resourceLink: '/resources/meals',
      },
      {
        key: 'weeklyConnect',
        label: 'Family call / social time to lower isolation',
        resourceText: 'Conversation starters for parents ↗︎',
        resourceLink: '/resources/community',
      },
      {
        key: 'weeklyYou',
        label: 'Block one recharge block for yourself',
        resourceText: 'Guide to protecting your time ↗︎',
        resourceLink: '/resources/boundaries',
      },
    ],
    Monthly: [
      {
        key: 'monthlyHealth',
        label: 'Review appointments, refills, and vitals',
        resourceText: 'Prep list for doctor visits ↗︎',
        resourceLink: '/resources/clinic',
      },
      {
        key: 'monthlyFun',
        label: 'Plan a joy activity together',
        resourceText: 'Ideas for memory-friendly activities ↗︎',
        resourceLink: '/resources/activities',
      },
      {
        key: 'monthlyReflect',
        label: 'Reflect on what worked and what was hard',
        resourceText: 'Monthly reflection template ↗︎',
        resourceLink: '/resources/reflect',
      },
    ],
  };
}

const OnboardingChat = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    age: '',
    parents: '',
    conditions: '',
    challenges: '',
  });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // const [aiError, setAiError] = useState<string | null>(null);
  const [aiChat] = useMutation<AiChatMutation, { input: AiChatInput }>(AI_CHAT_MUTATION);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    // Seed first bot message
    setMessages([{ sender: 'bot', text: questions[0].prompt }]);
  }, []);

  useEffect(() => {
    if (currentUser) {
      navigate('/checklist', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = () => {
    if (!input.trim() || !currentQuestion || aiLoading) return;

    const updatedAnswers = { ...answers, [currentQuestion.id]: input.trim() };
    setAnswers(updatedAnswers);

    const newMessages: Message[] = [
      { sender: 'user' as const, text: input.trim() },
      { sender: 'bot' as const, text: questions[currentQuestionIndex + 1]?.prompt ?? '' },
    ].filter((m): m is Message => Boolean(m.text));

    setMessages((prev) => [...prev, ...newMessages]);
    setInput('');

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      setCurrentQuestionIndex(questions.length);
      const generatedPlan = generateCarePlan(updatedAnswers);
      setPlan(generatedPlan);
      void requestAiPlan(updatedAnswers, generatedPlan);
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handleViewPlan = () => {
    if (!plan) return;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('carePlan', JSON.stringify(plan));
    }
    navigate('/care-plan', { state: { plan } });
  };

  const coerceCarePlan = (raw: any, fallback: CarePlan): CarePlan => {
    const normalize = (arr: any[], prefix: string) =>
      Array.isArray(arr)
        ? (arr
            .map((item, idx) => {
              if (typeof item === 'string') {
                return { key: `${prefix}${idx}`, label: item };
              }
              if (item && typeof item.label === 'string') {
                return {
                  key: item.key ?? `${prefix}${idx}`,
                  label: item.label,
                  resourceText: item.resourceText,
                };
              }
              return null;
            })
            .filter(Boolean) as CarePlanSection[])
        : [];

    const daily = normalize(raw?.daily ?? raw?.Daily, 'daily');
    const weekly = normalize(raw?.weekly ?? raw?.Weekly, 'weekly');
    const monthly = normalize(raw?.monthly ?? raw?.Monthly, 'monthly');

    if (!daily.length && !weekly.length && !monthly.length) return fallback;
    return {
      Daily: daily.length ? daily : fallback.Daily,
      Weekly: weekly.length ? weekly : fallback.Weekly,
      Monthly: monthly.length ? monthly : fallback.Monthly,
    };
  };

  const requestAiPlan = async (updatedAnswers: OnboardingAnswers, fallbackPlan: CarePlan) => {
    setAiLoading(true);
    // setAiError(null);
    const history: AiChatMessageInput[] = [
      {
        role: 'system',
        content:
          'You are a concise care-planning assistant. Given the user answers, return JSON with keys daily, weekly, monthly. Each is an array of short string action items (max 120 chars each). Do not include any extra text.',
      },
      ...messages.map<AiChatMessageInput>((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      {
        role: 'user',
        content: `Here are my answers: age=${updatedAnswers.age}, parents=${updatedAnswers.parents}, conditions=${updatedAnswers.conditions}, challenges=${updatedAnswers.challenges}. Please give a concise personal care plan.`,
      },
    ];
    try {
      const { data } = await aiChat({
        variables: {
          input: {
            messages: history,
            temperature: 0.4,
            provider: 'gemini',
          },
        },
      });
      if (data?.aiChat?.content) {
        let parsedPlan: CarePlan | null = null;
        try {
          const parsed = JSON.parse(data.aiChat.content);
          parsedPlan = coerceCarePlan(parsed, fallbackPlan);
          setPlan(parsedPlan);
        } catch {
          // fallback silently
          setPlan(fallbackPlan);
        }
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'I generated a care plan for you. Tap below to view it.',
          },
        ]);
      }
    } catch (err: any) {
      // setAiError(err?.message ?? 'AI failed to respond');
      setPlan(fallbackPlan);
    } finally {
      setAiLoading(false);
    }
  };

  const progress = useMemo(
    () => (currentQuestionIndex / questions.length) * 100,
    [currentQuestionIndex]
  );

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers({ age: '', parents: '', conditions: '', challenges: '' });
    setInput('');
    setPlan(null);
    setMessages([{ sender: 'bot', text: questions[0].prompt }]);
  };

  const showPrev = currentQuestionIndex > 0 && !plan;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {showPrev ? (
          <TouchableOpacity onPress={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}>
            <Text style={styles.backText}>Previous question</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <Text style={styles.title}>Vura onboarding</Text>
        <Text style={styles.subtitle}>Quick chat to tailor your care plan</Text>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message, idx) => (
          <View
            key={`${message.sender}-${idx}`}
            style={[
              styles.messageBubble,
              message.sender === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            {/* {message.sender === 'bot' && !plan && currentQuestionIndex < questions.length && (
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.whyText}>Why we ask this</Text>
              </TouchableOpacity>
            )} */}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRestart}>
          <Text style={styles.secondaryButtonText}>Restart questionnaire</Text>
        </TouchableOpacity>
        {plan ? (
          <TouchableOpacity
            style={[styles.primaryButton, aiLoading && styles.sendButtonDisabled]}
            onPress={handleViewPlan}
            disabled={aiLoading}
          >
            <Text style={styles.primaryButtonText}>Generate plan</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your answer"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={!input.trim()}
            >
              <Image
                source={{ uri: sendArrow }}
                style={[
                  styles.sendIcon,
                  !input.trim() ? styles.sendIconIdle : styles.sendIconActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.body18Medium,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  subtitle: {
    ...typography.body16Regular,
    color: colors.textSecondary,
  },
  progressBarOuter: {
    height: 6,
    backgroundColor: colors.stroke,
    borderRadius: 999,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: 6,
    backgroundColor: colors.cta,
  },
  backText: {
    ...typography.body16Regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  messages: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexGrow: 1,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: radii.card,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  userBubble: {
    backgroundColor: colors.base,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  messageText: {
    ...typography.body16Regular,
    color: colors.textPrimary,
  },
  whyText: {
    ...typography.body16Regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    gap: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.base,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.body18Medium,
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingBottom: spacing.xs,
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: radii.card,
    padding: spacing.md,
    paddingRight: spacing.xl * 2,
    color: colors.textPrimary,
    backgroundColor: colors.base,
  },
  sendButton: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    transform: [{ translateY: -21 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: colors.base,
    ...typography.body18Medium,
  },
  sendIcon: {
    width: 18,
    height: 18,
  },
  sendIconIdle: {
    tintColor: colors.textSecondary,
  },
  sendIconActive: {
    tintColor: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.cta,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.base,
    ...typography.body18Medium,
  },
});

export default OnboardingChat;
