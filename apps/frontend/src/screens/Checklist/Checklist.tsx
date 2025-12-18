import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useAuth } from '../../hooks/useAuth';
import Checkbox from '../../components/Checkbox/Checkbox';
import flower from '../../../assets/flower.svg';
import salad from '../../../assets/salad.svg';
import smile from '../../../assets/smile.svg';
import stethoscope from '../../../assets/stethoscope.svg';
import { colors, radii, spacing, typography } from '../../theme/designTokens';

// Dummy data for UI testing
const dummyPlan = {
  Daily: [
    {
      label: "Check in with parent's mood",
      key: 'dailyMood',
      resourceText: 'Read more about how to talk about emotions ↗︎',
      // Temporary resource link placeholder
      resourceLink: '/resources/emotions',
    },
    {
      label: 'Prepare healthy meals',
      key: 'dailyMeal',
      resourceText: 'Check out healthy recipes ↗︎',
      resourceLink: '/resources/meals',
    },
  ],
  Weekly: [
    {
      label: "Check in with parent's mood",
      key: 'weeklyMood',
      resourceText: 'Read more about how to talk about emotions ↗︎',
      resourceLink: '/resources/emotions',
    },
    {
      label: 'Prepare healthy meals',
      key: 'weeklyMeal',
      resourceText: 'Check out healthy recipes ↗︎',
      resourceLink: '/resources/meals',
    },
    {
      label: 'Make a self-care day',
      key: 'weeklySelfcare',
      resourceText:
        'Read more on how to spend a nice self-care day that will restore your evergy levels ↗︎',
      resourceLink: '/resources/self-care',
    },
  ],
  Monthly: [
    {
      label: 'Check up with professionals',
      key: 'monthlyCheckUp',
      resourceText: 'Trusted clinics in your area ↗︎',
      resourceLink: '/resources/clinic',
    },
    {
      label: 'Quality time together',
      key: 'monthlyTimeTogether',
      resourceText: 'Some ideas of quality time with your elderly parents ↗︎',
      resourceLink: '/resources/elderly-health',
    },
  ],
};

// Temporary emoji icons for UI testing
const dummyEmojis = [flower, salad, smile, stethoscope];

export default function ChecklistScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasUnread } = useUnreadNotifications();
  const { currentUser } = useAuth({});
  const [checklistData, setChecklistData] = useState(dummyPlan);
  const [checked, setChecked] = useState<Record<string, boolean>>({
    dailyMood: false,
    dailyMeal: false,
    weeklyMood: false,
    weeklyMeal: false,
    weeklySelfcare: false,
    weeklyTimeTogether: false,
    monthlyCheckUp: false,
    monthlyTimeTogether: false,
  });

  // Hydrate plan from onboarding flow or stored session data
  useEffect(() => {
    const planFromState = (location.state as any)?.plan;
    if (planFromState) {
      setChecklistData(planFromState);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('carePlan', JSON.stringify(planFromState));
      }
      return;
    }
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('carePlan');
      if (stored) {
        try {
          setChecklistData(JSON.parse(stored));
        } catch (err) {
          // ignore parse errors and keep default plan
        }
      }
    }
  }, [location.state]);

  const toggleChecked = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSignupToSave = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('carePlan', JSON.stringify(checklistData));
    }
    // push both state and query so navigation is reliable in web
    navigate('/login?mode=signup&from=/checklist', {
      state: { mode: 'signup', from: '/checklist' },
    });
  };

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2 + 80 }}
      >
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.titleStyle}>Your care action plan</Text>
            <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} />
          </View>

          {/* Render checklist UI using plan data */}
          {Object.entries(checklistData).map(([sectionName, items]) => (
            <View key={sectionName} style={styles.section}>
              <Text style={styles.sectionTitle}>{sectionName}</Text>

              {items.map((item, index) => (
                <View style={styles.checkboxContainer} key={item.key}>
                  <Checkbox
                    label={item.label}
                    checked={checked[item.key]}
                    onChange={() => toggleChecked(item.key)}
                    resourceText={item.resourceText}
                    onPressResource={() => navigate(item.resourceLink)}
                    emojiIcon={dummyEmojis[index % dummyEmojis.length]}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {!currentUser && (
        <View
          pointerEvents="box-none"
          style={[
            styles.ctaStickyContainer,
            Platform.OS === 'web' ? ({ position: 'fixed' } as any) : null,
          ]}
        >
          <View style={styles.ctaBlur as any}>
            <TouchableOpacity style={styles.ctaButton} onPress={handleSignupToSave}>
              <Text style={styles.ctaButtonText}>Sign up to save it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.base,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.base,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleStyle: {
    ...typography.headingSerif,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.body18Medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  section: {
    width: '100%',
  },
  ctaStickyContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 90,
    alignItems: 'center',
    zIndex: 150,
    paddingHorizontal: spacing.lg,
    pointerEvents: 'box-none',
  },
  ctaBlur: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    // @ts-expect-error web-only blur
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  ctaButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: radii.card,
    borderColor: colors.stroke,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaButtonText: {
    ...typography.body18Medium,
    color: colors.base,
  },
});
