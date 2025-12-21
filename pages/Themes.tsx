
import React from 'react';
import { Navigate } from 'react-router-dom';

// Theme settings have been removed. Redirecting to home.
export const Themes: React.FC = () => {
  return <Navigate to="/" replace />;
};
