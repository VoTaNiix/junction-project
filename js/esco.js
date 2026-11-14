// Curated subset of the ESCO skills pillar (v1.2), grouped into the domains Skillink's
// Espoo pilot covers. English labels follow ESCO preferred terms where one exists.
// Finnish and Swedish labels are working translations for the prototype: check them against
// the official ESCO FI/SV preferred terms before production.
// Tags are chosen by hosts and self-declared by solvers. Never inferred, never ranked.
import { tr } from './i18n.js';

const DOMAIN_NAMES = {
  'Software engineering': { fi: 'Ohjelmistokehitys', sv: 'Programvaruutveckling' },
  'Green tech & energy': { fi: 'Vihreä teknologia ja energia', sv: 'Grön teknik och energi' },
  'AI & data': { fi: 'Tekoäly ja data', sv: 'AI och data' },
  'Hardware & IoT': { fi: 'Laitteet ja IoT', sv: 'Hårdvara och IoT' },
  'Service design': { fi: 'Palvelumuotoilu', sv: 'Tjänstedesign' },
  'Built environment & circularity': { fi: 'Rakennettu ympäristö ja kiertotalous', sv: 'Byggd miljö och cirkularitet' },
  'Research & innovation': { fi: 'Tutkimus ja innovaatiot', sv: 'Forskning och innovation' },
  'B2B operations': { fi: 'B2B-toiminnot', sv: 'B2B-verksamhet' },
};

export const DOMAINS = Object.keys(DOMAIN_NAMES);

export function domainLabel(d) {
  const n = DOMAIN_NAMES[d];
  return n ? tr({ en: d, fi: n.fi, sv: n.sv }) : d;
}

// [id, English, Finnish, Swedish, domain]
const RAW = [
  ['sw-dev-methods', 'use software design patterns', 'käyttää ohjelmistojen suunnittelumalleja', 'använda designmönster för programvara', 'Software engineering'],
  ['sw-test', 'execute software tests', 'suorittaa ohjelmistotestejä', 'utföra programvarutester', 'Software engineering'],
  ['sw-cloud', 'deploy cloud resources', 'ottaa käyttöön pilviresursseja', 'driftsätta molnresurser', 'Software engineering'],
  ['sw-api', 'design application interfaces', 'suunnitella sovellusrajapintoja', 'utforma applikationsgränssnitt', 'Software engineering'],
  ['sw-debug', 'debug software', 'korjata ohjelmistovirheitä', 'felsöka programvara', 'Software engineering'],
  ['sw-security', 'apply ICT security policies', 'soveltaa tietoturvaperiaatteita', 'tillämpa IKT-säkerhetspolicyer', 'Software engineering'],
  ['sw-devops', 'use continuous integration tools', 'käyttää jatkuvan integraation työkaluja', 'använda verktyg för kontinuerlig integration', 'Software engineering'],
  ['sw-embedded', 'embedded systems programming', 'sulautettujen järjestelmien ohjelmointi', 'programmering av inbyggda system', 'Software engineering'],

  ['gt-smartgrid', 'smart grids systems', 'älykkäät sähköverkot', 'smarta elnät', 'Green tech & energy'],
  ['gt-renewables', 'renewable energy technologies', 'uusiutuvan energian teknologiat', 'teknik för förnybar energi', 'Green tech & energy'],
  ['gt-energy-eff', 'energy efficiency', 'energiatehokkuus', 'energieffektivitet', 'Green tech & energy'],
  ['gt-storage', 'energy storage systems', 'energian varastointijärjestelmät', 'energilagringssystem', 'Green tech & energy'],
  ['gt-lca', 'conduct life cycle assessment', 'tehdä elinkaariarviointi', 'genomföra livscykelanalys', 'Green tech & energy'],
  ['gt-demand', 'forecast energy demand', 'ennustaa energian kysyntää', 'prognostisera energiebehov', 'Green tech & energy'],

  ['ai-ml', 'machine learning', 'koneoppiminen', 'maskininlärning', 'AI & data'],
  ['ai-stats', 'apply statistical analysis techniques', 'soveltaa tilastollisia analyysimenetelmiä', 'tillämpa statistiska analysmetoder', 'AI & data'],
  ['ai-dataviz', 'deliver visual presentation of data', 'esittää dataa visuaalisesti', 'presentera data visuellt', 'AI & data'],
  ['ai-dataquality', 'manage data quality', 'hallita datan laatua', 'hantera datakvalitet', 'AI & data'],
  ['ai-sensor-fusion', 'sensor fusion', 'sensorifuusio', 'sensorfusion', 'AI & data'],
  ['ai-cv', 'computer vision', 'konenäkö', 'datorseende', 'AI & data'],
  ['ai-timeseries', 'time series analysis', 'aikasarja-analyysi', 'tidsserieanalys', 'AI & data'],
  ['ai-ethics', 'apply ethics of AI', 'soveltaa tekoälyn etiikkaa', 'tillämpa AI-etik', 'AI & data'],

  ['hw-iot', 'Internet of Things', 'esineiden internet', 'sakernas internet', 'Hardware & IoT'],
  ['hw-sensors', 'sensors', 'anturit', 'sensorer', 'Hardware & IoT'],
  ['hw-edge', 'edge computing', 'reunalaskenta', 'edge computing', 'Hardware & IoT'],
  ['hw-reliability', 'perform reliability analysis', 'tehdä luotettavuusanalyysi', 'utföra tillförlitlighetsanalys', 'Hardware & IoT'],
  ['hw-industrial', 'industrial automation', 'teollisuusautomaatio', 'industriell automation', 'Hardware & IoT'],
  ['hw-quantum', 'quantum computing', 'kvanttilaskenta', 'kvantberäkning', 'Hardware & IoT'],
  ['hw-lidar', 'lidar and radar systems', 'lidar- ja tutkajärjestelmät', 'lidar- och radarsystem', 'Hardware & IoT'],
  ['hw-microelectronics', 'microelectronics', 'mikroelektroniikka', 'mikroelektronik', 'Hardware & IoT'],
  ['hw-cryo', 'cryogenics', 'kryogeniikka', 'kryoteknik', 'Hardware & IoT'],
  ['hw-thermal', 'perform thermal analysis', 'tehdä lämpöanalyysi', 'utföra termisk analys', 'Hardware & IoT'],
  ['hw-anomaly', 'perform anomaly detection', 'tunnistaa poikkeamia', 'utföra avvikelsedetektering', 'Hardware & IoT'],

  ['sd-user-research', 'conduct user research', 'tehdä käyttäjätutkimusta', 'genomföra användarundersökningar', 'Service design'],
  ['sd-ux', 'design user experience', 'suunnitella käyttäjäkokemusta', 'utforma användarupplevelse', 'Service design'],
  ['sd-accessibility', 'apply digital accessibility standards', 'soveltaa digitaalisen saavutettavuuden standardeja', 'tillämpa standarder för digital tillgänglighet', 'Service design'],
  ['sd-journey', 'map customer journeys', 'kartoittaa asiakaspolkuja', 'kartlägga kundresor', 'Service design'],
  ['sd-copy', 'write plain-language content', 'kirjoittaa selkokielistä sisältöä', 'skriva innehåll på klarspråk', 'Service design'],
  ['sd-public', 'design public services', 'suunnitella julkisia palveluja', 'utforma offentliga tjänster', 'Service design'],
  ['sd-multilingual', 'localise content for multiple languages', 'lokalisoida sisältöä useille kielille', 'lokalisera innehåll för flera språk', 'Service design'],

  ['ce-circular', 'circular economy', 'kiertotalous', 'cirkulär ekonomi', 'Built environment & circularity'],
  ['ce-materials', 'construction products', 'rakennustuotteet', 'byggprodukter', 'Built environment & circularity'],
  ['ce-trace', 'implement traceability systems', 'ottaa käyttöön jäljitettävyysjärjestelmiä', 'införa spårbarhetssystem', 'Built environment & circularity'],
  ['ce-bim', 'building information modelling', 'tietomallintaminen (BIM)', 'byggnadsinformationsmodellering (BIM)', 'Built environment & circularity'],

  ['rd-research', 'perform scientific research', 'tehdä tieteellistä tutkimusta', 'bedriva vetenskaplig forskning', 'Research & innovation'],
  ['rd-experiments', 'design scientific experiments', 'suunnitella tieteellisiä kokeita', 'utforma vetenskapliga experiment', 'Research & innovation'],
  ['rd-proposals', 'write research proposals', 'kirjoittaa tutkimusehdotuksia', 'skriva forskningsansökningar', 'Research & innovation'],
  ['rd-prototype', 'develop prototypes', 'kehittää prototyyppejä', 'utveckla prototyper', 'Research & innovation'],

  ['b2b-onboarding', 'manage customer onboarding', 'hallita asiakkaiden käyttöönottoa', 'hantera kundintroduktion', 'B2B operations'],
  ['b2b-success', 'manage customer relationships', 'hoitaa asiakassuhteita', 'hantera kundrelationer', 'B2B operations'],
  ['b2b-gtm', 'develop go-to-market strategy', 'kehittää markkinoilletulostrategiaa', 'utveckla marknadsstrategi', 'B2B operations'],
  ['b2b-ip', 'manage intellectual property rights', 'hallita immateriaalioikeuksia', 'hantera immateriella rättigheter', 'B2B operations'],
  ['b2b-funding', 'apply for research funding', 'hakea tutkimusrahoitusta', 'söka forskningsfinansiering', 'B2B operations'],
  ['b2b-process', 'improve business processes', 'kehittää liiketoimintaprosesseja', 'förbättra affärsprocesser', 'B2B operations'],
  ['b2b-negotiate', 'negotiate with stakeholders', 'neuvotella sidosryhmien kanssa', 'förhandla med intressenter', 'B2B operations'],
];

export const ESCO_SKILLS = RAW.map(([id, en, fi, sv, domain]) => ({
  id,
  domain,
  get label() {
    return tr({ en, fi, sv });
  },
  /** All three labels, so search works whatever language the visitor types in. */
  all: `${en} ${fi} ${sv}`.toLowerCase(),
}));

const byId = new Map(ESCO_SKILLS.map((s) => [s.id, s]));

export function skill(id) {
  return byId.get(id) || { id, label: id, domain: 'Other', all: String(id).toLowerCase() };
}

export function searchSkills(query, exclude = []) {
  const q = query.trim().toLowerCase();
  return ESCO_SKILLS.filter(
    (s) => !exclude.includes(s.id) && (!q || s.all.includes(q) || domainLabel(s.domain).toLowerCase().includes(q) || s.domain.toLowerCase().includes(q)),
  );
}
