import { gql } from '@apollo/client';

export const SIGNUP_MUTATION = gql`
  mutation Signup(
    $email: email_String_NotNull_format_email!
    $password: password_String_NotNull_minLength_8_maxLength_128!
    $name: name_String_NotNull_minLength_2_maxLength_120!
  ) {
    signup(input: { email: $email, password: $password, name: $name }) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login(
    $email: email_String_NotNull_format_email!
    $password: password_String_NotNull_minLength_8_maxLength_128!
  ) {
    login(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;
