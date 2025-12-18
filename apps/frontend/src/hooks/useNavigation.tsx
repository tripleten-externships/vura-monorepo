import { useNavigate } from 'react-router';

export function useNavigation() {
  const navigate = useNavigate();

  return {
    push: (route: string, state?: any) => {
      navigate(route, { state });
    },
  };
}
