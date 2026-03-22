// Router — hash-based routing

const routes = {};
let navigateCallback = null;

function parseHash() {
  const hash = window.location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  return {
    route: parts[0],
    param: parts[1] || null,
  };
}

function handleRoute() {
  const { route, param } = parseHash();
  const handler = routes[route] || routes['home'];
  if (handler) {
    handler(param);
  }
  if (navigateCallback) {
    navigateCallback(route, param);
  }
}

export function init() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function registerRoute(name, handler) {
  routes[name] = handler;
}

export function navigate(route) {
  window.location.hash = route;
}

export function getCurrentRoute() {
  return parseHash();
}

export function setNavigateCallback(fn) {
  navigateCallback = fn;
}
