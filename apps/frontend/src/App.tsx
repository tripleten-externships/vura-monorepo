import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, ImageSourcePropType } from 'react-native';

import ChecklistScreen from './screens/Checklist/Checklist';
import ResourcesScreen from './screens/Resources/Resources';
import CommunityForumsScreen from './screens/CommunityForums/CommunityForums';
import ProfileScreen from './screens/Profile/Profile';

import checklistIcon from '../../assets/checklist.png';
import resourcesIcon from '../../assets/resources.png';
import communityIcon from '../../assets/community_forums.png';
import profileIcon from '../../assets/profile.png';

//Tab navigator instance
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    //manages the app's navigation state
    <NavigationContainer>
      <Tab.Navigator
        //shows where the app starts
        initialRouteName="Checklist"
        screenOptions={({ route }) => ({
          //define icons for each tab
          tabBarIcon: ({ focused, size }) => {
            let iconSource = checklistIcon; // default icon

            //chooses which icon is display based on rouute name
            if (route.name === 'Checklist') {
              iconSource = checklistIcon;
            } else if (route.name === 'Resources') {
              iconSource = resourcesIcon;
            } else if (route.name === 'Community') {
              iconSource = communityIcon;
            } else if (route.name === 'Profile') {
              iconSource = profileIcon;
            }

            //return the icon image
            return (
              <Image
                source={iconSource as ImageSourcePropType}
                style={{
                  width: size,
                  height: size,
                  tintColor: focused ? '#000' : '#3636368a', // black when active, gray when inactive
                }}
                resizeMode="contain"
              />
            );
          },
          //hides text label under the icons
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0.5,
            borderTopColor: '#E0E0E0',
            height: 70,
            paddingBottom: 10,
          },
        })}
      >
        <Tab.Screen name="Checklist" component={ChecklistScreen} />
        <Tab.Screen name="Resources" component={ResourcesScreen} />
        <Tab.Screen name="Community" component={CommunityForumsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
