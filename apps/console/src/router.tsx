import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './ui/AppLayout';
import { SignupPage } from './ui/pages/SignupPage';
import { TokenNewPage } from './ui/pages/TokenNewPage';
import { PublishPage } from './ui/pages/PublishPage';
import { SkillsPage } from './ui/pages/SkillsPage';
import { SkillDetailPage } from './ui/pages/SkillDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/skills" replace /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'token/new', element: <TokenNewPage /> },
      { path: 'publish', element: <PublishPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'skills/:scope/:skill', element: <SkillDetailPage /> }
    ]
  }
]);

