// Synthetic Espoo ecosystem for the Skillink demo. All companies and people are fictional.
// No demographic data of any kind is stored (see .claude/skills/eu-ai-act-compliance).

const EVENT_DATE = '2026-11-26';
const TZ = '+02:00'; // Finland, EET in November

function slotsFor(companyId, table) {
  const times = [
    ['09:30', '09:55'],
    ['10:30', '10:55'],
    ['13:00', '13:25'],
    ['14:00', '14:25'],
  ];
  return times.map(([s, e], i) => ({
    id: `sl-${companyId.slice(2)}-${i + 1}`,
    companyId,
    start: `${EVENT_DATE}T${s}:00${TZ}`,
    end: `${EVENT_DATE}T${e}:00${TZ}`,
    location: `Dipoli, Otaniemi, conversation table ${table}`,
  }));
}

export function buildSeed() {
  const companies = [
    { id: 'c-lumi', name: 'Lumivirta Energy', sector: 'Energy', recruiter: 'Katja Salmi', recruiterEmail: 'katja.salmi@lumivirta.example.com' },
    { id: 'c-sillat', name: 'Sillat Digital', sector: 'Public sector', recruiter: 'Joonas Aalto', recruiterEmail: 'joonas@sillat.example.com' },
    { id: 'c-kesto', name: 'Kestomo Industrial', sector: 'Manufacturing', recruiter: 'Riikka Mäkelä', recruiterEmail: 'riikka.makela@kestomo.example.com' },
    { id: 'c-qubit', name: 'Qubitti Labs', sector: 'Deep tech', recruiter: 'Ville Rantanen', recruiterEmail: 'ville@qubitti.example.com' },
    { id: 'c-tukki', name: 'Tukki Software', sector: 'SaaS', recruiter: 'Maria Holm', recruiterEmail: 'maria.holm@tukki.example.com' },
    { id: 'c-revon', name: 'Revontuli Mobility', sector: 'Mobility', recruiter: 'Anton Lehto', recruiterEmail: 'anton.lehto@revontuli.example.com' },
  ];

  const challenges = [
    {
      id: 'ch-1',
      companyId: 'c-lumi',
      title: 'Keep a neighbourhood microgrid stable when everyone charges at 17:30',
      context:
        'We run a pilot microgrid in Kera, Espoo: 400 homes, rooftop solar and a 2 MWh shared battery. On most days it works. On cold, still, cloudy evenings, electric cars plug in at the same time, the battery is already low and we import expensive peak power from the grid.',
      tricky:
        'Our demand forecast is accurate on average and wrong on exactly the days that matter. Every extra battery cycle shortens its life, and residents have only agreed to flexible charging on a voluntary basis.',
      escoTags: ['gt-smartgrid', 'gt-storage', 'gt-demand', 'ai-timeseries', 'gt-energy-eff'],
      language: 'English is fine',
      industry: 'Energy',
      deadline: '2026-11-22',
      createdAt: '2026-11-03T09:00:00+02:00',
      coWritten: false,
    },
    {
      id: 'ch-2',
      companyId: 'c-sillat',
      title: 'Make a city permit form work for someone in their third week in Finland',
      context:
        'We build digital services for Uusimaa municipalities. Our building and residence-related permit forms are available in Finnish, Swedish and English, yet newcomers abandon them at twice the rate of other residents and call the service desk instead.',
      tricky:
        'Legal terms like "kotikunta" have no clean translation, every text change needs legal review, and the forms must meet WCAG 2.2 AA for screen-reader users in all three languages.',
      escoTags: ['sd-ux', 'sd-multilingual', 'sd-accessibility', 'sd-copy', 'sd-public'],
      language: 'Finnish or English',
      industry: 'Public sector',
      deadline: '2026-11-23',
      createdAt: '2026-11-03T14:00:00+02:00',
      coWritten: true,
    },
    {
      id: 'ch-3',
      companyId: 'c-kesto',
      title: 'Our edge gateways go silent at −25 °C and nobody notices for hours',
      context:
        'Kestomo retrofits sensors onto paper-mill and sawmill equipment. Each site has 10–40 edge gateways that pre-process vibration data. In winter, some outdoor gateways stop reporting and we only find out the next morning.',
      tricky:
        "We cannot reproduce it in the office, the gateways run a customer-approved firmware image we can't change freely, and the sites are a four-hour drive away.",
      escoTags: ['hw-iot', 'hw-edge', 'hw-reliability', 'sw-embedded', 'hw-industrial'],
      language: 'Finnish B1+ required, English for team syncs',
      industry: 'Manufacturing',
      deadline: '2026-11-21',
      createdAt: '2026-11-04T10:00:00+02:00',
      coWritten: false,
    },
    {
      id: 'ch-4',
      companyId: 'c-qubit',
      title: 'Who would pay for access to a 50-qubit system in 2027, and why?',
      context:
        'We are a spin-out from Otaniemi research with a working superconducting prototype. The physics is ahead of our business: we have research partners, but no clear first paying customer segment.',
      tricky:
        "Most 'quantum use cases' online are marketing. We need a segment with a real problem, a budget this year and the patience to co-develop with a 30-person company.",
      escoTags: ['hw-quantum', 'b2b-gtm', 'b2b-ip', 'b2b-funding', 'b2b-negotiate'],
      language: 'English is fine',
      industry: 'Deep tech',
      deadline: '2026-11-24',
      createdAt: '2026-11-04T15:30:00+02:00',
      coWritten: false,
    },
    {
      id: 'ch-5',
      companyId: 'c-tukki',
      title: 'Half our new customers stop logging in after week two',
      context:
        'Tukki makes scheduling software for Nordic home-care providers. Sales are growing, but around half of new customer accounts go quiet after the second week, and renewals suffer a year later.',
      tricky:
        'Our dashboards show where people stop, not why. Customers range from three-person family businesses to large wellbeing services counties, and many work in Swedish.',
      escoTags: ['b2b-onboarding', 'b2b-success', 'sd-journey', 'ai-dataviz', 'ai-stats'],
      language: 'Swedish & English',
      industry: 'SaaS',
      deadline: '2026-11-23',
      createdAt: '2026-11-05T11:00:00+02:00',
      coWritten: true,
    },
    {
      id: 'ch-6',
      companyId: 'c-revon',
      title: "Our shuttle's lidar sees ghosts in wet snow",
      context:
        'Revontuli runs a low-speed autonomous shuttle between Tapiola and Otaniemi. In wet snow, the lidar reports phantom obstacles, the shuttle brakes, and passengers get frustrated. Dry snow is fine.',
      tricky:
        'Filtering too much is a safety risk; filtering too little makes the service unusable. Labelled winter data is scarce, and the radar and camera disagree in different ways.',
      escoTags: ['ai-sensor-fusion', 'hw-lidar', 'ai-cv', 'ai-ml', 'sw-test'],
      language: 'English is fine',
      industry: 'Mobility',
      deadline: '2026-11-22',
      createdAt: '2026-11-05T16:00:00+02:00',
      coWritten: false,
    },
  ];

  // Participants: a pseudonym plus the minimum contact data needed to meet.
  // Name and email are revealed to a company only after a mutual meeting acceptance.
  const participants = [
    { id: 'p-4821', pseudo: 'ESP-4821', name: 'Sam Virtanen', email: 'sam.virtanen@example.com' },
    { id: 'p-2093', pseudo: 'ESP-2093', name: 'Lauri Nieminen', email: 'lauri.n@example.com' },
    { id: 'p-7356', pseudo: 'ESP-7356', name: 'Elsa Lindqvist', email: 'elsa.lindqvist@example.com' },
    { id: 'p-1168', pseudo: 'ESP-1168', name: 'Daniel Okafor', email: 'd.okafor@example.com' },
    { id: 'p-5540', pseudo: 'ESP-5540', name: 'Hanna Korhonen', email: 'hanna.korhonen@example.com' },
    { id: 'p-3307', pseudo: 'ESP-3307', name: 'Oskar Byström', email: 'oskar.bystrom@example.com' },
    { id: 'p-6612', pseudo: 'ESP-6612', name: 'Priya Raman', email: 'priya.r@example.com' },
    { id: 'p-8875', pseudo: 'ESP-8875', name: 'Tomás Ferreira', email: 'tomas.ferreira@example.com' },
    { id: 'p-9214', pseudo: 'ESP-9214', name: 'Aino Heikkinen', email: 'aino.heikkinen@example.com' },
  ];

  const submissions = [
    {
      id: 's-1', challengeId: 'ch-1', participantId: 'p-2093', lang: 'fi', format: 'bullets', status: 'submitted',
      submittedAt: '2026-11-10T08:42:00+02:00', skills: ['gt-demand', 'ai-timeseries', 'gt-storage'],
      answers: {
        first: '- Kävisin läpi viime talven 15 minuutin mittausdatan ja etsisin päivät, jolloin ennuste meni eniten pieleen.\n- Merkitsisin ne säätietoihin: pakkanen, tyyni, pilvinen.\n- Rakentaisin yksinkertaisen säännön akulle ennen kuin koskisin malliin.',
        why: '- Keskiarvo näyttää hyvältä, mutta ongelma on muutamassa huonossa päivässä.\n- Sääntö on helppo selittää asukkaille ja verkkoyhtiölle.\n- Akun kuluminen maksaa, joten jokaisella latauksella pitää olla syy.',
        questions: '- Kuinka paljon akun kapasiteetista saa käyttää huippuihin ilman takuuongelmia?\n- Onko asukkailla mahdollisuus siirtää latausta, ja kuka siitä päättää?\n- Mitä tapahtuu, jos ennuste on väärin kolme päivää peräkkäin?',
      },
      translations: {
        en: {
          first: "- Go through last winter's 15-minute metering data and find the days when the forecast missed the most.\n- Tag those days with weather data: frost, no wind, cloud cover.\n- Build a simple rule for the battery before touching the model.",
          why: '- The average looks good, but the problem lives in a few bad days.\n- A rule is easy to explain to residents and the grid operator.\n- Battery wear costs money, so every cycle needs a reason.',
          questions: '- How much of the battery capacity can be used for peaks without warranty problems?\n- Can residents shift their charging, and who decides that?\n- What happens if the forecast is wrong three days in a row?',
        },
      },
    },
    {
      id: 's-2', challengeId: 'ch-2', participantId: 'p-7356', lang: 'sv', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-10T13:15:00+02:00', skills: ['sd-user-research', 'sd-multilingual', 'sd-copy'],
      answers: {
        first: 'Jag skulle sitta bredvid fem personer som nyligen flyttat till Esbo och se dem fylla i blanketten på riktigt, på sin egen telefon. Inte en enkät, utan att titta på var de stannar upp.',
        why: 'Problemet är sällan själva översättningen. Det är att juridiska begrepp som "hemkommun" förutsätter att man redan vet hur systemet fungerar. Om vi ser var folk fastnar kan vi skriva förklaringar i stället för bara översättningar.',
        questions: 'Vem äger texterna i dag, och får vi ändra dem utan att juristerna godkänner varje ord? Hur många ansökningar avbryts halvvägs? Finns det en svensk version som faktiskt används, eller bara en som finns?',
      },
      translations: {
        en: {
          first: 'I would sit next to five people who recently moved to Espoo and watch them fill in the form for real, on their own phone. Not a survey, but watching where they stop.',
          why: 'The problem is rarely the translation itself. It is that legal terms like "municipality of residence" assume you already know how the system works. If we see where people get stuck, we can write explanations instead of just translations.',
          questions: 'Who owns the texts today, and can we change them without legal approving every word? How many applications are abandoned halfway? Is there a Swedish version that is actually used, or just one that exists?',
        },
        fi: {
          first: 'Istuisin viiden hiljattain Espooseen muuttaneen ihmisen vieressä ja katsoisin, kun he täyttävät lomakkeen oikeasti omalla puhelimellaan. En tekisi kyselyä, vaan katsoisin, missä kohdassa he pysähtyvät.',
          why: 'Ongelma on harvoin itse käännös. Ongelma on se, että juridiset käsitteet kuten "kotikunta" olettavat, että tietää jo, miten järjestelmä toimii. Kun näemme, mihin ihmiset juuttuvat, voimme kirjoittaa selityksiä pelkkien käännösten sijaan.',
          questions: 'Kuka omistaa tekstit tällä hetkellä, ja saammeko muuttaa niitä ilman, että juristit hyväksyvät jokaisen sanan? Kuinka moni hakemus keskeytyy puolivälissä? Onko olemassa ruotsinkielinen versio, jota oikeasti käytetään, vai vain sellainen, joka on olemassa?',
        },
      },
    },
    {
      id: 's-3', challengeId: 'ch-1', participantId: 'p-1168', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-11T09:05:00+02:00', skills: ['gt-smartgrid', 'gt-storage'],
      answers: {
        first: "I'd start by asking for one week of data from the worst January week and replaying it against the current battery schedule, hour by hour. Before any modelling, I want to see exactly when the battery runs empty.",
        why: 'In my last project the forecast was fine; the dispatch logic was the weak point. It charged greedily at noon and had nothing left at 17:30. Replaying a bad week tells you which of the two is failing, cheaply.',
        questions: 'Is the 2 MWh battery owned by you or by the housing company? Do you have a contract with the DSO that penalises peaks, or is this about resident bills? Who gets called when it goes wrong at night?',
      },
      translations: {
        fi: {
          first: 'Aloittaisin pyytämällä yhden viikon dataa tammikuun pahimmalta viikolta ja ajaisin sen nykyistä akun aikataulua vasten tunti tunnilta. Ennen mallinnusta haluan nähdä tarkalleen, milloin akku tyhjenee.',
          why: 'Edellisessä projektissani ennuste oli kunnossa; heikko kohta oli ohjauslogiikka. Se latasi ahneesti keskipäivällä, eikä illalla klo 17.30 ollut enää mitään jäljellä. Huonon viikon uudelleenajo kertoo halvalla, kumpi näistä pettää.',
          questions: 'Omistatteko 2 MWh:n akun itse vai omistaako sen taloyhtiö? Onko teillä jakeluverkkoyhtiön kanssa sopimus, joka sakottaa huipuista, vai koskeeko tämä asukkaiden laskuja? Kenelle soitetaan, kun jokin menee vikaan yöllä?',
        },
      },
    },
    {
      id: 's-4', challengeId: 'ch-5', participantId: 'p-5540', lang: 'fi', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-11T15:40:00+02:00', skills: ['b2b-onboarding', 'sd-journey'],
      answers: {
        first: 'Soittaisin kymmenelle asiakkaalle, jotka lopettivat kirjautumisen toisella viikolla, ja kysyisin, mitä he yrittivät tehdä viimeisellä kerralla. Samalla katsoisin tuotedatasta, mihin kohtaan heidän polkunsa katkesi.',
        why: 'Data kertoo, missä ihmiset lopettavat, mutta ei sitä, miksi. Kymmenen puhelua on nopeampi kuin uusi dashboard, ja niistä saa lauseita, joita voi käyttää suoraan tuotteessa.',
        questions: 'Kuka asiakkaalla oikeasti käyttää työkalua: se, joka osti sen, vai joku muu? Onko toisella viikolla jokin tapahtuma, kuten ensimmäinen lasku tai kokeilujakson loppu? Mitä te itse pidätte onnistuneena käyttöönottona?',
      },
      translations: {
        en: {
          first: 'I would call ten customers who stopped logging in during week two and ask what they were trying to do the last time. At the same time I would look at product data to see where their path broke off.',
          why: 'Data tells you where people stop, but not why. Ten phone calls are faster than a new dashboard, and they give you sentences you can use directly in the product.',
          questions: 'Who at the customer actually uses the tool: the person who bought it, or someone else? Is there an event in week two, like the first invoice or the end of the trial? What do you yourselves consider a successful onboarding?',
        },
      },
    },
    {
      id: 's-5', challengeId: 'ch-5', participantId: 'p-3307', lang: 'sv', format: 'bullets', status: 'submitted',
      submittedAt: '2026-11-12T10:20:00+02:00', skills: ['b2b-onboarding', 'ai-stats', 'b2b-success'],
      answers: {
        first: '- Dela upp kunderna efter vem som bjöd in vem under första veckan.\n- Jämför de som fick en kollega inbjuden med de som var ensamma i verktyget.\n- Prata med två kunder från varje grupp.',
        why: '- B2B-verktyg dör ofta när bara en person använder dem.\n- Det är billigt att testa med data ni redan har.\n- Svaret ändrar vad onboardingen ska fokusera på.',
        questions: '- Hur många användare har en typisk kund efter 30 dagar?\n- Har ni svenskspråkiga kunder som får onboarding på finska eller engelska?\n- Vem i ert team äger onboardingen i dag?',
      },
      translations: {
        en: {
          first: '- Split customers by who invited whom during the first week.\n- Compare those who got a colleague invited with those who were alone in the tool.\n- Talk to two customers from each group.',
          why: '- B2B tools often die when only one person uses them.\n- It is cheap to test with data you already have.\n- The answer changes what onboarding should focus on.',
          questions: '- How many users does a typical customer have after 30 days?\n- Do you have Swedish-speaking customers who get onboarding in Finnish or English?\n- Who in your team owns onboarding today?',
        },
        fi: {
          first: '- Jaa asiakkaat sen mukaan, kuka kutsui kenet ensimmäisen viikon aikana.\n- Vertaa niitä, jotka saivat kollegan mukaan, niihin, jotka olivat työkalussa yksin.\n- Keskustele kahden asiakkaan kanssa kummastakin ryhmästä.',
          why: '- B2B-työkalut kuolevat usein, kun vain yksi ihminen käyttää niitä.\n- Tämä on halpa testata datalla, joka teillä jo on.\n- Vastaus muuttaa sitä, mihin käyttöönoton pitää keskittyä.',
          questions: '- Kuinka monta käyttäjää tyypillisellä asiakkaalla on 30 päivän jälkeen?\n- Onko teillä ruotsinkielisiä asiakkaita, jotka saavat käyttöönoton suomeksi tai englanniksi?\n- Kuka tiimissänne omistaa käyttöönoton tällä hetkellä?',
        },
      },
    },
    {
      id: 's-6', challengeId: 'ch-6', participantId: 'p-6612', lang: 'en', format: 'bullets', status: 'submitted',
      submittedAt: '2026-11-12T14:55:00+02:00', skills: ['ai-sensor-fusion', 'hw-lidar', 'sw-test'],
      answers: {
        first: '- Collect 20 drives where ghosts appeared and 20 clean ones on the same route.\n- Label ghost points by hand for a few hundred frames.\n- Check if ghost points share intensity and range patterns.',
        why: '- Wet snow returns are usually low intensity and close range, so a simple filter might remove most of them.\n- Hand labels first, so we know what we are actually filtering.\n- Same route means weather is the main difference.',
        questions: '- Does the radar see the same ghosts, or only the lidar?\n- What is worse for you: braking for a ghost, or missing a real pedestrian? Who decides that trade-off?\n- Can I ride in the shuttle on a snowy day?',
      },
      translations: {
        fi: {
          first: '- Kerää 20 ajoa, joissa haamuja esiintyi, ja 20 puhdasta ajoa samalla reitillä.\n- Merkitse haamupisteet käsin muutamasta sadasta kuvasta.\n- Tarkista, onko haamupisteillä yhteisiä intensiteetti- ja etäisyyskuvioita.',
          why: '- Märän lumen heijastukset ovat yleensä matalaintensiteettisiä ja lähellä, joten yksinkertainen suodatin voi poistaa suurimman osan.\n- Ensin käsin merkinnät, jotta tiedämme, mitä oikeasti suodatamme.\n- Sama reitti tarkoittaa, että sää on pääasiallinen ero.',
          questions: '- Näkeekö tutka samat haamut, vai vain lidar?\n- Kumpi on teille pahempi: jarruttaminen haamun takia vai oikean jalankulkijan ohittaminen? Kuka päättää tästä kompromissista?\n- Pääsisinkö kyytiin lumisena päivänä?',
        },
      },
    },
    {
      id: 's-7', challengeId: 'ch-4', participantId: 'p-8875', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-13T09:30:00+02:00', skills: ['b2b-gtm', 'b2b-funding'],
      answers: {
        first: "I'd make a list of twenty organisations in Finland and the Nordics that already pay for HPC time for chemistry or materials simulation, and interview five of them about which problems they currently give up on.",
        why: "People who already pay for compute have budgets and know their pain. If none of their 'given up' problems fit a 50-qubit machine, that is worth knowing before building a sales team.",
        questions: 'Are you selling machine access, or co-development projects? How much do research funders like Business Finland shape who your first customers are? What did the last customer who said no tell you?',
      },
      translations: {
        fi: {
          first: 'Tekisin listan kahdestakymmenestä organisaatiosta Suomessa ja Pohjoismaissa, jotka jo maksavat HPC-laskenta-ajasta kemian tai materiaalien simulointiin, ja haastattelisin viittä niistä siitä, mistä ongelmista he tällä hetkellä luopuvat.',
          why: 'Ihmisillä, jotka jo maksavat laskennasta, on budjetti ja he tuntevat ongelmansa. Jos mikään heidän luopumistaan ongelmista ei sovi 50 kubitin koneelle, se on hyvä tietää ennen myyntitiimin rakentamista.',
          questions: 'Myyttekö konekäyttöä vai yhteiskehitysprojekteja? Kuinka paljon tutkimusrahoittajat, kuten Business Finland, vaikuttavat siihen, keitä ensimmäiset asiakkaanne ovat? Mitä viimeisin kieltäytynyt asiakas teille sanoi?',
        },
      },
    },
    {
      id: 's-8', challengeId: 'ch-3', participantId: 'p-9214', lang: 'fi', format: 'bullets', status: 'submitted',
      submittedAt: '2026-11-13T12:10:00+02:00', skills: ['hw-iot', 'hw-reliability', 'sw-embedded'],
      answers: {
        first: '- Laittaisin yhden gatewayn pakastimeen ja lokittaisin kaiken: virta, lämpötila, muisti, verkko.\n- Lisäisin heartbeat-viestin, joka hälyttää 5 minuutin hiljaisuudesta.\n- Katsoisin, sammuuko laite vai vain yhteys.',
        why: '- Ensin pitää tietää, mikä pettää, ennen kuin korjaa mitään.\n- Heartbeat on halpa ja auttaa heti tuotannossa.\n- Kylmä vaikuttaa usein akkuun tai SD-korttiin, ei ohjelmistoon.',
        questions: '- Onko laitteissa lämmitys, vai luotetaanko kotelon eristykseen?\n- Kuka tehtaalla huomaa ensimmäisenä, että data puuttuu?\n- Voinko käydä katsomassa asennusta paikan päällä?',
      },
      translations: {
        en: {
          first: '- Put one gateway in a freezer and log everything: power, temperature, memory, network.\n- Add a heartbeat message that alarms after 5 minutes of silence.\n- Check whether the device dies or just the connection.',
          why: '- You need to know what fails before fixing anything.\n- A heartbeat is cheap and helps production right away.\n- Cold often affects the battery or SD card, not the software.',
          questions: '- Do the devices have heating, or do you rely on the enclosure insulation?\n- Who at the plant is first to notice that data is missing?\n- Can I visit an installation on site?',
        },
      },
    },
    {
      id: 's-9', challengeId: 'ch-2', participantId: 'p-4821', lang: 'en', format: 'bullets', status: 'submitted',
      submittedAt: '2026-11-13T16:45:00+02:00', skills: ['sd-accessibility', 'sd-copy', 'sd-multilingual'],
      answers: {
        first: '- Test the current permit form with a screen reader and with the phone set to English.\n- Mark every term a newcomer would need to look up.\n- Rewrite the three worst steps in plain language, in all three languages.',
        why: '- Accessibility and plain-language problems overlap a lot.\n- Rewriting three steps is small enough to test in two weeks.\n- It shows whether the problem is the words or the flow.',
        questions: '- Which step has the most support calls today?\n- Can we publish plain-language text that legal has reviewed once, not per word?\n- How do you currently test with Swedish-speaking residents?',
      },
      translations: {
        fi: {
          first: '- Testaa nykyinen lupalomake ruudunlukijalla ja englanninkielisellä puhelimella.\n- Merkitse jokainen termi, joka uuden tulijan pitäisi selvittää.\n- Kirjoita kolme pahinta vaihetta uudelleen selkokielellä kaikilla kolmella kielellä.',
          why: '- Saavutettavuus- ja selkokieliongelmat menevät paljon päällekkäin.\n- Kolmen vaiheen uudelleenkirjoitus on tarpeeksi pieni testattavaksi kahdessa viikossa.\n- Se näyttää, onko ongelma sanoissa vai prosessissa.',
          questions: '- Mistä vaiheesta tulee nykyään eniten tukipuheluita?\n- Voimmeko julkaista selkokielisen tekstin, jonka juristit ovat tarkastaneet kerran, eikä sana kerrallaan?\n- Miten testaatte tällä hetkellä ruotsinkielisten asukkaiden kanssa?',
        },
      },
    },
    {
      id: 's-10', challengeId: 'ch-3', participantId: 'p-6612', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-14T08:20:00+02:00', skills: ['hw-edge', 'hw-reliability'],
      answers: {
        first: "I'd check the gateway's watchdog and power logs from the night it went silent, then try to reproduce it in a cold chamber at the university lab in Otaniemi.",
        why: 'Silence for hours means nothing is watching the watcher. Fixing alerting first stops the damage while we find the root cause.',
        questions: 'Do you have remote access to the gateways? Which matters more to the plant: losing data, or losing control?',
      },
      translations: {
        fi: {
          first: 'Tarkistaisin gatewayn watchdog- ja virtalokit siltä yöltä, jolloin se hiljeni, ja yrittäisin toistaa vian Otaniemen yliopiston laboratorion kylmäkammiossa.',
          why: 'Tuntien hiljaisuus tarkoittaa, ettei kukaan valvo valvojaa. Hälytysten korjaaminen ensin pysäyttää vahingot, kun etsimme juurisyytä.',
          questions: 'Onko teillä etäyhteys gatewayhin? Kumpi on tehtaalle tärkeämpää: datan menetys vai ohjauksen menetys?',
        },
      },
    },
    {
      id: 's-11', challengeId: 'ch-6', participantId: 'p-4821', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-14T09:10:00+02:00', skills: ['ai-sensor-fusion', 'hw-lidar'],
      answers: {
        first: "I'd look at whether the ghosts move with the shuttle or stay fixed in the world. Snowflakes near the sensor move with you; real objects don't.",
        why: 'It is a cheap test with existing logs, and it separates sensor noise from real detections without a new model.',
        questions: 'How often do you clean or heat the lidar window during a route? Is there a safety driver log I could read?',
      },
      translations: {
        fi: {
          first: 'Katsoisin, liikkuvatko haamut sukkulan mukana vai pysyvätkö ne paikallaan maailmassa. Anturin lähellä olevat lumihiutaleet liikkuvat mukanasi, oikeat esineet eivät.',
          why: 'Se on halpa testi olemassa olevilla lokeilla, ja se erottaa anturikohinan oikeista havainnoista ilman uutta mallia.',
          questions: 'Kuinka usein lidarin ikkunaa puhdistetaan tai lämmitetään reitin aikana? Onko turvakuljettajan lokia, jota voisin lukea?',
        },
      },
    },
    {
      // Private draft: visible only to its author.
      id: 's-12', challengeId: 'ch-1', participantId: 'p-4821', lang: 'en', format: 'bullets', status: 'draft',
      updatedAt: '2026-11-14T10:02:00+02:00', skills: ['gt-demand'],
      answers: {
        first: '- Plot battery state of charge against EV plug-in times for the ten worst evenings.',
        why: '',
        questions: '- Are residents told when the grid is under stress?',
      },
      translations: {},
    },
  ];

  const slots = [
    ...slotsFor('c-lumi', 1),
    ...slotsFor('c-sillat', 2),
    ...slotsFor('c-kesto', 3),
    ...slotsFor('c-qubit', 4),
    ...slotsFor('c-tukki', 5),
    ...slotsFor('c-revon', 6),
  ];

  const m = (id, o) => ({ id, createdAt: '2026-11-13T12:00:00+02:00', organizerStatus: 'pending', ...o });
  const meetings = [
    m('m-1', { challengeId: 'ch-2', companyId: 'c-sillat', participantId: 'p-4821', slotId: 'sl-sillat-2', initiator: 'participant', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-13T17:00:00+02:00' }),
    m('m-2', { challengeId: 'ch-1', companyId: 'c-lumi', participantId: 'p-4821', slotId: 'sl-lumi-3', initiator: 'participant', partyStatus: 'requested', createdAt: '2026-11-14T10:05:00+02:00' }),
    m('m-3', { challengeId: 'ch-1', companyId: 'c-lumi', participantId: 'p-2093', slotId: 'sl-lumi-1', initiator: 'recruiter', partyStatus: 'invited', createdAt: '2026-11-12T09:00:00+02:00' }),
    m('m-4', { challengeId: 'ch-1', companyId: 'c-lumi', participantId: 'p-1168', slotId: 'sl-lumi-2', initiator: 'recruiter', partyStatus: 'accepted', createdAt: '2026-11-12T09:10:00+02:00' }),
    m('m-5', { challengeId: 'ch-5', companyId: 'c-tukki', participantId: 'p-5540', slotId: 'sl-tukki-1', initiator: 'participant', partyStatus: 'requested', createdAt: '2026-11-12T16:00:00+02:00' }),
    m('m-6', { challengeId: 'ch-5', companyId: 'c-tukki', participantId: 'p-3307', slotId: 'sl-tukki-2', initiator: 'participant', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-12T11:00:00+02:00' }),
    m('m-7', { challengeId: 'ch-4', companyId: 'c-qubit', participantId: 'p-8875', slotId: 'sl-qubit-1', initiator: 'participant', partyStatus: 'declined', createdAt: '2026-11-13T10:00:00+02:00' }),
    m('m-8', { challengeId: 'ch-3', companyId: 'c-kesto', participantId: 'p-9214', slotId: 'sl-kesto-1', initiator: 'recruiter', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-13T13:00:00+02:00' }),
    m('m-9', { challengeId: 'ch-6', companyId: 'c-revon', participantId: 'p-4821', slotId: 'sl-revon-3', initiator: 'recruiter', partyStatus: 'invited', createdAt: '2026-11-14T11:00:00+02:00' }),
    m('m-10', { challengeId: 'ch-6', companyId: 'c-revon', participantId: 'p-6612', slotId: 'sl-revon-1', initiator: 'participant', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-12T15:30:00+02:00' }),
  ];

  // Post-event private choices, keyed by meeting id. null = not answered yet.
  const feedback = {
    'm-1': { participant: null, recruiter: null },
    'm-6': { participant: 'continue', recruiter: 'continue' },
    'm-8': { participant: 'continue', recruiter: 'notnow' },
    'm-10': { participant: 'continue', recruiter: 'continue' },
  };

  const consents = Object.fromEntries(
    participants.map((p) => [p.id, { purpose: 'event-matchmaking', at: '2026-11-09T12:00:00+02:00' }]),
  );

  return {
    version: 1,
    event: {
      name: 'Espoo Talent Match 2026',
      date: EVENT_DATE,
      venue: 'Dipoli, Otaniemi',
      registrationOpens: '2026-11-07',
      retentionDays: 30,
    },
    companies,
    challenges,
    participants,
    submissions,
    slots,
    meetings,
    feedback,
    bookmarks: { 'p-4821': ['ch-1', 'ch-5'] },
    consents,
    currentParticipantId: 'p-4821',
    currentCompanyId: 'c-lumi',
    coWriteRequests: [],
    purge: { done: false, at: null, aggregates: null, ledger: null },
    decisionLog: [],
  };
}
