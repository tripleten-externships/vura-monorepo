import React from 'react';

// `useMutation` types are exported via the Apollo React hooks entry in some setups.
// Importing from the specific hooks path avoids TypeScript resolution issues.
import { useMutation } from '@apollo/client/react/hooks';
import { USER_LOGIN } from '../graphql/mutations/users';
import { setGraphqlHeaders } from '../store/apolloClient';

import { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { data, loading, error }] = useMutation(USER_LOGIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ variables: { input: { email, password } } });

    const auth = result.data?.loginFrontendUser;

    if (auth?.token || auth?.jwt) {
      // Prefer the first available token for downstream auth headers.
      await setGraphqlHeaders(auth.token ?? auth.jwt);
      console.log('Logged in successfully!');
    } else {
      console.error('Login failed: missing auth token', auth);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data?.loginFrontendUser?.user && <p>Welcome {data.loginFrontendUser.user.name}</p>}
    </form>
  );
}
