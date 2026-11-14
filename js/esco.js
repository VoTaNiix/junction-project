// Curated subset of the ESCO skills pillar (v1.2), grouped into the domains Skillink's
// Espoo pilot covers. Labels follow ESCO preferred terms where one exists.
// Tags are chosen by hosts and self-declared by solvers. Never inferred, never ranked.

export const DOMAINS = [
  'Software engineering',
  'Green tech & energy',
  'AI & data',
  'Hardware & IoT',
  'Service design',
  'Built environment & circularity',
  'Research & innovation',
  'B2B operations',
];

export const ESCO_SKILLS = [
  // Software engineering
  { id: 'sw-dev-methods', label: 'use software design patterns', domain: 'Software engineering' },
  { id: 'sw-test', label: 'execute software tests', domain: 'Software engineering' },
  { id: 'sw-cloud', label: 'deploy cloud resources', domain: 'Software engineering' },
  { id: 'sw-api', label: 'design application interfaces', domain: 'Software engineering' },
  { id: 'sw-debug', label: 'debug software', domain: 'Software engineering' },
  { id: 'sw-security', label: 'apply ICT security policies', domain: 'Software engineering' },
  { id: 'sw-devops', label: 'use continuous integration tools', domain: 'Software engineering' },
  { id: 'sw-embedded', label: 'embedded systems programming', domain: 'Software engineering' },

  // Green tech & energy
  { id: 'gt-smartgrid', label: 'smart grids systems', domain: 'Green tech & energy' },
  { id: 'gt-renewables', label: 'renewable energy technologies', domain: 'Green tech & energy' },
  { id: 'gt-energy-eff', label: 'energy efficiency', domain: 'Green tech & energy' },
  { id: 'gt-storage', label: 'energy storage systems', domain: 'Green tech & energy' },
  { id: 'gt-lca', label: 'conduct life cycle assessment', domain: 'Green tech & energy' },
  { id: 'gt-demand', label: 'forecast energy demand', domain: 'Green tech & energy' },

  // AI & data
  { id: 'ai-ml', label: 'machine learning', domain: 'AI & data' },
  { id: 'ai-stats', label: 'apply statistical analysis techniques', domain: 'AI & data' },
  { id: 'ai-dataviz', label: 'deliver visual presentation of data', domain: 'AI & data' },
  { id: 'ai-dataquality', label: 'manage data quality', domain: 'AI & data' },
  { id: 'ai-sensor-fusion', label: 'sensor fusion', domain: 'AI & data' },
  { id: 'ai-cv', label: 'computer vision', domain: 'AI & data' },
  { id: 'ai-timeseries', label: 'time series analysis', domain: 'AI & data' },
  { id: 'ai-ethics', label: 'apply ethics of AI', domain: 'AI & data' },

  // Hardware & IoT
  { id: 'hw-iot', label: 'Internet of Things', domain: 'Hardware & IoT' },
  { id: 'hw-sensors', label: 'sensors', domain: 'Hardware & IoT' },
  { id: 'hw-edge', label: 'edge computing', domain: 'Hardware & IoT' },
  { id: 'hw-reliability', label: 'perform reliability analysis', domain: 'Hardware & IoT' },
  { id: 'hw-industrial', label: 'industrial automation', domain: 'Hardware & IoT' },
  { id: 'hw-quantum', label: 'quantum computing', domain: 'Hardware & IoT' },
  { id: 'hw-lidar', label: 'lidar and radar systems', domain: 'Hardware & IoT' },
  { id: 'hw-microelectronics', label: 'microelectronics', domain: 'Hardware & IoT' },
  { id: 'hw-cryo', label: 'cryogenics', domain: 'Hardware & IoT' },
  { id: 'hw-thermal', label: 'perform thermal analysis', domain: 'Hardware & IoT' },
  { id: 'hw-anomaly', label: 'perform anomaly detection', domain: 'Hardware & IoT' },

  // Service design
  { id: 'sd-user-research', label: 'conduct user research', domain: 'Service design' },
  { id: 'sd-ux', label: 'design user experience', domain: 'Service design' },
  { id: 'sd-accessibility', label: 'apply digital accessibility standards', domain: 'Service design' },
  { id: 'sd-journey', label: 'map customer journeys', domain: 'Service design' },
  { id: 'sd-copy', label: 'write plain-language content', domain: 'Service design' },
  { id: 'sd-public', label: 'design public services', domain: 'Service design' },
  { id: 'sd-multilingual', label: 'localise content for multiple languages', domain: 'Service design' },

  // Built environment & circularity
  { id: 'ce-circular', label: 'circular economy', domain: 'Built environment & circularity' },
  { id: 'ce-materials', label: 'construction products', domain: 'Built environment & circularity' },
  { id: 'ce-trace', label: 'implement traceability systems', domain: 'Built environment & circularity' },
  { id: 'ce-bim', label: 'building information modelling', domain: 'Built environment & circularity' },

  // Research & innovation
  { id: 'rd-research', label: 'perform scientific research', domain: 'Research & innovation' },
  { id: 'rd-experiments', label: 'design scientific experiments', domain: 'Research & innovation' },
  { id: 'rd-proposals', label: 'write research proposals', domain: 'Research & innovation' },
  { id: 'rd-prototype', label: 'develop prototypes', domain: 'Research & innovation' },

  // B2B operations
  { id: 'b2b-onboarding', label: 'manage customer onboarding', domain: 'B2B operations' },
  { id: 'b2b-success', label: 'manage customer relationships', domain: 'B2B operations' },
  { id: 'b2b-gtm', label: 'develop go-to-market strategy', domain: 'B2B operations' },
  { id: 'b2b-ip', label: 'manage intellectual property rights', domain: 'B2B operations' },
  { id: 'b2b-funding', label: 'apply for research funding', domain: 'B2B operations' },
  { id: 'b2b-process', label: 'improve business processes', domain: 'B2B operations' },
  { id: 'b2b-negotiate', label: 'negotiate with stakeholders', domain: 'B2B operations' },
];

const byId = new Map(ESCO_SKILLS.map((s) => [s.id, s]));

export function skill(id) {
  return byId.get(id) || { id, label: id, domain: 'Other' };
}

export function searchSkills(query, exclude = []) {
  const q = query.trim().toLowerCase();
  return ESCO_SKILLS.filter(
    (s) =>
      !exclude.includes(s.id) &&
      (!q || s.label.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q)),
  );
}
