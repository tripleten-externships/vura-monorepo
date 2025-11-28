import { View, StyleSheet } from 'react-native';
import NavigationIcons, { NavigationItem } from './NavigationIcons/NavigationIcons';

export function BottomNavBar() {
  const navigationItems: NavigationItem[] = [
    { id: 'onboording', label: 'Onboarding', route: '/onboarding' },
    { id: 'checklist', label: 'Checklist', route: '/checklist' },
    { id: 'resources', label: 'Resources', route: '/resources' },
    { id: 'community', label: 'Community', route: '/community' },
    { id: 'profile', label: 'Profile', route: '/profile' },
  ];

  return (
    <View style={styles.container}>
      <NavigationIcons items={navigationItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
});
