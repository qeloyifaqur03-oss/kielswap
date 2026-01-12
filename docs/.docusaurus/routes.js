import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '32d'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '0b3'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '7ef'),
            routes: [
              {
                path: '/access-control',
                component: ComponentCreator('/access-control', 'd4d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/badges',
                component: ComponentCreator('/badges', '246'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/changelog',
                component: ComponentCreator('/changelog', '51d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/deadlines',
                component: ComponentCreator('/deadlines', '634'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/design-philosophy',
                component: ComponentCreator('/design-philosophy', 'bff'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/execution-lifecycle',
                component: ComponentCreator('/execution-lifecycle', 'f79'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/execution-quality',
                component: ComponentCreator('/execution-quality', 'c4c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/failure-modes',
                component: ComponentCreator('/failure-modes', '2e6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/fallback',
                component: ComponentCreator('/fallback', '7c1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/faq',
                component: ComponentCreator('/faq', 'cc1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/intents',
                component: ComponentCreator('/intents', 'd2b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/introduction',
                component: ComponentCreator('/introduction', '2c4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/mev',
                component: ComponentCreator('/mev', '496'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/outcome-first',
                component: ComponentCreator('/outcome-first', '519'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/pricing',
                component: ComponentCreator('/pricing', '27a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/roadmap',
                component: ComponentCreator('/roadmap', '044'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/security',
                component: ComponentCreator('/security', '4fa'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tracking',
                component: ComponentCreator('/tracking', 'd54'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
