import NavigationIcons, { NavigationItem } from './NavigationIcons/NavigationIcons';
import checklistImg from '../public/checklist.png';
import resourcesImg from '../public/resources.png';
import communityImg from '../public/community_forums.png';
import profileImg from '../public/profile.png';

export function BottomNavBar() {
  const navigationItems: NavigationItem[] = [
    {
      id: 'checklist',
      icon: { uri: checklistImg },
      route: '/checklist',
    },
    {
      id: 'resources',
      icon: { uri: resourcesImg },
      route: '/resources',
    },
    {
      id: 'community',
      icon: { uri: communityImg },
      route: '/community',
    },
    {
      id: 'profile',
      icon: { uri: profileImg },
      route: '/profile',
    },
  ];

  return <NavigationIcons items={navigationItems} />;
}
