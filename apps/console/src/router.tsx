import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './ui/AppLayout';
import { SignupPage } from './ui/pages/SignupPage';
import { TokenNewPage } from './ui/pages/TokenNewPage';
import { PublishPage } from './ui/pages/PublishPage';
import { SkillsPage } from './ui/pages/SkillsPage';
import { SkillDetailPage } from './ui/pages/SkillDetailPage';
import { VerifyEmailPage } from './ui/pages/VerifyEmailPage';
import { VerifyEmailRequestPage } from './ui/pages/VerifyEmailRequestPage';
import { HomePage } from './ui/pages/HomePage';
import { LoginPage } from './ui/pages/LoginPage';
import { MePage } from './ui/pages/MePage';
import { TokensPage } from './ui/pages/TokensPage';
import { MySkillsPage } from './ui/pages/MySkillsPage';
import { SettingsPage } from './ui/pages/SettingsPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { LinkedItemsPage } from './ui/pages/LinkedItemsPage';
import { LinkedItemDetailPage } from './ui/pages/LinkedItemDetailPage';
import { LinkedItemNewPage } from './ui/pages/LinkedItemNewPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'token/new', element: <Navigate to="/me/tokens" replace /> },
      { path: 'token/new/legacy', element: <TokenNewPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'verify-email/request', element: <VerifyEmailRequestPage /> },
      { path: 'publish', element: <PublishPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'skills/:scope/:skill', element: <SkillDetailPage /> },
      { path: 'linked', element: <LinkedItemsPage /> },
      { path: 'linked/new', element: <RequireAuth><LinkedItemNewPage /></RequireAuth> },
      { path: 'linked/:id', element: <LinkedItemDetailPage /> },
      { path: 'me', element: <RequireAuth><MePage /></RequireAuth> },
      { path: 'me/tokens', element: <RequireAuth><TokensPage /></RequireAuth> },
      { path: 'me/skills', element: <RequireAuth><MySkillsPage /></RequireAuth> },
      { path: 'me/settings', element: <RequireAuth><SettingsPage /></RequireAuth> }
    ]
  }
]);
