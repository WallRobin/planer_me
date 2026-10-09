import { useEffect, useState } from 'react';

export type Route =
  | { name: 'heute' }
  | { name: 'aufgaben' }
  | { name: 'ziele' }
  | { name: 'ziel'; id: string }
  | { name: 'einstellungen' };

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  switch (parts[0]) {
    case 'aufgaben':
      return { name: 'aufgaben' };
    case 'ziele':
      return parts[1] ? { name: 'ziel', id: decodeURIComponent(parts[1]) } : { name: 'ziele' };
    case 'einstellungen':
      return { name: 'einstellungen' };
    default:
      return { name: 'heute' };
  }
}

export function href(route: Route): string {
  return route.name === 'ziel' ? `#/ziele/${encodeURIComponent(route.id)}` : `#/${route.name}`;
}

export function navigate(route: Route) {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
