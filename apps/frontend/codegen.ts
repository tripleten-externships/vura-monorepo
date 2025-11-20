import { CodegenConfig } from '@graphql-codegen/cli';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localSchemaPath = path.resolve(__dirname, '../backend/schema.graphql');

const schemaSource = process.env.CODEGEN_SCHEMA_URL ?? localSchemaPath;

const config: CodegenConfig = {
  schema: schemaSource,
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
