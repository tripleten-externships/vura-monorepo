import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import Checkbox from '../../components/Checkbox/Checkbox';
import { Emoji } from '../../components/Emoji/Emoji';

const dummyPlan = {
  Daily: [
    {
      label: "Check in with parent's mood",
      key: 'dailyMood',
      resourceText: 'Read more about how to talk about emotions ↗︎',
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

export default function ChecklistScreen() {
  const navigate = useNavigate();
  const { hasUnread } = useUnreadNotifications();
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

  const toggleChecked = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.container}>
        <PageHeader
          title="Your care action plan"
          titleStyle={styles.titlestyle}
          rightIcon={{
            icon: (
              <NotificationBell hasUnread={hasUnread} onClick={() => navigate('/notifications')} />
            ),
          }}
        />
        {Object.entries(checklistData).map(([sectionName, items]) => (
          <View key={sectionName}>
            <Text style={styles.sectionTitle}>{sectionName}</Text>

            {items.map((item) => (
              <View style={styles.checkboxContainer} key={item.key}>
                <Checkbox
                  label={item.label}
                  checked={checked[item.key]}
                  onChange={() => toggleChecked(item.key)}
                  resourceText={item.resourceText}
                  onPressResource={() => navigate(item.resourceLink)}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  titleStyle: {
    fontFamily: 'Noto Serif',
    fontWeight: 400,
    fontSize: 34,
    textAlign: 'center',
    lineHeight: 44,
  },
  topIcon: {
    width: 100,
    height: 100,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: 'rgba(54, 54, 54, 0.5)',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 32,
  },
});
