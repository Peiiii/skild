import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './ui/AppLayout';
import { SignupPage } from './ui/pages/SignupPage';
import { TokenNewPage } from './ui/pages/TokenNewPage';
import { PublishPage } from './ui/pages/PublishPage';
import { SkillsPage } from './ui/pages/SkillsPage';
import { SkillsetsPage } from './ui/pages/SkillsetsPage';
import { SkillDetailPage } from './ui/pages/SkillDetailPage';
import { SkillManagePage } from './ui/pages/SkillManagePage';
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
import { LinkedItemManagePage } from './ui/pages/LinkedItemManagePage';
import { LeaderboardPage } from './ui/pages/LeaderboardPage';
import { GettingStartedPage } from './ui/pages/GettingStartedPage';
import { CatalogPage } from './ui/pages/CatalogPage';
import { CatalogDetailPage } from './ui/pages/CatalogDetailPage';
import { CatalogCategoryPage } from './ui/pages/CatalogCategoryPage';

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
      { path: 'getting-started', element: <GettingStartedPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'skillsets', element: <SkillsetsPage /> },
      { path: 'skills/:scope/:skill', element: <SkillDetailPage /> },
      { path: 'skills/:scope/:skill/manage', element: <RequireAuth><SkillManagePage /></RequireAuth> },
      { path: 'linked', element: <LinkedItemsPage /> },
      { path: 'linked/new', element: <RequireAuth><LinkedItemNewPage /></RequireAuth> },
      { path: 'linked/:id', element: <LinkedItemDetailPage /> },
      { path: 'linked/:id/manage', element: <RequireAuth><LinkedItemManagePage /></RequireAuth> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'catalog/category/:slug', element: <CatalogCategoryPage /> },
      { path: 'catalog/:id', element: <CatalogDetailPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'me', element: <RequireAuth><MePage /></RequireAuth> },
      { path: 'me/tokens', element: <RequireAuth><TokensPage /></RequireAuth> },
      { path: 'me/skills', element: <RequireAuth><MySkillsPage /></RequireAuth> },
      { path: 'me/settings', element: <RequireAuth><SettingsPage /></RequireAuth> }
    ]
  }
]);
