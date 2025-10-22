import React from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';

import { baseRoutes } from './routers';

import './app.scss';

function App() {
    const renderRoutes = (routes: any[]) => {
        return routes.map(route => {
            const Element = route.element;
            if (route.children && route.children.length) {
                return (
                    <Route
                        key={route.path || 'root'}
                        path={route.path}
                        element={
                            <React.Suspense fallback={<div />}>
                                <Element />
                            </React.Suspense>
                        }
                    >
                        {route.children.map((child: any) => {
                            const ChildElement = child.element;
                            return (
                                <Route
                                    index={child.index}
                                    key={child.path || 'index'}
                                    path={child.path}
                                    element={
                                        <React.Suspense fallback={<div />}>
                                            <ChildElement />
                                        </React.Suspense>
                                    }
                                />
                            );
                        })}
                    </Route>
                );
            }

            return (
                <Route
                    key={route.path}
                    path={route.path}
                    element={
                        <React.Suspense fallback={<div />}>
                            <Element />
                        </React.Suspense>
                    }
                />
            );
        });
    };

    return (
        <BrowserRouter basename={'/'}>
            <Routes>{renderRoutes(baseRoutes)}</Routes>
        </BrowserRouter>
    );
}

export default App;
