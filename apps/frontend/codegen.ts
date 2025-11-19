import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: process.env.VITE_API_URL
    ? `${process.env.VITE_API_URL}/api/graphql`
    : 'http://localhost:3001/api/graphql',
  // this assumes that all your source files are in a top-level `src/` directory
  documents: ['src/**/*.{ts,tsx}', '!src/store/ExampleUsage.tsx'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
