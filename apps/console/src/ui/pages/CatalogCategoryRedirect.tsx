import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export function CatalogCategoryRedirect(): JSX.Element {
  const params = useParams();
  const slug = params.slug ? encodeURIComponent(params.slug) : '';
  const to = slug ? `/skills?category=${slug}` : '/skills';
  return <Navigate to={to} replace />;
}
