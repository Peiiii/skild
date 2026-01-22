import React from 'react';
import { Navigate } from 'react-router-dom';

export function SkillsetsPage(): JSX.Element {
  return <Navigate to="/skills?type=skillset" replace />;
}
