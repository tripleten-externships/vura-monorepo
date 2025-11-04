import { useNavigate } from 'react-router-dom';

export function useNavigation() {
  const navigate = useNavigate();

  return {
    push: (route: string) => {
      navigate(route);
    },
  };
}
