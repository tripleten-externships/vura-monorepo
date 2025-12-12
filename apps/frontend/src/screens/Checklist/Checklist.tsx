import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import Checkbox from '../../components/Checkbox/Checkbox';
import { Emoji } from '../../components/Emoji/Emoji';

export default function ChecklistScreen() {
  const navigate = useNavigate();
  const { hasUnread } = useUnreadNotifications();
  const [dailyMoodChecked, setDailyMoodChecked] = useState(false);
  const [dailyMealChecked, setDailyMealChecked] = useState(false);
  const [weeklyMoodChecked, setWeeklyMoodChecked] = useState(false);
  const [weeklyMealChecked, setweeklyMealChecked] = useState(false);
  return (
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
      <Text style={styles.sectionTitle}>Daily</Text>
      <View style={styles.checkboxContainer}>
        <Checkbox
          label="Check in with parent's mood"
          checked={dailyMoodChecked}
          onChange={setDailyMoodChecked}
        />

        <Image source={{ uri: '../../../assets/flower.svg' }} />
      </View>
      <View style={styles.checkboxContainer}>
        <Checkbox
          label="prepare healthy meals"
          checked={dailyMealChecked}
          onChange={setDailyMealChecked}
        />

        <Image source={{ uri: '../../../assets/flower.svg' }} />
      </View>
      <Text style={styles.sectionTitle}>Weekly</Text>
      <View style={styles.checkboxContainer}>
        <Checkbox
          label="Check in with parent's mood"
          checked={weeklyMoodChecked}
          onChange={setWeeklyMoodChecked}
        />

        <Image source={{ uri: '../../../assets/flower.svg' }} />
      </View>
      <View style={styles.checkboxContainer}>
        <Checkbox
          label="prepare healthy meals"
          checked={weeklyMealChecked}
          onChange={setweeklyMealChecked}
        />

        <Image source={{ uri: '../../../assets/flower.svg' }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
