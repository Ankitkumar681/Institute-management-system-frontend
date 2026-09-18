import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Pulls the clean context schema block

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed strictly within an active AuthProvider container.');
  }
  return context;
};
