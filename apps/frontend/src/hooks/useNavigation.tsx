import { useNavigate } from 'react-router';

export function useNavigation() {
  const navigate = useNavigate();

  return {
    push: (route: string) => {
      navigate(route);
    },
  };
}
