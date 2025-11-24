import { ToggleButton } from '../../components/ToggleButton/ToggleButton';
import { Avatar } from '../../components/Avatar/Avatar';
import { GET_USER_PROFILE } from '../../graphql';
import { GetUserProfileQuery } from '../../__generated__/graphql';
import React, { useState } from 'react';
import { BottomNavBar } from '../../components/BottomNavBar';
import { useAuth } from '../../hooks/useAuth';
import { Text, View, StyleSheet, Pressable, Image } from 'react-native';
import { useQuery } from '@apollo/client/react';

const ProfileScreen = () => {
  const { currentUser } = useAuth({});
  const { data, loading, error } = useQuery<GetUserProfileQuery>(GET_USER_PROFILE);
  const [privacyToggle, setPrivacyToggle] = useState(false);

  const profile = data?.userProfile;

  if (!currentUser) {
    return <Text>You must log in to view your profile.</Text>;
  }

  if (loading) {
    return <Text>Loading profile....</Text>;
  }
  if (error) {
    return <Text>Error loading profile</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <View>
        <Avatar size="lg"></Avatar>
        <Image
          source={require('../../../assets/pencil_icon.png')}
          style={styles.headerPencilIcon}
        />
        <Text style={styles.headerName}>{profile?.name}</Text>
        <Text style={styles.headerEmail}>{profile?.email}</Text>
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Hide my avatar, and display my name as initials</Text>
        <ToggleButton value={privacyToggle} onValueChange={setPrivacyToggle} />
      </View>

      <View style={styles.profileDataContainer}>
        <View style={styles.profileDataRow}>
          <View style={styles.profileDataTextColumn}>
            <Text style={styles.profileDataLabel}>Name</Text>
            <Text style={styles.profileDataUserInfo}> {profile?.name}</Text>
          </View>
          <Pressable onPress={() => console.log('TODO: editable icon')}>
            <Image
              source={require('../../../assets/pencil_icon.png')}
              style={styles.profileDataPencilIcon}
            />
          </Pressable>
        </View>
        <View style={styles.profileDataRow}>
          <View style={styles.profileDataTextColumn}>
            <Text style={styles.profileDataLabel}>Age</Text>
            <Text style={styles.profileDataUserInfo}> {profile?.age}</Text>
          </View>
          <Pressable onPress={() => console.log('TODO: editable icon')}>
            <Image
              source={require('../../../assets/pencil_icon.png')}
              style={styles.profileDataPencilIcon}
            />
          </Pressable>
        </View>
        <View style={styles.profileDataRow}>
          <View style={styles.profileDataTextColumn}>
            <Text style={styles.profileDataLabel}>Gender</Text>
            <Text style={styles.profileDataUserInfo}> {profile?.gender}</Text>
          </View>
          <View style={styles.profileDataRow}>
            <View style={styles.profileDataTextColumn}>
              <Text style={styles.profileDataLabel}>Email</Text>
              <Text style={styles.profileDataUserInfo}> {profile?.email}</Text>
            </View>
            <Pressable onPress={() => console.log('TODO: editable icon')}>
              <Image
                source={require('../../../assets/pencil_icon.png')}
                style={styles.profileDataPencilIcon}
              />
            </Pressable>
          </View>
          <Pressable onPress={() => console.log('TODO: editable icon')}>
            <Image
              source={require('../../../assets/pencil_icon.png')}
              style={styles.profileDataPencilIcon}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.footerLinks}>
        <Pressable onPress={() => console.log('TODO: Link to privacy policy')}>
          <Text style={styles.footerLinkPrivacy}>Privacy Policy</Text>
        </Pressable>
        ={' '}
        <Pressable onPress={() => console.log('TODO: logout handler')}>
          <Text style={styles.footerLinkLogout}>Logout</Text>
        </Pressable>
        <Pressable onPress={() => console.log('TODO: delete account handler')}>
          <Text style={styles.footerLinkDelete}>Delete Account</Text>
        </Pressable>
      </View>
      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: {
    fontSize: 16,
    lineHeight: 20,
    color: '#363636',
  },
  headerName: {
    fontSize: 20,
    lineHeight: 1.2,
    color: '#363636',
  },
  headerEmail: {
    fontSize: 16,
    lineHeight: 20,
    color: '#363636',
    opacity: 0.5,
  },
  headerPencilIcon: {
    height: 16,
    width: 16,
  },
  toggleContainer: {
    backgroundColor: '#F6F4FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    height: 70,
    width: 345,
  },
  toggleText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#363636',
  },
  profileDataContainer: {},
  profileDataRow: {},
  profileDataTextColumn: {},
  profileDataLabel: {},
  profileDataUserInfo: {},
  profileDataPencilIcon: {
    height: 16,
    width: 16,
  },

  footerLinks: {},
  footerLinkPrivacy: {
    fontSize: 18,
    lineHeight: 20,
    color: '#363636',
    opacity: 0.5,
  },
  footerLinkLogout: {
    fontSize: 18,
    lineHeight: 20,
    color: '#F12D2D',
  },
  footerLinkDelete: {
    fontSize: 18,
    lineHeight: 20,
    color: '#F12D2D',
  },
});

export default ProfileScreen;
