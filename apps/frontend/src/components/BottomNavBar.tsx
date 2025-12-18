import { View, StyleSheet } from 'react-native';
import NavigationIcons, { NavigationItem } from './NavigationIcons/NavigationIcons';
import { ViewStyle } from 'react-native';

export function BottomNavBar() {
  const navigationItems: NavigationItem[] = [
    { id: 'checklist', label: 'Checklist', route: '/checklist', icon: 'list-checks.svg' },
    { id: 'resources', label: 'Resources', route: '/resources', icon: 'book-open-check.svg' },
    { id: 'community', label: 'Community', route: '/community', icon: 'message-circle-heart.svg' },
    { id: 'profile', label: 'Profile', route: '/profile', icon: 'circle-user.svg' },
  ];

  const containerStyle = [styles.container, { position: 'fixed' } as unknown as ViewStyle];
  return (
    <View style={containerStyle}>
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
    bottom: 0,
    left: 0,
    zIndex: 100,
    paddingVertical: 8,
  },
});
