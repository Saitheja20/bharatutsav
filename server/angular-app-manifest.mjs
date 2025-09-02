
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://Saitheja20.github.io/bharatutsav/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/bharatutsav/login",
    "route": "/bharatutsav"
  },
  {
    "renderMode": 2,
    "route": "/bharatutsav/login"
  },
  {
    "renderMode": 2,
    "route": "/bharatutsav/dashboard"
  },
  {
    "renderMode": 2,
    "route": "/bharatutsav/transactions"
  },
  {
    "renderMode": 2,
    "route": "/bharatutsav/members"
  },
  {
    "renderMode": 2,
    "redirectTo": "/bharatutsav/login",
    "route": "/bharatutsav/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 7383, hash: '16e47d8e4c24a3322ce0d20e3be123646959721255e0254ba875c28f4e6c0af4', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 3025, hash: '5baf778627554457b9e36c10dc2cde0c870c6247956466399c42403bb6884419', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'login/index.html': {size: 17382, hash: '237a2a9d8cbd87d394b67a44748bcab6efa6d2bb15a0e17ed34c2552c354256c', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'transactions/index.html': {size: 17382, hash: '237a2a9d8cbd87d394b67a44748bcab6efa6d2bb15a0e17ed34c2552c354256c', text: () => import('./assets-chunks/transactions_index_html.mjs').then(m => m.default)},
    'members/index.html': {size: 17382, hash: '237a2a9d8cbd87d394b67a44748bcab6efa6d2bb15a0e17ed34c2552c354256c', text: () => import('./assets-chunks/members_index_html.mjs').then(m => m.default)},
    'dashboard/index.html': {size: 17382, hash: '237a2a9d8cbd87d394b67a44748bcab6efa6d2bb15a0e17ed34c2552c354256c', text: () => import('./assets-chunks/dashboard_index_html.mjs').then(m => m.default)},
    'styles-X4X5L32H.css': {size: 304944, hash: 'joMheGM2sHY', text: () => import('./assets-chunks/styles-X4X5L32H_css.mjs').then(m => m.default)}
  },
};
