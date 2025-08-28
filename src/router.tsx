// src/router.tsx
import { createRouter, RootRoute, Route, Outlet } from '@tanstack/react-router';
import App from './App';
import { Library } from './components/pages/Library';
import { BookTOC } from './components/pages/BookTOC';
import { BookReader } from './components/pages/BookReader';

const rootRoute = new RootRoute({ component: App });
const libraryRoute = new Route({ 
  getParentRoute: () => rootRoute, 
  path: '/', 
  component: Library 
});

// This parent route now acts as a pure layout/grouping route.
// Its component is just an Outlet, which will render the matched child route.
const bookRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/books/$bookId',
  component: Outlet,
});

// The BookTOC component is now rendered by an "index" route.
// This will match when the URL is exactly /books/$bookId
const bookIndexRoute = new Route({
  getParentRoute: () => bookRoute,
  path: '/',
  component: BookTOC,
});

// The chapter route is now a sibling to the index route.
// Its path is relative to the parent.
const chapterRoute = new Route({
  getParentRoute: () => bookRoute,
  path: 'chapter/$chapterNumber',
  component: BookReader,
});

// The route tree is updated with the new, clearer structure.
const routeTree = rootRoute.addChildren([
  libraryRoute,
  bookRoute.addChildren([bookIndexRoute, chapterRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}