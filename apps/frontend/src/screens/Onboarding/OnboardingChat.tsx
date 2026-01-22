import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { AiChatMessageInput } from '../../__generated__/graphql';
import { ChatMessage, TypingIndicator, streamAiChatContent } from '../sharedChat';

type CarePlanSection = {
  label: string;
  key: string;
  resourceText?: string;
  resourceLink?: string;
};

type CarePlan = Record<'Daily' | 'Weekly' | 'Monthly', CarePlanSection[]>;

type OnboardingAnswer = {
  question: string;
  answer: string;
};

const expectedQuestions = [
  "Hi! This is your Vura AI assistant. Let's go over some basic information to help build your care plan. First of all, how old are you?",
  'How many parents do you have to take care of?',
  'Do they have any special conditions and/or needs?',
  "What are the challenges that you face in your everyday life? Maybe it's balancing work and caregiving, or finding time for yourself?",
];

const fallbackPlan: CarePlan = {
  Daily: [
    {
      key: 'dailyCheckIn',
      label: 'Check in on mood & energy',
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
      label: '10–15 min for you: stretch, walk, or deep breaths',
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

const limitCarePlanItems = (plan: CarePlan, maxItems = 4): CarePlan => ({
  Daily: plan.Daily.slice(0, maxItems),
  Weekly: plan.Weekly.slice(0, maxItems),
  Monthly: plan.Monthly.slice(0, maxItems),
});

const extractJsonArray = (content: string, key: string): string | null => {
  const keyMatch = new RegExp(`"${key}"\\s*:`, 'i').exec(content);
  if (!keyMatch || keyMatch.index === undefined) return null;
  const startFrom = keyMatch.index + keyMatch[0].length;
  const openIndex = content.indexOf('[', startFrom);
  if (openIndex === -1) return null;
  let depth = 0;
  for (let i = openIndex; i < content.length; i += 1) {
    const char = content[i];
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    if (depth === 0) {
      return content.slice(openIndex, i + 1);
    }
  }
  return null;
};

const parseCarePlanFromContent = (content: string): Record<string, unknown> | null => {
  const cleaned = content
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonSlice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(jsonSlice);
  } catch {
    const daily = extractJsonArray(cleaned, 'daily');
    const weekly = extractJsonArray(cleaned, 'weekly');
    const monthly = extractJsonArray(cleaned, 'monthly');
    if (!daily && !weekly && !monthly) return null;
    const parsed: Record<string, unknown> = {};
    try {
      if (daily) parsed.daily = JSON.parse(daily);
      if (weekly) parsed.weekly = JSON.parse(weekly);
      if (monthly) parsed.monthly = JSON.parse(monthly);
    } catch {
      return null;
    }
    return parsed;
  }
};

const hasAllCarePlanSections = (
  plan: Record<string, unknown> | null
): plan is Record<string, unknown> => {
  if (!plan) return false;
  return ['daily', 'weekly', 'monthly'].every((key) => Array.isArray((plan as any)[key]));
};

const mergeCarePlanSections = (
  base: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> => ({
  daily: Array.isArray((incoming as any).daily) ? (incoming as any).daily : (base as any).daily,
  weekly: Array.isArray((incoming as any).weekly) ? (incoming as any).weekly : (base as any).weekly,
  monthly: Array.isArray((incoming as any).monthly)
    ? (incoming as any).monthly
    : (base as any).monthly,
});

const OnboardingChat = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth({});
  const totalSteps = 4;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    void requestNextQuestion(0, []);
  }, []);

  useEffect(() => {
    if (currentUser) {
      navigate('/checklist', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async () => {
    if (!input.trim() || !currentQuestion || aiLoading) return;

    const trimmed = input.trim();
    const updatedAnswers = [...answers, { question: currentQuestion, answer: trimmed }];
    setAnswers(updatedAnswers);
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');

    const nextStep = currentStep + 1;
    if (nextStep >= totalSteps) {
      setCurrentStep(nextStep);
      setCurrentQuestion(null);
      await requestAiPlan(updatedAnswers);
    } else {
      setCurrentStep(nextStep);
      await requestNextQuestion(nextStep, updatedAnswers);
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

  const requestAiPlan = async (updatedAnswers: OnboardingAnswer[]) => {
    setAiLoading(true);
    const qaSummary = updatedAnswers
      .map((item, idx) => `${idx + 1}. Q: ${item.question}\nA: ${item.answer}`)
      .join('\n');
    const systemPrompt =
      'You are a concise care-planning assistant. Given the user answers, return a complete JSON object with keys daily, weekly, monthly. ' +
      'Each value is an array of short string action items (max 120 chars each). ' +
      'Return ONLY JSON (no markdown, no code fences, no extra text).';
    const history: AiChatMessageInput[] = [
      {
        role: 'user',
        content: `Here are my answers:\n${qaSummary}\nPlease give a concise personal care plan.`,
      },
    ];
    try {
      const content = await streamAiChatContent({
        messages: history,
        systemPrompt,
        temperature: 0.4,
        maxTokens: 1600,
        provider: 'gemini',
      });
      if (content) {
        const parsed = parseCarePlanFromContent(content);
        let mergedPlan: Record<string, unknown> | null = parsed;

        if (parsed && !hasAllCarePlanSections(parsed)) {
          const missingKeys = ['daily', 'weekly', 'monthly'].filter(
            (key) => !Array.isArray((parsed as any)[key])
          );
          const followUpPrompt =
            'Return ONLY JSON with the missing sections for the care plan. ' +
            `Only include these keys: ${missingKeys.join(', ')}. ` +
            'Each value is an array of short string action items (max 120 chars).';
          const followUpHistory: AiChatMessageInput[] = [
            {
              role: 'user',
              content:
                `Here are my answers:\n${qaSummary}\n` +
                `The previous response was missing sections: ${missingKeys.join(', ')}.`,
            },
          ];
          const followUpContent = await streamAiChatContent({
            messages: followUpHistory,
            systemPrompt: followUpPrompt,
            temperature: 0.4,
            maxTokens: 800,
            provider: 'gemini',
          });
          const followUpParsed = parseCarePlanFromContent(followUpContent);
          if (parsed && followUpParsed) {
            mergedPlan = mergeCarePlanSections(parsed, followUpParsed);
          }
        }

        if (mergedPlan) {
          const parsedPlan = coerceCarePlan(mergedPlan, fallbackPlan);
          setPlan(limitCarePlanItems(parsedPlan));
        } else {
          setPlan(limitCarePlanItems(fallbackPlan));
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'I now have enough information to generate a personal care plan for you now based on your answers.',
          },
        ]);
      }
    } catch (_err: any) {
      setPlan(fallbackPlan);
    } finally {
      setAiLoading(false);
    }
  };

  const requestNextQuestion = async (stepIndex: number, updatedAnswers: OnboardingAnswer[]) => {
    if (stepIndex >= totalSteps) return;
    setAiLoading(true);
    const qaSummary = updatedAnswers
      .map((item, idx) => `${idx + 1}. Q: ${item.question}\nA: ${item.answer}`)
      .join('\n');
    const expectedQuestion = expectedQuestions[stepIndex] ?? expectedQuestions[0];
    const systemPrompt =
      'You are a warm, human-like, conversational onboarding assistant for late-teens and young adults who are caregivers to sick or elderly parents. ' +
      'Respond to what the user shared in 1-2 short sentences, then ask the next question. ' +
      'Always include the exact required question text for this step in your response. ' +
      'Do not include the onboarding step number in your response. ' +
      'If the user has not provided enough information, ask a follow-up question to get more information before you consider the current step complete. ' +
      'If the user has provided enough information, ask the next question.';
    const history: AiChatMessageInput[] = [
      {
        role: 'user',
        content:
          `Current onboarding step: ${stepIndex + 1} of ${totalSteps}. Never include the onboarding step number in your response. ` +
          `\nYou must include this exact question text in your response: "${expectedQuestion}"` +
          (qaSummary ? `\nPrevious answers:\n${qaSummary}` : ''),
      },
    ];
    try {
      const content = (
        await streamAiChatContent({
          messages: history,
          systemPrompt,
          temperature: 0.4,
          maxTokens: 300,
          provider: 'gemini',
        })
      ).trim();
      let nextQuestion = '';
      let followUpText = '';
      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (typeof parsed?.question === 'string') {
            nextQuestion = parsed.question.trim();
          }
        } catch {
          // if model didn't return json, extract the expected question and treat the rest as follow-up
          if (content.includes(expectedQuestion)) {
            followUpText = content.replace(expectedQuestion, '').trim();
            nextQuestion = expectedQuestion;
          } else {
            nextQuestion = content.trim();
          }
        }
      }
      if (!nextQuestion || nextQuestion !== expectedQuestion) {
        nextQuestion = expectedQuestion;
      }
      if (!nextQuestion) {
        throw new Error('AI did not return a valid question.');
      }
      setCurrentQuestion(nextQuestion);
      setMessages((prev) => [
        ...prev,
        ...(followUpText ? [{ sender: 'bot' as const, text: followUpText }] : []),
        { sender: 'bot', text: nextQuestion },
      ]);
    } catch {
      setCurrentQuestion('Can you share a bit more about your caregiving situation?');
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Can you share a bit more about your caregiving situation?' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep, totalSteps]);

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setInput('');
    setPlan(null);
    setMessages([]);
    void requestNextQuestion(0, []);
  };

  const showPrev = false;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View />
        <Text style={styles.title}></Text>
        <Text style={styles.subtitle}></Text>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
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
        {aiLoading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <TypingIndicator />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {plan ? (
          <>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRestart}>
              <Text style={styles.secondaryButtonText}>Restart questionnaire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, aiLoading && styles.sendButtonDisabled]}
              onPress={handleViewPlan}
              disabled={aiLoading}
            >
              <Text style={styles.primaryButtonText}>Generate plan</Text>
            </TouchableOpacity>
          </>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
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
