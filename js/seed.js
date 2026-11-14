// Synthetic Espoo ecosystem for the Skillink demo. All hosts and people are fictional.
// No demographic or pedigree data of any kind is stored (see .claude/skills/eu-ai-act-and-fairness).

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
  // Challenge hosts. The host contact is shown to a solver only after a mutual post-event opt-in.
  const companies = [
    { id: 'c-lumi', name: 'Lumivirta Energy', sector: 'Energy', hostName: 'Katja Salmi', hostRole: 'Head of grid R&D', hostEmail: 'katja.salmi@lumivirta.example.com' },
    { id: 'c-sillat', name: 'Sillat Digital', sector: 'Public sector', hostName: 'Joonas Aalto', hostRole: 'Service design lead', hostEmail: 'joonas@sillat.example.com' },
    { id: 'c-kesto', name: 'Kestomo Industrial', sector: 'Manufacturing', hostName: 'Riikka Mäkelä', hostRole: 'Innovation manager', hostEmail: 'riikka.makela@kestomo.example.com' },
    { id: 'c-qubit', name: 'Qubitti Labs', sector: 'Deep tech', hostName: 'Ville Rantanen', hostRole: 'Hardware R&D lead', hostEmail: 'ville@qubitti.example.com' },
    { id: 'c-tukki', name: 'Tukki Build', sector: 'Construction', hostName: 'Maria Holm', hostRole: 'Circularity lead', hostEmail: 'maria.holm@tukki.example.com' },
    { id: 'c-revon', name: 'Revontuli Mobility', sector: 'Mobility', hostName: 'Anton Lehto', hostRole: 'Autonomy team lead', hostEmail: 'anton.lehto@revontuli.example.com' },
  ];

  const challenges = [
    {
      id: 'ch-1',
      companyId: 'c-lumi',
      title: 'Clean energy microgrid load balancing',
      summary: 'Keep a neighbourhood microgrid stable when everyone charges at 17:30.',
      formats: ['hiring', 'rnd'],
      context:
        'We run a pilot microgrid in Kera, Espoo: 400 homes, rooftop solar and a 2 MWh shared battery. On most days it works. On cold, still, cloudy evenings, electric cars plug in at the same time, the battery is already low and we import expensive peak power. We are hiring for our grid team and would welcome a thesis or joint research project on the forecasting side.',
      tricky:
        'Our demand forecast is accurate on average and wrong on exactly the days that matter. Every extra battery cycle shortens its life, and residents have only agreed to flexible charging on a voluntary basis.',
      escoTags: ['gt-smartgrid', 'gt-storage', 'gt-demand', 'ai-timeseries', 'gt-energy-eff'],
      language: 'English is fine',
      languages: ['en'],
      industry: 'Energy',
      deadline: '2026-11-22',
      createdAt: '2026-11-03T09:00:00+02:00',
      coWritten: false,
    },
    {
      id: 'ch-2',
      companyId: 'c-sillat',
      title: 'Multilingual municipal service accessibility',
      summary: 'Make a city permit form work for someone in their third week in Finland.',
      formats: ['pilot', 'open'],
      context:
        'We build digital services for Uusimaa municipalities. Our building and residence-related permit forms are available in Finnish, Swedish and English, yet newcomers abandon them at twice the rate of other residents and call the service desk instead. We want to pilot a fix with a specialist or a small team, and we are open to other ways of working together.',
      tricky:
        'Legal terms like "kotikunta" have no clean translation, every text change needs legal review, and the forms must meet WCAG 2.2 AA for screen-reader users in all three languages.',
      escoTags: ['sd-ux', 'sd-multilingual', 'sd-accessibility', 'sd-copy', 'sd-public'],
      language: 'Finnish, Swedish, or English',
      languages: ['fi', 'sv', 'en'],
      industry: 'Public sector',
      deadline: '2026-11-23',
      createdAt: '2026-11-03T14:00:00+02:00',
      coWritten: true,
    },
    {
      id: 'ch-3',
      companyId: 'c-kesto',
      title: 'Industrial edge IoT anomaly detection',
      summary: 'Our edge gateways miss the anomalies that matter, then go silent at −25 °C.',
      formats: ['pilot', 'hiring'],
      context:
        'Kestomo retrofits sensors onto paper-mill and sawmill equipment. Each site has 10–40 edge gateways that pre-process vibration data and flag anomalies before a bearing fails. Most alerts we get are false alarms, and in winter some outdoor gateways stop reporting altogether until someone notices the next morning. We want a pilot partner for edge anomaly detection, and we are hiring an embedded engineer.',
      tricky:
        "We cannot reproduce the cold failures in the office, the gateways run a customer-approved firmware image we can't change freely, the sites are a four-hour drive away, and one missed bearing fault stops a production line.",
      escoTags: ['hw-iot', 'hw-edge', 'hw-anomaly', 'hw-reliability', 'sw-embedded', 'hw-industrial'],
      language: 'English or Finnish',
      languages: ['en', 'fi'],
      industry: 'Manufacturing',
      deadline: '2026-11-21',
      createdAt: '2026-11-04T10:00:00+02:00',
      coWritten: false,
    },
    {
      id: 'ch-4',
      companyId: 'c-qubit',
      title: 'Cryogenic quantum control hardware packaging',
      summary: 'Our control wiring heats the coldest stage of the fridge before we reach 50 qubits.',
      formats: ['rnd', 'hiring'],
      context:
        'We are a spin-out from Otaniemi research with a working superconducting prototype. Every qubit needs several control and readout lines running from room temperature down to 10 millikelvin. At 20 qubits it works. At 50, the wiring and packaging bring in more heat than the dilution refrigerator can remove.',
      tricky:
        'Fewer, thinner cables mean more crosstalk and signal loss. Moving electronics into the cold means designing for temperatures most components were never tested at. Each cooldown takes two days, so every experiment counts.',
      escoTags: ['hw-quantum', 'hw-cryo', 'hw-microelectronics', 'hw-thermal', 'rd-experiments'],
      language: 'English is fine',
      languages: ['en'],
      industry: 'Deep tech',
      deadline: '2026-11-24',
      createdAt: '2026-11-04T15:30:00+02:00',
      coWritten: false,
    },
    {
      id: 'ch-5',
      companyId: 'c-tukki',
      title: 'Circular construction material traceability',
      summary: 'Reclaimed steel and timber lose their paperwork between demolition and the next building.',
      formats: ['pilot', 'rnd'],
      context:
        'Tukki Build dismantles office buildings in Espoo and reuses beams, timber and façade panels in new projects. A reclaimed steel beam is often as good as new, but by the time it reaches the next site nobody can prove where it came from, what load it carried or how it was treated. Structural engineers reject it, and it is recycled as scrap.',
      tricky:
        'Demolition crews have minutes, not hours, per component. Labels fall off, building records from the 1970s are on paper, and every certification body wants different evidence. Many of our site teams and partners work in Swedish.',
      escoTags: ['ce-circular', 'ce-materials', 'ce-trace', 'ce-bim', 'gt-lca'],
      language: 'English or Swedish',
      languages: ['en', 'sv'],
      industry: 'Construction',
      deadline: '2026-11-23',
      createdAt: '2026-11-05T11:00:00+02:00',
      coWritten: true,
    },
    {
      id: 'ch-6',
      companyId: 'c-revon',
      title: 'Autonomous last-mile delivery sensor fusion',
      summary: "Our delivery robots' lidar sees ghosts in wet snow.",
      formats: ['open'],
      context:
        'Revontuli runs a fleet of small autonomous delivery robots on the pavements between Tapiola and Otaniemi. In wet snow, the lidar reports phantom obstacles, the robot stops, and parcels arrive late. Dry snow is fine. We are open to hiring, a thesis or a startup pilot, whichever fits the person or team.',
      tricky:
        'Filtering too much is a safety risk on a pavement full of people; filtering too little makes the service unusable. Labelled winter data is scarce, and the radar and camera disagree in different ways.',
      escoTags: ['ai-sensor-fusion', 'hw-lidar', 'ai-cv', 'ai-ml', 'sw-test'],
      language: 'English is fine',
      languages: ['en'],
      industry: 'Mobility',
      deadline: '2026-11-22',
      createdAt: '2026-11-05T16:00:00+02:00',
      coWritten: false,
    },
  ];

  // Solvers: a pseudonym plus the minimum contact data needed to meet. No team name, employer,
  // university or company size: name and email are revealed to a host only after a mutual
  // meeting acceptance.
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
      id: 's-1', challengeId: 'ch-1', participantId: 'p-2093', intent: 'talent', lang: 'fi', format: 'bullets', status: 'submitted',
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
      id: 's-2', challengeId: 'ch-2', participantId: 'p-7356', intent: 'partner', lang: 'sv', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-10T13:15:00+02:00', skills: ['sd-ux', 'sd-multilingual', 'sd-copy'],
      answers: {
        first: 'Vi är en liten byrå för tjänstedesign med två personer. Som en pilot på sex veckor skulle vi sitta bredvid fem personer som nyligen flyttat till Esbo och se dem fylla i blanketten på riktigt, på sin egen telefon. Inte en enkät, utan att titta på var de stannar upp.',
        why: 'Problemet är sällan själva översättningen. Det är att juridiska begrepp som "hemkommun" förutsätter att man redan vet hur systemet fungerar. Om vi ser var folk fastnar kan vi skriva förklaringar i stället för bara översättningar.',
        questions: 'Vem äger texterna i dag, och får vi ändra dem utan att juristerna godkänner varje ord? Hur många ansökningar avbryts halvvägs? Finns det en svensk version som faktiskt används, eller bara en som finns?',
      },
      translations: {
        en: {
          first: 'We are a small, two-person service design studio. As a six-week pilot, we would sit next to five people who recently moved to Espoo and watch them fill in the form for real, on their own phone. Not a survey, but watching where they stop.',
          why: 'The problem is rarely the translation itself. It is that legal terms like "municipality of residence" assume you already know how the system works. If we see where people get stuck, we can write explanations instead of just translations.',
          questions: 'Who owns the texts today, and can we change them without legal approving every word? How many applications are abandoned halfway? Is there a Swedish version that is actually used, or just one that exists?',
        },
        fi: {
          first: 'Olemme pieni, kahden hengen palvelumuotoilutoimisto. Kuuden viikon pilottina istuisimme viiden hiljattain Espooseen muuttaneen ihmisen vieressä ja katsoisimme, kun he täyttävät lomakkeen oikeasti omalla puhelimellaan. Emme tekisi kyselyä, vaan katsoisimme, missä kohdassa he pysähtyvät.',
          why: 'Ongelma on harvoin itse käännös. Ongelma on se, että juridiset käsitteet kuten "kotikunta" olettavat, että tietää jo, miten järjestelmä toimii. Kun näemme, mihin ihmiset juuttuvat, voimme kirjoittaa selityksiä pelkkien käännösten sijaan.',
          questions: 'Kuka omistaa tekstit tällä hetkellä, ja saammeko muuttaa niitä ilman, että juristit hyväksyvät jokaisen sanan? Kuinka moni hakemus keskeytyy puolivälissä? Onko olemassa ruotsinkielinen versio, jota oikeasti käytetään, vai vain sellainen, joka on olemassa?',
        },
      },
    },
    {
      id: 's-3', challengeId: 'ch-1', participantId: 'p-1168', intent: 'research', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-11T09:05:00+02:00', skills: ['gt-smartgrid', 'gt-storage'],
      answers: {
        first: "I'd start by asking for one week of data from the worst January week and replaying it against the current battery schedule, hour by hour. Before any modelling, I want to see exactly when the battery runs empty. That replay could be the first chapter of a thesis or a joint research project.",
        why: 'In my research on neighbourhood batteries, the forecast was usually fine; the dispatch logic was the weak point. It charged greedily at noon and had nothing left at 17:30. Replaying a bad week tells you which of the two is failing, cheaply.',
        questions: 'Is the 2 MWh battery owned by you or by the housing company? Do you have a contract with the DSO that penalises peaks, or is this about resident bills? Could the metering data be shared with a research group under a data agreement?',
      },
      translations: {
        fi: {
          first: 'Aloittaisin pyytämällä yhden viikon dataa tammikuun pahimmalta viikolta ja ajaisin sen nykyistä akun aikataulua vasten tunti tunnilta. Ennen mallinnusta haluan nähdä tarkalleen, milloin akku tyhjenee. Tämä uudelleenajo voisi olla opinnäytetyön tai yhteisen tutkimushankkeen ensimmäinen luku.',
          why: 'Naapurustoakkuja koskevassa tutkimuksessani ennuste oli yleensä kunnossa; heikko kohta oli ohjauslogiikka. Se latasi ahneesti keskipäivällä, eikä illalla klo 17.30 ollut enää mitään jäljellä. Huonon viikon uudelleenajo kertoo halvalla, kumpi näistä pettää.',
          questions: 'Omistatteko 2 MWh:n akun itse vai omistaako sen taloyhtiö? Onko teillä jakeluverkkoyhtiön kanssa sopimus, joka sakottaa huipuista, vai koskeeko tämä asukkaiden laskuja? Voisiko mittausdatan jakaa tutkimusryhmälle datasopimuksella?',
        },
      },
    },
    {
      id: 's-4', challengeId: 'ch-5', participantId: 'p-5540', intent: 'research', lang: 'fi', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-11T15:40:00+02:00', skills: ['ce-trace', 'ce-circular'],
      answers: {
        first: 'Seuraisin yhtä purkutyömaata kahden päivän ajan ja kirjaisin jokaisen kohdan, jossa rakennusosan tieto katoaa: purkuhetki, välivarasto, kuljetus ja vastaanotto uudella työmaalla. Samalla kävisin läpi, mitä todisteita rakennesuunnittelija oikeasti tarvitsee hyväksyäkseen uudelleenkäytetyn palkin.',
        why: 'Ongelma ei ole ensisijaisesti tekninen, vaan se, että tieto kulkee monen eri ihmisen käsien kautta. Kun tiedämme, missä kohdassa ketju katkeaa, voimme suunnitella merkinnän, joka kestää juuri sen vaiheen. Teen diplomityötä materiaalipasseista, joten tämä sopisi tutkimusyhteistyöksi.',
        questions: 'Mitä todisteita rakennesuunnittelijanne vaativat tänä päivänä? Onko teillä esimerkki rakennusosasta, joka hylättiin pelkästään puuttuvan tiedon takia? Saisiko tutkimuksessa käyttää työmaidenne dataa ja julkaista tulokset?',
      },
      translations: {
        en: {
          first: "I would follow one demolition site for two days and note every point where a component's information gets lost: the moment of dismantling, interim storage, transport and arrival at the new site. At the same time I would go through what evidence a structural engineer actually needs to accept a reused beam.",
          why: 'The problem is not mainly technical. It is that the information passes through many different hands. Once we know where the chain breaks, we can design a label that survives exactly that stage. I am writing my master\'s thesis on material passports, so this would fit a research collaboration.',
          questions: 'What evidence do your structural engineers require today? Do you have an example of a component that was rejected only because information was missing? Could the research use data from your sites and publish the results?',
        },
      },
    },
    {
      id: 's-5', challengeId: 'ch-5', participantId: 'p-3307', intent: 'partner', lang: 'sv', format: 'bullets', status: 'submitted',
      submittedAt: '2026-11-12T10:20:00+02:00', skills: ['ce-trace', 'ce-materials', 'ce-bim'],
      answers: {
        first: '- Märk tio balkar och tio fasadpaneler på nästa rivning med NFC-taggar som tål väder.\n- Koppla varje tagg till foton, mått och den gamla ritningen redan på plats.\n- Följ dem till nästa bygge och mät hur lång tid det tar per komponent.',
        why: '- Ett litet pilotprojekt visar snabbt om rivningsteamet hinner med.\n- Vi har byggt en enkel app för detta och kan anpassa den till era blanketter.\n- Om det fungerar för tio balkar vet vi vad som behövs för tusen.',
        questions: '- Vilka uppgifter kräver er konstruktör för att godkänna en återanvänd balk?\n- Vem på arbetsplatsen skulle skanna taggarna, och har de tid?\n- Kan piloten köras på svenska med era partner i Västnyland?',
      },
      translations: {
        en: {
          first: '- Tag ten beams and ten façade panels on the next demolition with weatherproof NFC tags.\n- Link each tag to photos, measurements and the old drawing while still on site.\n- Follow them to the next building and measure how long it takes per component.',
          why: '- A small pilot quickly shows whether the demolition crew can keep up.\n- We have built a simple app for this and can adapt it to your forms.\n- If it works for ten beams, we know what is needed for a thousand.',
          questions: '- What information does your structural engineer require to approve a reused beam?\n- Who on site would scan the tags, and do they have time?\n- Can the pilot run in Swedish with your partners in western Uusimaa?',
        },
        fi: {
          first: '- Merkitse seuraavassa purkukohteessa kymmenen palkkia ja kymmenen julkisivupaneelia säänkestävillä NFC-tageilla.\n- Liitä jokaiseen tagiin valokuvat, mitat ja vanha piirustus jo työmaalla.\n- Seuraa niitä seuraavalle työmaalle ja mittaa, kauanko yhteen rakennusosaan menee aikaa.',
          why: '- Pieni pilotti näyttää nopeasti, ehtiikö purkutiimi mukaan.\n- Olemme rakentaneet tähän yksinkertaisen sovelluksen ja voimme sovittaa sen teidän lomakkeisiinne.\n- Jos se toimii kymmenelle palkille, tiedämme, mitä tarvitaan tuhannelle.',
          questions: '- Mitä tietoja rakennesuunnittelijanne vaatii hyväksyäkseen uudelleenkäytetyn palkin?\n- Kuka työmaalla lukisi tagit, ja onko heillä aikaa?\n- Voiko pilotin toteuttaa ruotsiksi yhteistyökumppanienne kanssa Länsi-Uudellamaalla?',
        },
      },
    },
    {
      id: 's-6', challengeId: 'ch-6', participantId: 'p-6612', intent: 'talent', lang: 'en', format: 'bullets', status: 'submitted',
      submittedAt: '2026-11-12T14:55:00+02:00', skills: ['ai-sensor-fusion', 'hw-lidar', 'sw-test'],
      answers: {
        first: '- Collect 20 runs where ghosts appeared and 20 clean ones on the same route.\n- Label ghost points by hand for a few hundred frames.\n- Check if ghost points share intensity and range patterns.',
        why: '- Wet snow returns are usually low intensity and close range, so a simple filter might remove most of them.\n- Hand labels first, so we know what we are actually filtering.\n- Same route means weather is the main difference.',
        questions: '- Does the radar see the same ghosts, or only the lidar?\n- What is worse for you: stopping for a ghost, or missing a real pedestrian? Who decides that trade-off?\n- Can I follow a robot on its route on a snowy day?',
      },
      translations: {
        fi: {
          first: '- Kerää 20 ajoa, joissa haamuja esiintyi, ja 20 puhdasta ajoa samalla reitillä.\n- Merkitse haamupisteet käsin muutamasta sadasta kuvasta.\n- Tarkista, onko haamupisteillä yhteisiä intensiteetti- ja etäisyyskuvioita.',
          why: '- Märän lumen heijastukset ovat yleensä matalaintensiteettisiä ja lähellä, joten yksinkertainen suodatin voi poistaa suurimman osan.\n- Ensin käsin merkinnät, jotta tiedämme, mitä oikeasti suodatamme.\n- Sama reitti tarkoittaa, että sää on pääasiallinen ero.',
          questions: '- Näkeekö tutka samat haamut, vai vain lidar?\n- Kumpi on teille pahempi: pysähtyminen haamun takia vai oikean jalankulkijan ohittaminen? Kuka päättää tästä kompromissista?\n- Voisinko seurata robottia sen reitillä lumisena päivänä?',
        },
      },
    },
    {
      id: 's-7', challengeId: 'ch-4', participantId: 'p-8875', intent: 'research', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-13T09:30:00+02:00', skills: ['hw-cryo', 'hw-thermal', 'rd-experiments'],
      answers: {
        first: "I'd measure the heat load per line at each temperature stage before changing anything, using the next cooldown to compare three cable types side by side on spare lines. Then I'd model which lines really need to run all the way down, and which signals could be multiplexed at 4 kelvin.",
        why: "My research is on thermal budgets in dilution refrigerators. In most setups I've measured, a few high-bandwidth lines cause most of the heat, not the cable count itself. Knowing that tells you whether you need better cables, cold electronics or both, and it is a natural thesis or joint research topic.",
        questions: 'How much cooling power do you have at the mixing chamber, and how much is already used? Can a researcher get time on a cooldown, or are they all booked for the prototype? Would results be publishable, or is the packaging work under IP restrictions?',
      },
      translations: {
        fi: {
          first: 'Mittaisin lämpökuorman linjaa kohden jokaisella lämpötilatasolla ennen kuin muuttaisin mitään, ja vertailisin seuraavan jäähdytyksen aikana kolmea kaapelityyppiä rinnakkain varalinjoilla. Sitten mallintaisin, mitkä linjat oikeasti täytyy viedä alimmalle tasolle asti ja mitkä signaalit voisi multipleksata 4 kelvinissä.',
          why: 'Tutkin laimennusjäähdyttimien lämpöbudjetteja. Useimmissa mittaamissani järjestelmissä suurin osa lämmöstä tulee muutamasta laajakaistaisesta linjasta, ei kaapelien määrästä. Kun sen tietää, tietää myös, tarvitaanko parempia kaapeleita, kylmää elektroniikkaa vai molempia, ja aihe sopii luontevasti opinnäytetyöksi tai yhteistutkimukseksi.',
          questions: 'Kuinka paljon jäähdytystehoa sekoituskammiossa on, ja kuinka paljon siitä on jo käytössä? Voiko tutkija saada aikaa jäähdytyskierrokselta, vai ovatko ne kaikki varattuja prototyypille? Saako tuloksia julkaista, vai koskevatko paketointityötä IPR-rajoitukset?',
        },
      },
    },
    {
      id: 's-8', challengeId: 'ch-3', participantId: 'p-9214', intent: 'talent', lang: 'fi', format: 'bullets', status: 'submitted',
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
      id: 's-9', challengeId: 'ch-2', participantId: 'p-4821', intent: 'open', lang: 'en', format: 'bullets', status: 'submitted',
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
        sv: {
          first: '- Testa den nuvarande tillståndsblanketten med en skärmläsare och med telefonen inställd på engelska.\n- Markera varje begrepp som en nyinflyttad skulle behöva slå upp.\n- Skriv om de tre sämsta stegen på klarspråk, på alla tre språken.',
          why: '- Tillgänglighets- och klarspråksproblem överlappar mycket.\n- Att skriva om tre steg är litet nog att testa på två veckor.\n- Det visar om problemet ligger i orden eller i flödet.',
          questions: '- Vilket steg ger flest supportsamtal i dag?\n- Kan vi publicera klarspråkstext som juristerna granskat en gång, inte ord för ord?\n- Hur testar ni i dag med svenskspråkiga invånare?',
        },
      },
    },
    {
      id: 's-10', challengeId: 'ch-3', participantId: 'p-6612', intent: 'partner', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-14T08:20:00+02:00', skills: ['hw-edge', 'hw-anomaly', 'hw-reliability'],
      answers: {
        first: "As a six-week pilot, I'd run a lightweight anomaly model on three gateways at one site, next to your current alerts, and log every alert both systems raise. Alongside that I'd check the watchdog and power logs from the nights the gateways went silent.",
        why: "I work as an independent edge-ML specialist. Running side by side shows whether the new model cuts false alarms without missing real bearing faults, and it doesn't touch the customer-approved firmware. Silence for hours also means nothing is watching the watcher, so alerting comes first.",
        questions: 'Do you have remote access to the gateways? Which is worse for the plant: a false alarm or a missed fault? Who at the customer would need to approve a pilot?',
      },
      translations: {
        fi: {
          first: 'Kuuden viikon pilottina ajaisin kevyttä poikkeamamallia kolmessa gatewayssa yhdellä tehtaalla nykyisten hälytysten rinnalla ja kirjaisin jokaisen hälytyksen, jonka kumpikin järjestelmä antaa. Samalla tarkistaisin watchdog- ja virtalokit niiltä öiltä, jolloin gatewayt hiljenivät.',
          why: 'Toimin itsenäisenä reunalaskennan koneoppimisasiantuntijana. Rinnakkainen ajo näyttää, vähentääkö uusi malli vääriä hälytyksiä ohittamatta oikeita laakerivikoja, eikä se koske asiakkaan hyväksymään laiteohjelmistoon. Tuntien hiljaisuus tarkoittaa myös, ettei kukaan valvo valvojaa, joten hälytykset tulevat ensin.',
          questions: 'Onko teillä etäyhteys gatewayhin? Kumpi on tehtaalle pahempi: väärä hälytys vai ohitettu vika? Kenen asiakkaalla pitäisi hyväksyä pilotti?',
        },
      },
    },
    {
      id: 's-11', challengeId: 'ch-6', participantId: 'p-4821', intent: 'talent', lang: 'en', format: 'prose', status: 'submitted',
      submittedAt: '2026-11-14T09:10:00+02:00', skills: ['ai-sensor-fusion', 'hw-lidar'],
      answers: {
        first: "I'd look at whether the ghosts move with the robot or stay fixed in the world. Snowflakes near the sensor move with you; real objects don't.",
        why: 'It is a cheap test with existing logs, and it separates sensor noise from real detections without a new model.',
        questions: 'How often do you clean or heat the lidar window during a route? Is there a remote operator log I could read?',
      },
      translations: {
        fi: {
          first: 'Katsoisin, liikkuvatko haamut robotin mukana vai pysyvätkö ne paikallaan maailmassa. Anturin lähellä olevat lumihiutaleet liikkuvat mukanasi, oikeat esineet eivät.',
          why: 'Se on halpa testi olemassa olevilla lokeilla, ja se erottaa anturikohinan oikeista havainnoista ilman uutta mallia.',
          questions: 'Kuinka usein lidarin ikkunaa puhdistetaan tai lämmitetään reitin aikana? Onko etäoperaattorin lokia, jota voisin lukea?',
        },
      },
    },
    {
      // Private draft: visible only to its author.
      id: 's-12', challengeId: 'ch-1', participantId: 'p-4821', intent: 'open', lang: 'en', format: 'bullets', status: 'draft',
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

  // `format` is what the conversation is about, chosen by whoever requested or invited.
  const m = (id, o) => ({ id, createdAt: '2026-11-13T12:00:00+02:00', organizerStatus: 'pending', ...o });
  const meetings = [
    m('m-1', { challengeId: 'ch-2', companyId: 'c-sillat', participantId: 'p-4821', slotId: 'sl-sillat-2', format: 'open', initiator: 'participant', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-13T17:00:00+02:00' }),
    m('m-2', { challengeId: 'ch-1', companyId: 'c-lumi', participantId: 'p-4821', slotId: 'sl-lumi-3', format: 'hiring', initiator: 'participant', partyStatus: 'requested', createdAt: '2026-11-14T10:05:00+02:00' }),
    m('m-3', { challengeId: 'ch-1', companyId: 'c-lumi', participantId: 'p-2093', slotId: 'sl-lumi-1', format: 'hiring', initiator: 'host', partyStatus: 'invited', createdAt: '2026-11-12T09:00:00+02:00' }),
    m('m-4', { challengeId: 'ch-1', companyId: 'c-lumi', participantId: 'p-1168', slotId: 'sl-lumi-2', format: 'rnd', initiator: 'host', partyStatus: 'accepted', createdAt: '2026-11-12T09:10:00+02:00' }),
    m('m-5', { challengeId: 'ch-5', companyId: 'c-tukki', participantId: 'p-5540', slotId: 'sl-tukki-1', format: 'rnd', initiator: 'participant', partyStatus: 'requested', createdAt: '2026-11-12T16:00:00+02:00' }),
    m('m-6', { challengeId: 'ch-5', companyId: 'c-tukki', participantId: 'p-3307', slotId: 'sl-tukki-2', format: 'pilot', initiator: 'participant', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-12T11:00:00+02:00' }),
    m('m-7', { challengeId: 'ch-4', companyId: 'c-qubit', participantId: 'p-8875', slotId: 'sl-qubit-1', format: 'rnd', initiator: 'participant', partyStatus: 'declined', createdAt: '2026-11-13T10:00:00+02:00' }),
    m('m-8', { challengeId: 'ch-3', companyId: 'c-kesto', participantId: 'p-9214', slotId: 'sl-kesto-1', format: 'hiring', initiator: 'host', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-13T13:00:00+02:00' }),
    m('m-9', { challengeId: 'ch-6', companyId: 'c-revon', participantId: 'p-4821', slotId: 'sl-revon-3', format: 'hiring', initiator: 'host', partyStatus: 'invited', createdAt: '2026-11-14T11:00:00+02:00' }),
    m('m-10', { challengeId: 'ch-6', companyId: 'c-revon', participantId: 'p-6612', slotId: 'sl-revon-1', format: 'hiring', initiator: 'participant', partyStatus: 'accepted', organizerStatus: 'approved', createdAt: '2026-11-12T15:30:00+02:00' }),
    m('m-11', { challengeId: 'ch-3', companyId: 'c-kesto', participantId: 'p-6612', slotId: 'sl-kesto-2', format: 'pilot', initiator: 'participant', partyStatus: 'accepted', createdAt: '2026-11-14T08:40:00+02:00' }),
  ];

  // Post-event private choices, keyed by meeting id. null = not answered yet.
  const feedback = {
    'm-1': { participant: null, host: null },
    'm-6': { participant: 'continue', host: 'continue' },
    'm-8': { participant: 'continue', host: 'notnow' },
    'm-10': { participant: 'continue', host: 'continue' },
  };

  const consents = Object.fromEntries(
    participants.map((p) => [p.id, { purpose: 'event-matchmaking', at: '2026-11-09T12:00:00+02:00' }]),
  );

  return {
    version: 2,
    event: {
      name: 'Espoo Challenge Match 2026',
      organizers: 'City of Espoo and Business Espoo',
      tracks: 'Recruitment and matchmaking',
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
