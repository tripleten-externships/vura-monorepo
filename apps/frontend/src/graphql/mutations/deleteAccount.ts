import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

export const DELETE_ACCOUNT: TypedDocumentNode<
  { customDeleteAccount: { success: boolean; message: string } },
  {}
> = gql`
  mutation DeleteAccount {
    customDeleteAccount {
      success
      message
    }
  }
`;
