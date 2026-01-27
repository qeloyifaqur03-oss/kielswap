import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Overview',
      items: [
        'introduction',
        'design-philosophy',
      ],
    },
    {
      type: 'category',
      label: 'Model',
      items: [
        'outcome-first',
        'intents',
        'execution-lifecycle',
        'deadlines',
      ],
    },
    {
      type: 'category',
      label: 'Pricing & Quality',
      items: [
        'pricing',
        'execution-quality',
      ],
    },
    {
      type: 'category',
      label: 'Execution',
      items: [
        'mev',
        'fallback',
        'tracking',
      ],
    },
    {
      type: 'category',
      label: 'Program',
      items: [
        'access-control',
        'badges',
      ],
    },
    {
      type: 'category',
      label: 'Trust',
      items: [
        'security',
        'failure-modes',
      ],
    },
    {
      type: 'category',
      label: 'Product',
      items: [
        'roadmap',
        'faq',
        'changelog',
      ],
    },
  ],
};

export default sidebars;
