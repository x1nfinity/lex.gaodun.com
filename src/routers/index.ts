import React from 'react';

const baseRoutes = [
    {
        path: '/',
        element: React.lazy(() => import('@/pages')),
    },
];

export { baseRoutes };
