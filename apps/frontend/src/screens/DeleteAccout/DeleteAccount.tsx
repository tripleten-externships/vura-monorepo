import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useMutation } from '@apollo/client/react';
import { DELETE_ACCOUNT } from '../../graphql/mutations/index';
import { useNavigate } from 'react-router-dom';
import Checkbox from '../../components/Checkbox/Checkbox';

interface DeleteAccountProps {
  currentEmail?: string;
}

export default function DeleteAccount({ currentEmail }: DeleteAccountProps) {
  const auth = useAuth({});
  const [typedEmail, setTypedEmail] = useState('');
  const [checked, setChecked] = useState(false);
  //   const [debouncedName, setDebouncedName] = useState('');
  const navigate = useNavigate();

  // delete the user account and navigate to start page
  const [deleteAccount, { loading }] = useMutation(DELETE_ACCOUNT, {
    onCompleted: async (data) => {
      await auth.logout();
      navigate('/get-started');
    },
  });

  //delete the user account if name is typed correctly and checkbox is checked
  const handleDelete = () => {
    if (typedEmail === currentEmail && checked) {
      deleteAccount({ variables: { email: currentEmail } });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Delete Account</Text>

      <Text style={styles.instruction}>
        Please type in the email associated with your account to confirm.
      </Text>
      <TextInput
        value={typedEmail}
        onChangeText={setTypedEmail}
        placeholder="Type in your email"
        placeholderTextColor="#36363680"
        style={styles.input}
      />

      <View style={styles.checkboxContainer}>
        <Checkbox
          label="I understand this action cannot be undone."
          checked={checked}
          onChange={setChecked}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Pressable onPress={() => navigate(-1 as any)} style={styles.cancelButton}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={typedEmail !== currentEmail || !checked}
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.7 : 1 },
            (typedEmail !== currentEmail || !checked) && { backgroundColor: '#F12D2D99' },
          ]}
        >
          <Text style={styles.buttonText}>{loading ? 'Deleting...' : 'Delete'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  instruction: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
    marginVertical: 12,
    color: '#000000',
  },
  checkboxContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#F12D2D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
