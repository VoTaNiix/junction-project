// Step-by-step guide for each side, in English, Finnish and Swedish (TEXT below). Steps follow the seeded demo data, so every one of them
// works straight after "Reset demo data". Progress ticks are a per-viewer convenience kept in
// localStorage under their own key, so resetting the demo does not clear them.
import { esc } from '../ui.js';
import { setCurrentCompany } from '../store.js';
import { ICON } from './shared.js';
import { tr, getLang } from '../i18n.js';

/** Interface text in English, Finnish and Swedish. */
const L = (en, fi, sv, vars) => tr({ en, fi, sv }, vars);

const PROGRESS_KEY = 'skillink.guide.v2';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveProgress(p) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* progress is optional */
  }
}
let progress = loadProgress();

// Tiny formatter: escape, then **bold** → <strong>. Content below is our own copy.
const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

// English text and the structure every language shares (links, companies).
const GUIDES = {
  start: {
    label: 'Start here',
    title: 'How to explore Skillink',
    intro: `Skillink matches people to a host's real problem instead of a CV or a pitch deck, at recruitment events and matchmaking events alike. You can explore it from both sides, Talent and Employer, plus the event team's view. Everything runs on made-up demo data, so nothing you try can break anything.`,
    youAre: 'Anyone visiting for the first time, including demo evaluators',
    steps: [
      {
        title: 'Switch between Talent and Employer',
        do: `Use the **Talent / Employer** switch at the top of every page. **Event team** next to it opens the organizer's view. The bar underneath tells you who you are right now, for example “You are Solver #ESP-4821”.`,
        see: `Both sides share the same event. On a challenge page, **Employer** opens that company's review dashboard. After you share, request or answer something, the message offers a **See it as …** button that shows the same thing from the other side.`,
        why: `You can follow one conversation from both sides in a few clicks.`,
        go: { href: '#/participant/board', label: 'Open the solver view' },
      },
      {
        title: 'Start over at any time',
        do: `Click **Reset demo data** in the header, then confirm. All data goes back to the original Espoo demo data. Your ticks in this guide are kept.`,
        see: `A short message confirms the reset. Use it between demo runs, or after trying the data deletion.`,
        why: `Every step in this guide is written for the original demo data.`,
      },
      {
        title: 'Five-minute tour, part 1: find challenges by format',
        do: `On the **Problem board**, scroll to **Open challenges**. In the row of format chips, click **Pilot & Project**, then **All formats**.`,
        see: `Four challenges stay: three that offer pilots, plus the Open Format one, and the count under the filters says so. Every card is a short preview with colour-coded format badges. Click one to read it in full.`,
        why: `Skillink serves hiring and matchmaking equally. A solver sees at a glance whether a host is hiring, looking for research or wants a pilot partner.`,
        go: { href: '#/participant/board', label: 'Open the problem board' },
      },
      {
        title: 'Tour, part 2: share your thinking',
        do: `Open **My workspace** and click **Continue draft** on the Lumivirta Energy microgrid challenge. Keep **Open to Discussing Best Fit**, write a line under question 2, tick the consent box and click **Share with Lumivirta Energy**.`,
        see: `A green “Shared with Lumivirta Energy” note. Click **See it as Lumivirta Energy** in the message: the host sees your answer under your solver ID only, with your intent as a badge.`,
        why: `This is the core idea: you show how you think about a real problem, not a CV or a pitch.`,
        go: { href: '#/participant/workspace', label: 'Open My workspace' },
      },
      {
        title: 'Tour, part 3: read, translate and accept as the host',
        do: `Switch to **Employer**, hosting as Lumivirta Energy. On the **Review dashboard**, turn on **EU-Hosted Machine Translation (Simulated)** under the Finnish answer from Solver #ESP-2093. Then open **Conversations** and click **Accept** on the request from Solver #ESP-4821.`,
        see: `The English translation appears next to the Finnish original. After you accept, the solver's name and email replace their ID.`,
        why: `Identities are shown only after both sides agree to meet, and translations never replace what people wrote.`,
        go: { href: '#/host/feed', company: 'c-lumi', label: 'Open as Lumivirta Energy' },
      },
      {
        title: 'Tour, part 4: approve and export as the organizer',
        do: `Click **Event team** in the header. Under **Ready for your approval**, click **Approve** on Lumivirta Energy and Solver #ESP-4821. Then open **Schedule and export** and click **Download calendar invites (.ics)**.`,
        see: `The conversation joins the schedule table with its format, Talent & Hiring, and you get a calendar file that works with Outlook, Google Calendar and Apple Calendar.`,
        why: `A person on the City of Espoo event team confirms every conversation.`,
        go: { href: '#/organizer/queue', label: 'Open the approval queue' },
      },
      {
        title: 'Tour, part 5: after the event',
        do: `Still as the organizer, open **After the event**. In any row, click **Let's continue** for both the solver and the host.`,
        see: `“Contact details exchanged” appears, and the Pilot KPI bar moves toward the 40% target.`,
        why: `Contact details are shared only when both sides want to continue, whether for a job interview, an R&D project or pilot scoping.`,
        go: { href: '#/organizer/optin', label: 'Open the opt-in simulator' },
      },
    ],
  },

  participant: {
    label: 'Talent',
    title: 'Guide for talent and solvers',
    intro: `You're a solver: a job seeker, researcher, specialist, or part of a startup or project team, looking at real problems from Espoo hosts. In the demo you are Solver #ESP-4821. You already have one draft, two shared answers, two conversation requests and one invitation waiting.`,
    youAre: 'Talent, researcher, specialist, or startup and project partner',
    steps: [
      {
        title: 'Start on the problem board',
        do: `Open **Talent**, then **Problem board**. Read the headline, then click **Browse the 6 challenges**.`,
        see: `Each card is a short preview of a real problem a host is working on: formats, title, one line, two skills and the host. Not a job ad or a procurement RFP, and nobody asks for a CV, a pitch deck, a photo or your background.`,
        why: `You're judged on how you think, not on how your CV or your deck looks.`,
        go: { href: '#/participant/board', label: 'Open the problem board' },
      },
      {
        title: 'Filter by collaboration format',
        do: `In the row of format chips, click **R&D & Co-Creation**, then **Pilot & Project**. Click **All formats** to go back.`,
        see: `Each chip shows how many challenges match. Open Format challenges appear under every format, and the count under the filters says so. Cards show their formats as badges: blue for Talent & Hiring, teal for R&D & Co-Creation, ochre for Pilot & Project, and a dashed outline for Open Format.`,
        why: `You can tell at a glance whether a host is hiring, looking for research or wants a pilot partner.`,
        go: { href: '#/participant/board', label: 'Try the format filter' },
      },
      {
        title: 'Narrow by skill and language',
        do: `Type in the search box, then open **More filters** for **ESCO skill** and **Language you can work in**. For example, set Language you can work in to Swedish.`,
        see: `Swedish leaves the challenges that accept Swedish: Sillat Digital's multilingual services and Tukki Build's material traceability. If nothing matches, you can clear all filters in one click.`,
        why: `The language badge on each challenge page shows what the work really needs, so “English is fine” means exactly that.`,
        go: { href: '#/participant/board', label: 'Try the filters' },
      },
      {
        title: 'Save challenges for later',
        do: `Click the heart on any challenge card. Click it again to remove it.`,
        see: `The heart fills in, and the challenge appears under Saved challenges in **My workspace**.`,
        why: `You can collect the ones you like before you start writing.`,
        go: { href: '#/participant/board', label: 'Save a challenge' },
      },
      {
        title: 'Open a challenge',
        do: `Click a card, for example Lumivirta Energy's **Clean energy microgrid load balancing**.`,
        see: `The challenge page has the real-world context, what makes it tricky, every ESCO skill, the language requirement and the deadline. On the right: **Show your thinking**, **Request a conversation**, and **See it as Lumivirta Energy** to switch to the employer's side.`,
        why: `The board stays short and easy to scan. The details are one click away.`,
        go: { href: '#/participant/challenge/ch-1', label: 'Open the challenge' },
      },
      {
        title: 'Use your workspace',
        do: `Open **My workspace**.`,
        see: `Your private drafts (with Continue draft and Delete draft), the thinking you've already shared with how you approached each one, your saved challenges, your conversation requests counter, and **Your data**, where you can read the consent notice or withdraw consent.`,
        why: `Drafts are private until you choose to share them. Withdrawing consent deletes your data at once, without waiting 30 days.`,
        go: { href: '#/participant/workspace', label: 'Open My workspace' },
      },
      {
        title: 'Say how you are approaching the challenge',
        do: `Click **Continue draft** on the Lumivirta Energy draft. Under **How are you approaching this challenge?**, pick one of the four options.`,
        see: `Lumivirta Energy offers Talent & Hiring and R&D & Co-Creation, so Project / Pilot / Solution Partner is greyed out and marked “Not offered for this challenge”. Open to Discussing Best Fit always works.`,
        why: `The host sees your choice as a badge next to your answers. It is never used to sort or hide anyone.`,
        go: { href: '#/participant/write/ch-1', label: 'Open the draft' },
      },
      {
        title: 'Show your thinking in three parts',
        do: `Choose **Bullet points** or **Short paragraphs**, then answer the three questions: what you'd do first, why that approach and what perspective you bring, and what critical questions you'd ask the host team.`,
        see: `Question 3 is highlighted because your questions are the heart of Skillink. Your draft saves itself as you type (“Draft saved just now”), and **Save private draft** saves it straight away.`,
        why: `Three honest bullet points count as much as polished paragraphs. Nothing scores length, grammar or style.`,
        go: { href: '#/participant/write/ch-1', label: 'Open the editor' },
      },
      {
        title: 'Write in the language you think best in',
        do: `In the editor, change **Language you're writing in** to Finnish, Swedish or Other. If you pick Other, type the language name.`,
        see: `A note repeats the host's real language requirement. Hosts can open a translation that appears next to your original words.`,
        why: `Your ideas matter more than your vocabulary. Machine translation is optional, labelled and never replaces what you wrote.`,
        go: { href: '#/participant/write/ch-1', label: 'Open the editor' },
      },
      {
        title: 'Agree to the purpose and share',
        do: `Tick the consent box (**Read the full notice** opens the whole notice), then click **Share with** and the host's name. Try sharing with an empty answer first to see how the form helps.`,
        see: `Missing parts are named in plain words, and the cursor jumps to the first one. Once shared, the challenge shows “Thinking shared”. Use **Withdraw and edit** to take it back.`,
        why: `Consent is for one purpose only: arranging conversations at this event. Your data is deleted 30 days later.`,
        go: { href: '#/participant/write/ch-1', label: 'Finish and share' },
      },
      {
        title: 'Request a conversation',
        do: `Open **Conversations**. Under **Request a new conversation**, click **Request** next to a host. Choose what the conversation would be about, pick a time and click **Send request**.`,
        see: `The format choice starts from how you approached that challenge. The counter moves from 2 / 5 to 3 / 5. At 5 / 5, the Request buttons disappear and a note explains why. **Cancel request** frees one up again.`,
        why: `Five requests each keeps conversations meaningful for solvers and hosts alike.`,
        go: { href: '#/participant/meetings', label: 'Open Conversations' },
      },
      {
        title: 'Answer an invitation',
        do: `Under **Invitations for you**, Revontuli Mobility has invited you to a Talent & Hiring conversation. Click **Accept and share my name**, or **Decline**.`,
        see: `If you accept, only Revontuli Mobility can now see your name and email. Invitations don't use any of your five requests. If you decline, the host isn't told why.`,
        why: `You stay anonymous until you decide to meet.`,
        go: { href: '#/participant/meetings', label: 'See the invitation' },
      },
      {
        title: 'Check your schedule',
        do: `Look at the **Your schedule** panel on the Conversations tab and click **Download calendar file (.ics)**.`,
        see: `Your confirmed Open Format conversation with Sillat Digital at 10:30 on event day, ready to add to your own calendar.`,
        why: `A conversation is confirmed when both sides have said yes and the City of Espoo event team has approved the time.`,
        go: { href: '#/participant/meetings', label: 'Open your schedule' },
      },
      {
        title: 'After the event: choose privately',
        do: `Under **After your conversations**, choose **Let's continue** or **Not now** for each conversation you had.`,
        see: `If you and the host both choose to continue, you see the host contact's name, role and email. Otherwise nothing is shared, and nobody learns who said not now.`,
        why: `No awkward rejections. Contact only happens when both sides want it, for a job interview, an R&D project or pilot scoping.`,
        go: { href: '#/participant/meetings', label: 'Make your choice' },
      },
      {
        title: 'Use the ecosystem support hub',
        do: `Open **Ecosystem support**. Switch between **International talent & career** and **Business, R&D & innovation** with a click or the arrow keys.`,
        see: `Work in Finland, Talent Espoo at Espoo Talent Hub, City of Espoo services and InfoFinland on the first tab. Business Espoo, Enter Espoo, Aalto University and VTT on the second, with answers about pilots, theses and starting up.`,
        why: `Both tabs are shown to everyone. Skillink never asks where you're from or how big your team is.`,
        go: { href: '#/participant/support', label: 'Open Ecosystem support' },
      },
    ],
  },

  host: {
    label: 'Employer',
    title: 'Guide for employers and challenge hosts',
    intro: `You're a hiring manager, R&D lead or innovation partner. You post a real problem from your team, say which kinds of collaboration you're open to, and read how solvers would tackle it. Skillink never scores or ranks anyone: you read the answers and decide who to talk to. The guide starts as Lumivirta Energy.`,
    youAre: 'Hiring manager, R&D lead or innovation partner at an Espoo company',
    steps: [
      {
        title: 'Choose which host you act as',
        do: `Open **Employer** and use the **Hosting as** menu in the bar under the header.`,
        see: `Six fictional Espoo hosts. Each one sees only the answers to its own challenges.`,
        why: `It makes it easy to compare how different hosts see the event.`,
        go: { href: '#/host/feed', company: 'c-lumi', label: 'Open as Lumivirta Energy' },
      },
      {
        title: 'Read the no-ranking promise',
        do: `On the **Review dashboard**, read the note at the top. Then switch between **By challenge** and **All, by time shared**.`,
        see: `Answers are always listed oldest first, either grouped by challenge or all together. There is no “best match” order, and no logos or company sizes to judge by.`,
        why: `No software ranks, scores or filters people or teams, which keeps Skillink out of the EU AI Act's high-risk category and fair to small players.`,
        go: { href: '#/host/feed', company: 'c-lumi', label: 'Open the Review dashboard' },
      },
      {
        title: 'Read answers without names',
        do: `Look at the name line of each answer and the badge next to it.`,
        see: `Solver #ESP-2093 shows only a pseudonym, with the badge Individual Talent / Career Opportunity. Daniel Okafor's real name is shown, with a green “Identity shared after you both agreed to meet”, because they accepted your invitation; their badge says Researcher / Academic / Thesis Collaboration. Each answer also lists the ESCO skills the solver says they draw on.`,
        why: `You judge the thinking first. The name comes later, and only with consent.`,
        go: { href: '#/host/feed', company: 'c-lumi', label: 'See the answers' },
      },
      {
        title: 'Translate side by side',
        do: `Under Solver #ESP-2093's Finnish answer, turn on **EU-Hosted Machine Translation (Simulated)**. For an answer with more than one translation, such as Solver #ESP-7356's Swedish answer at Sillat Digital, use the **Into** menu to choose English or Finnish.`,
        see: `The original stays on the left, and the translation on the right is labelled [EU-Hosted Machine Translation — Original Always Shown]. Turn the switch off to hide it again.`,
        why: `People can write in their strongest language, and you still see exactly what they wrote.`,
        go: { href: '#/host/feed', company: 'c-lumi', label: 'Try the translation' },
      },
      {
        title: 'Invite a solver to a conversation',
        do: `Switch to **Sillat Digital**. Under Solver #ESP-7356's answer, click **Invite to a conversation**. Check what the conversation would be about, pick one of your times and click **Send invitation**.`,
        see: `The format starts as Pilot & Project, because they're approaching it as a project partner. The answer then shows that format and “Waiting for solver”. Click **See it as Solver #ESP-7356** in the message to see the invitation on their side. Their name appears only if they accept.`,
        why: `You choose who to talk to based on what they wrote, not on who they are.`,
        go: { href: '#/host/feed', company: 'c-sillat', label: 'Open as Sillat Digital' },
      },
      {
        title: 'Answer requests from solvers',
        do: `As Lumivirta Energy, open **Conversations**. Under **Requests from solvers**, click **Accept** or **Decline** on the request from Solver #ESP-4821.`,
        see: `Accepting shows their name and email straight away and sends the conversation to the event team for approval. Declining gives the solver their request back. **See it as Solver #ESP-4821** in the message shows the result on the talent side.`,
        why: `Both sides have to say yes before anyone's identity is shared.`,
        go: { href: '#/host/meetings', company: 'c-lumi', label: 'Open Conversations' },
      },
      {
        title: 'Write a challenge in ten minutes',
        do: `Open **Post a challenge**. Under **What kind of collaboration are you open to?**, tick one or more of Hiring / open role, R&D / thesis / co-creation, B2B pilot / project partner and Open to all. Then fill in the problem title, the problem summary, the real-world context and “What makes this tricky?”.`,
        see: `Each option shows the format name and what it means. The “Ready to publish” checklist ticks off each part as you write.`,
        why: `A clear bottleneck gets better answers than a polished job ad or an RFP, and makes generic AI-written answers easy to spot.`,
        go: { href: '#/host/new', company: 'c-lumi', label: 'Open the template' },
      },
      {
        title: 'Add skills, language and a deadline',
        do: `In the ESCO skills box, type a word such as “circular”, then pick skills with the arrow keys and Enter. Set the language requirement, sector and deadline.`,
        see: `Click a skill chip to remove it. You can pick 2 to 6 skills. The language requirement decides which “Language you can work in” filter finds your challenge.`,
        why: `Skills describe the problem so solvers can find it. They are never used to rank people.`,
        go: { href: '#/host/new', company: 'c-lumi', label: 'Open the template' },
      },
      {
        title: 'Use the Business Espoo co-writing assistant',
        do: `Turn on **Request co-writing support**. Answer the three quick questions, then click **Draft my challenge from these notes**. Finish with **Check my draft**. **Fill empty fields with a starting template** is there if you'd rather start from a template.`,
        see: `Empty fields fill from your notes, with a sentence for each format you ticked, and the title gets a [bracket] to replace. The checklist suggests improvements, such as adding a number or, for a pilot, how big a first pilot could be. You can't publish while any [brackets] are left.`,
        why: `Busy hiring managers and innovation leads get a sharp first draft. The assistant follows a fixed template, not AI, and a Business Espoo advisor follows up.`,
        go: { href: '#/host/new', company: 'c-lumi', label: 'Try the assistant' },
      },
      {
        title: 'Publish and track your challenges',
        do: `Click **Publish challenge**. If anything is missing, a message says exactly what. Then open **Your challenges**.`,
        see: `Your new challenge is listed with its format badges, deadline, skills and number of answers. Click **See it as talent** in the message to open it on the problem board, marked “Co-written with Business Espoo” if you used the help.`,
        why: `Challenges go up before registration closes, so solvers have time to think.`,
        go: { href: '#/host/challenges', company: 'c-lumi', label: 'Open Your challenges' },
      },
      {
        title: 'After the event: choose privately',
        do: `Switch to **Tukki Build**, open **Conversations** and scroll to **After the event**. Choose **Let's continue** or **Not now**.`,
        see: `Each held conversation shows its format, here a Pilot & Project conversation. If you and the solver both choose to continue, you're told to get in touch. The solver never sees a “not now”.`,
        why: `Follow-up happens only when both sides want it, whether that is a job interview, an R&D project or pilot scoping.`,
        go: { href: '#/host/meetings', company: 'c-tukki', label: 'Open as Tukki Build' },
      },
    ],
  },

  organizer: {
    label: 'Event team',
    title: 'Guide for the event team',
    intro: `You run Espoo Challenge Match for the City of Espoo and Business Espoo, with a recruitment track and a matchmaking track on the same day. Every conversation is confirmed by a person on your team, and everything you measure is anonymous.`,
    youAre: 'City of Espoo and Business Espoo event team',
    steps: [
      {
        title: 'Approve conversations',
        do: `Click **Event team** in the header, then **Approval queue**. Under **Ready for your approval**, click **Approve** or **Decline**.`,
        see: `Conversations both sides already agreed to, each with its format: an R&D & Co-Creation conversation with Lumivirta Energy and a Pilot & Project one with Kestomo Industrial. The number on the tab shows how many are waiting, and your decisions appear under **Your recent decisions**.`,
        why: `People stay in control. Nothing is approved automatically.`,
        go: { href: '#/organizer/queue', label: 'Open the approval queue' },
      },
      {
        title: 'Work through one track at a time',
        do: `In the **Track** row, click **Pilot & Project**, then **All tracks**.`,
        see: `Each chip counts the open requests and invitations about that format, and the lists below show only that track.`,
        why: `One queue for hiring and matchmaking, with a quick way to focus on one kind of conversation.`,
        go: { href: '#/organizer/queue', label: 'Try the track filter' },
      },
      {
        title: 'Keep an eye on open requests',
        do: `Scroll to **Waiting for the other side**.`,
        see: `Requests and invitations where one side hasn't answered yet. You can decline one, for example to resolve a clash. Approval only becomes possible once both sides agree.`,
        why: `You can step in early without overruling anyone's choice.`,
        go: { href: '#/organizer/queue', label: 'See open requests' },
      },
      {
        title: 'Check the event-day schedule',
        do: `Open **Schedule and export**.`,
        see: `Every confirmed conversation by time, with its table at Dipoli, the host, the solver, the format and the challenge. Names appear only where both sides agreed to meet.`,
        why: `One schedule for the whole event, across both tracks.`,
        go: { href: '#/organizer/schedule', label: 'Open the schedule' },
      },
      {
        title: 'Export to calendars, Brella and Tavata',
        do: `Use the **Preview** buttons to look at the .ics, Brella CSV and Tavata JSON formats, then click a **Download** button.`,
        see: `The files are generated in your browser and nothing is sent anywhere. Each one includes the collaboration format of every conversation, and the .ics file opens in any calendar app.`,
        why: `Skillink decides who should talk and why. Brella and Tavata run the event day.`,
        go: { href: '#/organizer/schedule', label: 'Open the exports' },
      },
      {
        title: 'Read the event insights',
        do: `Open **Insights**.`,
        see: `Totals, then **Hiring, R&D and pilot interest**: for each format, how many challenges offer it, how many approaches came from solvers approaching it that way, and how many conversations were confirmed. Below that: responses per challenge, top ESCO skills in demand, unmet ecosystem needs (in amber) and the languages people wrote in.`,
        why: `Unmet ecosystem needs show where Espoo could focus training, research calls or future events. Every figure is a count, never a person or team.`,
        go: { href: '#/organizer/insights', label: 'Open Insights' },
      },
      {
        title: 'Run the post-event opt-in',
        do: `Open **After the event**. Each row shows the solver's private choice, the host's private choice and the result. Click **Let's continue** or **Not now** on each side.`,
        see: `When both choose to continue, “Contact details exchanged” appears with both contacts. When either says not now, you see “No contact shared”, without saying who. **Clear all choices** starts again.`,
        why: `The simulator lets you play both sides. At a real event, each person answers on their own device.`,
        go: { href: '#/organizer/optin', label: 'Open the simulator' },
      },
      {
        title: 'Track the 40% pilot target',
        do: `Watch the **Pilot KPI** panel while you change choices.`,
        see: `The bar shows the share of held conversations, in every format, where both sides chose to continue, with a line at 40%. It turns green at or above the target and amber below it, and tells you how many more mutual opt-ins you need.`,
        why: `This is the pilot's main success measure.`,
        go: { href: '#/organizer/optin', label: 'See the KPI' },
      },
      {
        title: 'Make a value report for a host',
        do: `Open **Company reports**, pick a host, then click **Print or save as PDF** or **Download report (HTML)**.`,
        see: `Who engaged with the challenge (talent, researchers, pilot partners or open to the best fit), the path from interest to conversation, the themes of the questions solvers asked, and meeting outcomes by format.`,
        why: `Hosts see what they got from the event. Themes are grouped from a published keyword list and describe questions, never people.`,
        go: { href: '#/organizer/reports', label: 'Open Company reports' },
      },
    ],
  },

};

// Finnish and Swedish text for the same steps, in the same order. Each step is
// [title, do, see, why, "Try it" label]. Links and companies come from the English GUIDES above.
// Bold **labels** match the interface text in that language exactly.
const TEXT = {
  fi: {
    start: {
      label: 'Aloita tästä',
      title: 'Näin tutustut Skillinkiin',
      intro: 'Skillink yhdistää ihmiset yrityksen todelliseen ongelmaan ansioluettelon tai pitch deckin sijaan, niin rekrytointi- kuin matchmaking-tapahtumissa. Voit tutustua siihen molemmilta puolilta, osaajien ja työnantajien, sekä tapahtumatiimin näkymästä. Kaikki toimii keksityllä demodatalla, joten mitään ei voi rikkoa.',
      youAre: 'Kaikki ensikertalaiset, myös demon arvioijat',
      steps: [
        ['Vaihda osaajan ja työnantajan välillä', 'Käytä jokaisen sivun yläosan **Osaajat / Työnantaja** -valitsinta. Sen vieressä oleva **Tapahtumatiimi** avaa järjestäjän näkymän. Alla oleva palkki kertoo, kuka olet juuri nyt, esimerkiksi ”Olet Solver #ESP-4821”.', 'Molemmat puolet jakavat saman tapahtuman. Haasteen sivulla **Työnantaja** avaa kyseisen yrityksen arviointinäkymän. Kun jaat, pyydät tai vastaat jotain, ilmoituksessa on **Katso tilinä …** -painike, joka näyttää saman asian toiselta puolelta.', 'Voit seurata yhtä keskustelua molemmilta puolilta muutamalla napsautuksella.', 'Avaa ratkaisijan näkymä'],
        ['Aloita alusta milloin tahansa', 'Napsauta ylätunnisteen **Palauta demodata** ja vahvista. Kaikki tiedot palautuvat Espoon alkuperäiseen demodataan. Tämän oppaan rastisi säilyvät.', 'Lyhyt viesti vahvistaa palautuksen. Käytä sitä demokertojen välillä.', 'Jokainen tämän oppaan vaihe on kirjoitettu alkuperäiselle demodatalle.', ''],
        ['Viiden minuutin kierros, osa 1: etsi haasteita muodon mukaan', 'Vieritä **Haastetaululla** kohtaan **Avoimet haasteet**. Napsauta muotopainikkeiden rivillä **Pilot & Project** ja sitten **Kaikki muodot**.', 'Neljä haastetta jää: kolme pilotteja tarjoavaa ja Open Format -haaste, ja suodattimien alla oleva luku kertoo sen. Jokainen kortti on lyhyt esikatselu värikoodatuin muotomerkein. Avaa kortti lukeaksesi koko haasteen.', 'Skillink palvelee rekrytointia ja matchmakingia tasapuolisesti. Ratkaisija näkee yhdellä silmäyksellä, rekrytoiko yritys, etsiikö se tutkimusta vai pilottikumppania.', 'Avaa haastetaulu'],
        ['Kierros, osa 2: jaa ajattelusi', 'Avaa **Oma työtila** ja napsauta **Jatka luonnosta** Lumivirta Energyn mikroverkkohaasteessa. Pidä valintana **Avoin keskustelemaan parhaasta muodosta**, kirjoita rivi kysymykseen 2, rastita suostumusruutu ja napsauta **Jaa yritykselle Lumivirta Energy**.', 'Vihreä ilmoitus ”Jaettu yritykselle Lumivirta Energy”. Napsauta viestin **Katso tilinä Lumivirta Energy**: yritys näkee vastauksesi vain ratkaisijatunnuksesi alla, lähestymistapasi merkkinä.', 'Tämä on ydinajatus: näytät, miten ajattelet todellista ongelmaa, et CV:tä tai pitchiä.', 'Avaa Oma työtila'],
        ['Kierros, osa 3: lue, käännä ja hyväksy yrityksenä', 'Vaihda **Työnantaja**-puolelle yrityksenä Lumivirta Energy. Kytke **Arviointinäkymässä** päälle **EU:ssa ylläpidetty konekäännös (simuloitu)** Solver #ESP-2093:n suomenkielisen vastauksen alla. Avaa sitten **Keskustelut** ja napsauta **Hyväksy** Solver #ESP-4821:n pyynnössä.', 'Englanninkielinen käännös näkyy suomenkielisen alkuperäisen vieressä. Hyväksymisen jälkeen ratkaisijan nimi ja sähköposti korvaavat tunnuksen.', 'Henkilöllisyys näytetään vasta, kun molemmat ovat sopineet tapaamisesta, eikä käännös koskaan korvaa sitä, mitä ihmiset kirjoittivat.', 'Avaa Lumivirta Energynä'],
        ['Kierros, osa 4: hyväksy ja vie järjestäjänä', 'Napsauta ylätunnisteen **Tapahtumatiimi**. Napsauta kohdassa **Odottaa hyväksyntääsi** **Hyväksy** riviltä Lumivirta Energy ja Solver #ESP-4821. Avaa sitten **Aikataulu ja vienti** ja napsauta **Lataa kalenterikutsut (.ics)**.', 'Keskustelu lisätään aikataulutaulukkoon muotoineen (Talent & Hiring), ja saat kalenteritiedoston, joka toimii Outlookissa, Google Kalenterissa ja Apple Kalenterissa.', 'Espoon kaupungin tapahtumatiimin jäsen vahvistaa jokaisen keskustelun.', 'Avaa hyväksyntäjono'],
        ['Kierros, osa 5: tapahtuman jälkeen', 'Avaa edelleen järjestäjänä **Tapahtuman jälkeen**. Napsauta millä tahansa rivillä **Jatketaan** sekä ratkaisijalle että yritykselle.', '”Yhteystiedot vaihdettu” tulee näkyviin, ja pilotin mittari liikkuu kohti 40 %:n tavoitetta.', 'Yhteystiedot jaetaan vain, kun molemmat haluavat jatkaa, oli kyse työhaastattelusta, T&K-projektista tai pilotin rajauksesta.', 'Avaa suostumussimulaattori'],
      ],
    },
    participant: {
      label: 'Osaajat',
      title: 'Opas osaajille ja ratkaisijoille',
      intro: 'Olet ratkaisija: työnhakija, tutkija, asiantuntija tai osa startup- tai projektitiimiä, ja tutustut espoolaisten yritysten todellisiin ongelmiin. Demossa olet Solver #ESP-4821. Sinulla on jo yksi luonnos, kaksi jaettua vastausta, kaksi keskustelupyyntöä ja yksi odottava kutsu.',
      youAre: 'Osaaja, tutkija, asiantuntija tai startup- ja projektikumppani',
      steps: [
        ['Aloita haastetaululta', 'Avaa **Osaajat** ja sitten **Haastetaulu**. Lue otsikko ja napsauta **Selaa 6 haastetta**.', 'Jokainen kortti on lyhyt esikatselu todellisesta ongelmasta, jonka parissa yritys työskentelee: muodot, otsikko, yksi rivi, kaksi taitoa ja yritys. Ei työpaikkailmoitus eikä tarjouspyyntö, eikä kukaan kysy CV:tä, pitch deckiä, valokuvaa tai taustaasi.', 'Sinua arvioidaan sen perusteella, miten ajattelet, ei sen mukaan, miltä CV:si tai deckisi näyttää.', 'Avaa haastetaulu'],
        ['Suodata yhteistyömuodon mukaan', 'Napsauta muotopainikkeiden rivillä **R&D & Co-Creation** ja sitten **Pilot & Project**. Palaa napsauttamalla **Kaikki muodot**.', 'Jokainen painike näyttää, montako haastetta vastaa. Open Format -haasteet näkyvät jokaisen muodon alla, ja suodattimien alla oleva luku kertoo sen. Kortit näyttävät muotonsa merkkeinä: sininen Talent & Hiring, sinivihreä R&D & Co-Creation, okra Pilot & Project ja katkoviivareunus Open Format.', 'Näet yhdellä silmäyksellä, rekrytoiko yritys, etsiikö se tutkimusta vai pilottikumppania.', 'Kokeile muotosuodatinta'],
        ['Rajaa taidon ja kielen mukaan', 'Kirjoita hakukenttään ja avaa sitten **Lisää suodattimia**, josta löytyvät **ESCO-taito** ja **Kieli, jolla voit työskennellä**. Valitse esimerkiksi kieleksi Ruotsi.', 'Ruotsi jättää jäljelle ruotsia hyväksyvät haasteet: Sillat Digitalin monikieliset palvelut ja Tukki Buildin materiaalien jäljitettävyyden. Jos mikään ei vastaa, voit tyhjentää suodattimet yhdellä napsautuksella.', 'Haasteen sivun kielimerkki kertoo, mitä työ todella vaatii, joten ”Englanti käy” tarkoittaa juuri sitä.', 'Kokeile suodattimia'],
        ['Tallenna haasteita myöhemmäksi', 'Napsauta minkä tahansa haastekortin sydäntä. Poista tallennus napsauttamalla uudelleen.', 'Sydän täyttyy, ja haaste näkyy kohdassa Tallennetut haasteet **Oma työtila** -näkymässä.', 'Voit kerätä mieluisat haasteet ennen kuin alat kirjoittaa.', 'Tallenna haaste'],
        ['Avaa haaste', 'Napsauta korttia, esimerkiksi Lumivirta Energyn **Clean energy microgrid load balancing**.', 'Haasteen sivulla ovat todellinen tausta, mikä tekee siitä hankalaa, kaikki ESCO-taidot, kielivaatimus ja määräaika. Oikealla: **Näytä ajattelusi**, **Pyydä keskustelua** ja **Katso tilinä Lumivirta Energy**, joka vaihtaa työnantajan puolelle.', 'Taulu pysyy lyhyenä ja helppolukuisena. Yksityiskohdat ovat yhden napsautuksen päässä.', 'Avaa haaste'],
        ['Käytä työtilaasi', 'Avaa **Oma työtila**.', 'Yksityiset luonnoksesi (Jatka luonnosta ja Poista luonnos), jo jakamasi ajattelu ja miten lähestyit kutakin, tallennetut haasteesi, keskustelupyyntöjen laskuri sekä **Tietosi**, jossa voit lukea suostumusilmoituksen tai perua suostumuksen.', 'Luonnokset ovat yksityisiä, kunnes päätät jakaa ne. Suostumuksen peruminen poistaa tietosi heti odottamatta 30 päivää.', 'Avaa Oma työtila'],
        ['Kerro, miten lähestyt haastetta', 'Napsauta **Jatka luonnosta** Lumivirta Energyn luonnoksessa. Valitse kohdassa **Miten lähestyt tätä haastetta?** yksi neljästä vaihtoehdosta.', 'Lumivirta Energy tarjoaa muotoja Talent & Hiring ja R&D & Co-Creation, joten Projekti- / pilotti- / ratkaisukumppani on harmaana ja merkitty ”Ei tarjolla tässä haasteessa”. Avoin keskustelemaan parhaasta muodosta toimii aina.', 'Yritys näkee valintasi merkkinä vastaustesi vieressä. Sitä ei koskaan käytetä kenenkään järjestämiseen tai piilottamiseen.', 'Avaa luonnos'],
        ['Näytä ajattelusi kolmessa osassa', 'Valitse **Ranskalaiset viivat** tai **Lyhyet kappaleet** ja vastaa kolmeen kysymykseen: mitä tekisit ensin, miksi juuri niin ja millaista näkökulmaa tuot, sekä mitä kriittisiä kysymyksiä esittäisit yrityksen tiimille.', 'Kysymys 3 on korostettu, koska kysymyksesi ovat Skillinkin ydin. Luonnos tallentuu kirjoittaessasi (”Luonnos tallennettu juuri nyt”), ja **Tallenna yksityinen luonnos** tallentaa sen heti.', 'Kolme rehellistä ranskalaista viivaa on yhtä arvokas kuin hiotut kappaleet. Mikään ei pisteytä pituutta, kielioppia tai tyyliä.', 'Avaa editori'],
        ['Kirjoita kielellä, jolla ajattelet parhaiten', 'Vaihda editorissa **Kieli, jolla kirjoitat** suomeksi, ruotsiksi tai muuksi. Jos valitset muun, kirjoita kielen nimi.', 'Huomautus toistaa yrityksen todellisen kielivaatimuksen. Yritykset voivat avata käännöksen, joka näkyy alkuperäisen tekstisi vieressä.', 'Ideasi ovat tärkeämpiä kuin sanavarastosi. Konekäännös on valinnainen, merkitty eikä koskaan korvaa sitä, mitä kirjoitit.', 'Avaa editori'],
        ['Hyväksy käyttötarkoitus ja jaa', 'Rastita suostumusruutu (**Lue koko ilmoitus** avaa koko ilmoituksen) ja napsauta **Jaa yritykselle** ja yrityksen nimi. Kokeile ensin jakaa tyhjällä vastauksella nähdäksesi, miten lomake auttaa.', 'Puuttuvat osat nimetään selkokielellä, ja kohdistin siirtyy ensimmäiseen. Jaon jälkeen haasteessa lukee ”Ajattelu jaettu”. **Peru jako ja muokkaa** palauttaa sen luonnokseksi.', 'Suostumus koskee vain yhtä tarkoitusta: keskustelujen järjestämistä tässä tapahtumassa. Tietosi poistetaan 30 päivää myöhemmin.', 'Viimeistele ja jaa'],
        ['Pyydä keskustelua', 'Avaa **Keskustelut**. Napsauta kohdassa **Pyydä uutta keskustelua** **Pyydä** yrityksen kohdalla. Valitse keskustelun aihe ja aika ja napsauta **Lähetä pyyntö**.', 'Muodon valinta lähtee siitä, miten lähestyit haastetta. Laskuri muuttuu 2 / 5:stä 3 / 5:een. Kun 5 / 5 on täynnä, Pyydä-painikkeet katoavat ja huomautus kertoo syyn. **Peru pyyntö** vapauttaa yhden taas.', 'Viisi pyyntöä kullekin pitää keskustelut merkityksellisinä niin ratkaisijoille kuin yrityksille.', 'Avaa Keskustelut'],
        ['Vastaa kutsuun', 'Kohdassa **Kutsut sinulle** Revontuli Mobility on kutsunut sinut Talent & Hiring -keskusteluun. Napsauta **Hyväksy ja jaa nimeni** tai **Kieltäydy**.', 'Jos hyväksyt, vain Revontuli Mobility näkee nyt nimesi ja sähköpostisi. Kutsut eivät kuluta viittä pyyntöäsi. Jos kieltäydyt, yritykselle ei kerrota syytä.', 'Pysyt nimettömänä, kunnes päätät tavata.', 'Katso kutsu'],
        ['Tarkista aikataulusi', 'Katso Keskustelut-välilehden **Aikataulusi**-paneelia ja napsauta **Lataa kalenteritiedosto (.ics)**.', 'Vahvistettu Open Format -keskustelusi Sillat Digitalin kanssa tapahtumapäivänä klo 10.30, valmiina lisättäväksi omaan kalenteriisi.', 'Keskustelu vahvistuu, kun molemmat ovat sanoneet kyllä ja Espoon kaupungin tapahtumatiimi on hyväksynyt ajan.', 'Avaa aikataulusi'],
        ['Tapahtuman jälkeen: valitse yksityisesti', 'Valitse kohdassa **Keskustelujesi jälkeen** jokaiselle käydylle keskustelulle **Jatketaan** tai **Ei nyt**.', 'Jos sinä ja yritys molemmat haluatte jatkaa, näet yrityksen yhteyshenkilön nimen, roolin ja sähköpostin. Muuten mitään ei jaeta, eikä kukaan saa tietää, kuka sanoi ”ei nyt”.', 'Ei kiusallisia hylkäyksiä. Yhteydenotto tapahtuu vain, kun molemmat haluavat, oli kyse työhaastattelusta, T&K-projektista tai pilotin rajauksesta.', 'Tee valintasi'],
        ['Käytä ekosysteemin tukea', 'Avaa **Ekosysteemin tuki**. Vaihda välilehtien **Kansainväliset osaajat ja ura** ja **Liiketoiminta, T&K ja innovaatiot** välillä napsauttamalla tai nuolinäppäimillä.', 'Ensimmäisellä välilehdellä Work in Finland, Talent Espoo Espoo Talent Hubissa, Espoon kaupungin palvelut ja InfoFinland. Toisella Business Espoo, Enter Espoo, Aalto-yliopisto ja VTT sekä vastauksia piloteista, opinnäytetöistä ja yrityksen perustamisesta.', 'Molemmat välilehdet näytetään kaikille. Skillink ei koskaan kysy, mistä olet kotoisin tai kuinka suuri tiimisi on.', 'Avaa Ekosysteemin tuki'],
      ],
    },
    host: {
      label: 'Työnantajat',
      title: 'Opas työnantajille ja haasteiden julkaisijoille',
      intro: 'Olet rekrytoiva esihenkilö, T&K-vetäjä tai innovaatiokumppani. Julkaiset tiimisi todellisen ongelman, kerrot, millaiselle yhteistyölle olette avoimia, ja luet, miten ratkaisijat tarttuisivat siihen. Skillink ei koskaan pisteytä tai järjestä ketään: sinä luet vastaukset ja päätät, kenen kanssa keskustelet. Opas alkaa Lumivirta Energynä.',
      youAre: 'Rekrytoiva esihenkilö, T&K-vetäjä tai innovaatiokumppani espoolaisessa yrityksessä',
      steps: [
        ['Valitse, minkä yrityksen nimissä toimit', 'Avaa **Työnantaja** ja käytä ylätunnisteen alla olevan palkin **Toimit yrityksenä** -valikkoa.', 'Kuusi kuvitteellista espoolaista yritystä. Kukin näkee vain omien haasteidensa vastaukset.', 'Näin on helppo verrata, miten eri yritykset näkevät tapahtuman.', 'Avaa Lumivirta Energynä'],
        ['Lue lupaus ilman järjestämistä', 'Lue **Arviointinäkymän** yläosan huomautus. Vaihda sitten **Haasteittain**- ja **Kaikki jakamisajan mukaan** -näkymien välillä.', 'Vastaukset näytetään aina vanhin ensin, joko haasteittain ryhmiteltynä tai kaikki yhdessä. Ei ”paras osuma” -järjestystä eikä logoja tai yritysten kokoja arvioinnin pohjaksi.', 'Mikään ohjelmisto ei järjestä, pisteytä tai suodata ihmisiä tai tiimejä, mikä pitää Skillinkin EU:n tekoälysäädöksen suuririskisen luokan ulkopuolella ja reiluna pienille toimijoille.', 'Avaa arviointinäkymä'],
        ['Lue vastaukset ilman nimiä', 'Katso kunkin vastauksen nimirivi ja sen vieressä oleva merkki.', 'Solver #ESP-2093 näkyy vain pseudonyyminä merkillä Yksittäinen osaaja / uramahdollisuus. Daniel Okaforin oikea nimi näkyy vihreän tekstin ”Henkilöllisyys jaettu, kun sovitte tapaamisesta” kanssa, koska hän hyväksyi kutsusi; hänen merkkinsä on Tutkija / akateeminen / opinnäytetyöyhteistyö. Jokaisessa vastauksessa näkyvät myös ESCO-taidot, joita ratkaisija kertoo hyödyntävänsä.', 'Arvioit ensin ajattelun. Nimi tulee myöhemmin, ja vain suostumuksella.', 'Katso vastaukset'],
        ['Käännä rinnakkain', 'Kytke Solver #ESP-2093:n suomenkielisen vastauksen alla päälle **EU:ssa ylläpidetty konekäännös (simuloitu)**. Jos vastauksella on useampi käännös, kuten Solver #ESP-7356:n ruotsinkielisellä vastauksella Sillat Digitalissa, valitse **Kielelle**-valikosta englanti tai suomi.', 'Alkuperäinen pysyy vasemmalla, ja oikealla oleva käännös on merkitty [EU:ssa ylläpidetty konekäännös — alkuperäinen näkyy aina]. Kytke valinta pois piilottaaksesi sen.', 'Ihmiset voivat kirjoittaa vahvimmalla kielellään, ja näet silti tarkalleen, mitä he kirjoittivat.', 'Kokeile käännöstä'],
        ['Kutsu ratkaisija keskusteluun', 'Vaihda yritykseksi **Sillat Digital**. Napsauta Solver #ESP-7356:n vastauksen alla **Kutsu keskusteluun**. Tarkista keskustelun aihe, valitse yksi ajoistasi ja napsauta **Lähetä kutsu**.', 'Muoto on aluksi Pilot & Project, koska ratkaisija lähestyy haastetta projektikumppanina. Vastauksessa näkyy sitten muoto ja ”Odottaa ratkaisijaa”. Napsauta viestin **Katso tilinä Solver #ESP-7356** nähdäksesi kutsun hänen puolellaan. Nimi näkyy vain, jos hän hyväksyy.', 'Valitset keskustelukumppanin sen perusteella, mitä hän kirjoitti, et sen mukaan, kuka hän on.', 'Avaa Sillat Digitalina'],
        ['Vastaa ratkaisijoiden pyyntöihin', 'Avaa Lumivirta Energynä **Keskustelut**. Napsauta kohdassa **Ratkaisijoiden pyynnöt** **Hyväksy** tai **Hylkää** Solver #ESP-4821:n pyynnössä.', 'Hyväksyminen näyttää nimen ja sähköpostin heti ja lähettää keskustelun tapahtumatiimin hyväksyttäväksi. Hylkääminen palauttaa ratkaisijalle hänen pyyntönsä. Viestin **Katso tilinä Solver #ESP-4821** näyttää tuloksen osaajan puolella.', 'Molempien on sanottava kyllä ennen kuin kenenkään henkilöllisyys jaetaan.', 'Avaa Keskustelut'],
        ['Kirjoita haaste kymmenessä minuutissa', 'Avaa **Julkaise haaste**. Rastita kohdassa **Millaiselle yhteistyölle olette avoimia?** yksi tai useampi: Rekrytointi / avoin tehtävä, T&K / opinnäytetyö / yhteiskehittäminen, B2B-pilotti / projektikumppani ja Avoin kaikille. Täytä sitten ongelman otsikko, tiivistelmä, todellinen tausta ja ”Mikä tästä tekee hankalaa?”.', 'Jokainen vaihtoehto näyttää muodon nimen ja merkityksen. Tarkistuslista ”Valmis julkaistavaksi” kuittaa osat sitä mukaa kuin kirjoitat.', 'Selkeä pullonkaula tuo parempia vastauksia kuin hiottu työpaikkailmoitus tai tarjouspyyntö, ja geneeriset tekoälyn kirjoittamat vastaukset erottuvat helposti.', 'Avaa pohja'],
        ['Lisää taidot, kieli ja määräaika', 'Kirjoita ESCO-taitojen kenttään sana, kuten ”kierto”, ja valitse taidot nuolinäppäimillä ja Enterillä. Aseta kielivaatimus, toimiala ja määräaika.', 'Poista taito napsauttamalla sen painiketta. Voit valita 2–6 taitoa. Kielivaatimus ratkaisee, millä ”Kieli, jolla voit työskennellä” -suodattimella haasteesi löytyy.', 'Taidot kuvaavat ongelmaa, jotta ratkaisijat löytävät sen. Niitä ei koskaan käytetä ihmisten järjestämiseen.', 'Avaa pohja'],
        ['Käytä Business Espoon kirjoitusapua', 'Kytke päälle **Pyydä kirjoitusapua**. Vastaa kolmeen nopeaan kysymykseen ja napsauta **Luonnostele haaste näistä muistiinpanoista**. Viimeistele **Tarkista luonnokseni** -toiminnolla. **Täytä tyhjät kentät aloituspohjalla** on käytettävissä, jos haluat aloittaa pohjasta.', 'Tyhjät kentät täyttyvät muistiinpanoistasi, ja jokaiselle valitsemallesi muodolle tulee oma lauseensa. Otsikkoon tulee [hakasulje] korvattavaksi. Tarkistuslista ehdottaa parannuksia, kuten luvun lisäämistä tai pilotin kohdalla ensimmäisen pilotin laajuutta. Et voi julkaista, jos [hakasulkeita] on jäljellä.', 'Kiireiset esihenkilöt ja innovaatiovetäjät saavat terävän ensimmäisen luonnoksen. Avustaja noudattaa kiinteää pohjaa, ei tekoälyä, ja Business Espoon neuvoja jatkaa siitä.', 'Kokeile avustajaa'],
        ['Julkaise ja seuraa haasteitasi', 'Napsauta **Julkaise haaste**. Jos jotain puuttuu, viesti kertoo tarkalleen mitä. Avaa sitten **Omat haasteet**.', 'Uusi haasteesi näkyy listassa muotomerkkeineen, määräaikoineen, taitoineen ja vastausmäärineen. Napsauta viestin **Katso osaajana** avataksesi sen haastetaululla, merkittynä ”Kirjoitettu yhdessä Business Espoon kanssa”, jos käytit apua.', 'Haasteet julkaistaan ennen ilmoittautumisen päättymistä, jotta ratkaisijoilla on aikaa ajatella.', 'Avaa Omat haasteet'],
        ['Tapahtuman jälkeen: valitse yksityisesti', 'Vaihda yritykseksi **Tukki Build**, avaa **Keskustelut** ja vieritä kohtaan **Tapahtuman jälkeen**. Valitse **Jatketaan** tai **Ei nyt**.', 'Jokainen käyty keskustelu näyttää muotonsa, tässä Pilot & Project -keskustelu. Jos sinä ja ratkaisija molemmat haluatte jatkaa, sinua kehotetaan ottamaan yhteyttä. Ratkaisija ei koskaan näe ”ei nyt” -vastausta.', 'Jatko tapahtuu vain, kun molemmat haluavat, oli kyse työhaastattelusta, T&K-projektista tai pilotin rajauksesta.', 'Avaa Tukki Buildina'],
      ],
    },
    organizer: {
      label: 'Tapahtumatiimi',
      title: 'Opas tapahtumatiimille',
      intro: 'Järjestät Espoo Challenge Matchin Espoon kaupungin ja Business Espoon puolesta, ja samana päivänä on sekä rekrytointi- että matchmaking-polku. Tiimisi jäsen vahvistaa jokaisen keskustelun, ja kaikki mittaamasi on anonyymia.',
      youAre: 'Espoon kaupungin ja Business Espoon tapahtumatiimi',
      steps: [
        ['Hyväksy keskusteluja', 'Napsauta ylätunnisteen **Tapahtumatiimi** ja sitten **Hyväksyntäjono**. Napsauta kohdassa **Odottaa hyväksyntääsi** **Hyväksy** tai **Hylkää**.', 'Keskustelut, joihin molemmat ovat jo suostuneet, kukin muotoineen: R&D & Co-Creation -keskustelu Lumivirta Energyn kanssa ja Pilot & Project -keskustelu Kestomo Industrialin kanssa. Välilehden luku kertoo, montako odottaa, ja päätöksesi näkyvät kohdassa **Viimeisimmät päätöksesi**.', 'Ihmiset päättävät. Mitään ei hyväksytä automaattisesti.', 'Avaa hyväksyntäjono'],
        ['Käsittele yksi polku kerrallaan', 'Napsauta **Polku**-rivillä **Pilot & Project** ja sitten **Kaikki polut**.', 'Jokainen painike laskee kyseisen muodon avoimet pyynnöt ja kutsut, ja alla olevat listat näyttävät vain sen polun.', 'Yksi jono rekrytoinnille ja matchmakingille, ja nopea tapa keskittyä yhteen keskustelutyyppiin.', 'Kokeile polkusuodatinta'],
        ['Seuraa avoimia pyyntöjä', 'Vieritä kohtaan **Odottaa toista osapuolta**.', 'Pyynnöt ja kutsut, joihin toinen osapuoli ei ole vielä vastannut. Voit hylätä niitä esimerkiksi päällekkäisyyden ratkaisemiseksi. Hyväksyntä on mahdollista vasta, kun molemmat ovat samaa mieltä.', 'Voit puuttua ajoissa ohittamatta kenenkään valintaa.', 'Katso avoimet pyynnöt'],
        ['Tarkista tapahtumapäivän aikataulu', 'Avaa **Aikataulu ja vienti**.', 'Jokainen vahvistettu keskustelu ajan mukaan: pöytä Dipolissa, yritys, ratkaisija, muoto ja haaste. Nimet näkyvät vain, kun molemmat ovat sopineet tapaamisesta.', 'Yksi aikataulu koko tapahtumalle molemmilla poluilla.', 'Avaa aikataulu'],
        ['Vie kalentereihin, Brellaan ja Tavataan', 'Katso **Esikatselu**-painikkeilla .ics-, Brella CSV- ja Tavata JSON -muotoja ja napsauta sitten **Lataa**-painiketta.', 'Tiedostot luodaan selaimessasi, eikä mitään lähetetä minnekään. Jokainen sisältää kunkin keskustelun yhteistyömuodon, ja .ics-tiedosto aukeaa missä tahansa kalenterisovelluksessa.', 'Skillink ratkaisee, kenen pitäisi keskustella ja miksi. Brella ja Tavata pyörittävät tapahtumapäivää.', 'Avaa viennit'],
        ['Lue tapahtuman tilastot', 'Avaa **Tilastot**.', 'Kokonaisluvut ja sitten **Kiinnostus rekrytointiin, T&K:hon ja pilotteihin**: kunkin muodon osalta, montako haastetta sitä tarjoaa, montako vastausta tuli sitä kautta lähestyviltä ratkaisijoilta ja montako keskustelua vahvistettiin. Sen alla: vastaukset haasteittain, kysytyimmät ESCO-taidot, täyttymättömät ekosysteemin tarpeet (keltaisella) ja kielet, joilla vastattiin.', 'Täyttymättömät tarpeet näyttävät, mihin Espoo voisi kohdistaa koulutusta, tutkimushakuja tai tulevia tapahtumia. Jokainen luku on määrä, ei koskaan henkilö tai tiimi.', 'Avaa Tilastot'],
        ['Aja tapahtuman jälkeinen suostumus', 'Avaa **Tapahtuman jälkeen**. Jokainen rivi näyttää ratkaisijan yksityisen valinnan, yrityksen yksityisen valinnan ja lopputuloksen. Napsauta kummallakin puolella **Jatketaan** tai **Ei nyt**.', 'Kun molemmat haluavat jatkaa, ”Yhteystiedot vaihdettu” tulee näkyviin molempien yhteystietoineen. Kun jompikumpi sanoo ”ei nyt”, näet ”Yhteystietoja ei jaettu” kertomatta, kumpi. **Tyhjennä kaikki valinnat** aloittaa alusta.', 'Simulaattorilla voit toimia molempina osapuolina. Oikeassa tapahtumassa jokainen vastaa omalla laitteellaan.', 'Avaa simulaattori'],
        ['Seuraa pilotin 40 %:n tavoitetta', 'Seuraa **Pilotin mittari** -paneelia muuttaessasi valintoja.', 'Palkki näyttää niiden käytyjen keskustelujen osuuden kaikissa muodoissa, joissa molemmat halusivat jatkaa, ja 40 %:n kohdalla on viiva. Palkki muuttuu vihreäksi tavoitteessa tai sen yli ja keltaiseksi sen alla ja kertoo, montako molemminpuolista suostumusta vielä tarvitaan.', 'Tämä on pilotin tärkein onnistumisen mittari.', 'Katso mittari'],
        ['Tee yritykselle arvoraportti', 'Avaa **Yritysraportit**, valitse yritys ja napsauta **Tulosta tai tallenna PDF:nä** tai **Lataa raportti (HTML)**.', 'Ketkä tarttuivat haasteeseen (osaajat, tutkijat, pilottikumppanit tai parhaalle muodolle avoimet), polku kiinnostuksesta keskusteluun, ratkaisijoiden kysymysten teemat ja tapaamisten tulokset muodoittain.', 'Yritykset näkevät, mitä ne saivat tapahtumasta. Teemat ryhmitellään julkaistun avainsanalistan mukaan ja kuvaavat kysymyksiä, eivät ihmisiä.', 'Avaa Yritysraportit'],
      ],
    },
  },
  sv: {
    start: {
      label: 'Börja här',
      title: 'Så utforskar du Skillink',
      intro: 'Skillink matchar människor med en värds verkliga problem i stället för med ett CV eller ett pitchdeck, både på rekryterings- och matchmakingevenemang. Du kan utforska det från båda sidor, talanger och arbetsgivare, plus evenemangsteamets vy. Allt körs på påhittade demodata, så inget du provar kan gå sönder.',
      youAre: 'Alla som besöker för första gången, även de som utvärderar demon',
      steps: [
        ['Växla mellan talang och arbetsgivare', 'Använd växeln **Talanger / Arbetsgivare** högst upp på varje sida. **Evenemangsteamet** bredvid den öppnar arrangörens vy. Fältet under visar vem du är just nu, till exempel ”Du är Solver #ESP-4821”.', 'Båda sidorna delar samma evenemang. På en utmanings sida öppnar **Arbetsgivare** företagets granskningsvy. När du delar, ber om eller svarar på något har meddelandet knappen **Se det som …** som visar samma sak från andra sidan.', 'Du kan följa ett samtal från båda sidor med några klick.', 'Öppna lösarens vy'],
        ['Börja om när som helst', 'Klicka på **Återställ demodata** i sidhuvudet och bekräfta. Alla data återgår till Esbos ursprungliga demodata. Dina bockar i den här guiden sparas.', 'Ett kort meddelande bekräftar återställningen. Använd det mellan demokörningar.', 'Varje steg i guiden är skrivet för de ursprungliga demodata.', ''],
        ['Femminuterstur, del 1: hitta utmaningar efter format', 'Skrolla till **Öppna utmaningar** på **Utmaningstavlan**. Klicka på **Pilot & Project** i raden med formatknappar och sedan på **Alla format**.', 'Fyra utmaningar finns kvar: tre som erbjuder piloter plus den med Open Format, och antalet under filtren säger det. Varje kort är en kort förhandsvisning med färgkodade formatmärken. Klicka på ett för att läsa hela utmaningen.', 'Skillink betjänar rekrytering och matchmaking lika mycket. En lösare ser direkt om en värd rekryterar, söker forskning eller vill ha en pilotpartner.', 'Öppna utmaningstavlan'],
        ['Tur, del 2: dela ditt tänkande', 'Öppna **Min arbetsyta** och klicka på **Fortsätt utkastet** för Lumivirta Energys mikronätsutmaning. Behåll **Öppen för att diskutera vad som passar bäst**, skriv en rad under fråga 2, kryssa i samtyckesrutan och klicka på **Dela med Lumivirta Energy**.', 'Ett grönt meddelande ”Delat med Lumivirta Energy”. Klicka på **Se det som Lumivirta Energy** i meddelandet: värden ser ditt svar bara under ditt lösar-ID, med ditt förhållningssätt som märke.', 'Det här är kärnidén: du visar hur du tänker kring ett verkligt problem, inte ett CV eller en pitch.', 'Öppna Min arbetsyta'],
        ['Tur, del 3: läs, översätt och godkänn som värd', 'Byt till **Arbetsgivare**, som värd Lumivirta Energy. Slå på **EU-baserad maskinöversättning (simulerad)** under det finska svaret från Solver #ESP-2093 i **Granskningsvyn**. Öppna sedan **Samtal** och klicka på **Godkänn** för förfrågan från Solver #ESP-4821.', 'Den engelska översättningen visas bredvid det finska originalet. När du har godkänt ersätter lösarens namn och e-post ID:t.', 'Identiteter visas bara när båda sidor har kommit överens om att träffas, och översättningar ersätter aldrig det människor skrev.', 'Öppna som Lumivirta Energy'],
        ['Tur, del 4: godkänn och exportera som arrangör', 'Klicka på **Evenemangsteamet** i sidhuvudet. Klicka på **Godkänn** för Lumivirta Energy och Solver #ESP-4821 under **Redo för ditt godkännande**. Öppna sedan **Schema och export** och klicka på **Ladda ner kalenderinbjudningar (.ics)**.', 'Samtalet läggs till i schemat med sitt format, Talent & Hiring, och du får en kalenderfil som fungerar i Outlook, Google Kalender och Apple Kalender.', 'En person i Esbo stads evenemangsteam bekräftar varje samtal.', 'Öppna godkännandekön'],
        ['Tur, del 5: efter evenemanget', 'Öppna **Efter evenemanget**, fortfarande som arrangör. Klicka på **Vi fortsätter** för både lösaren och värden på valfri rad.', '”Kontaktuppgifter utbytta” visas, och stapeln för pilotens nyckeltal rör sig mot målet på 40 %.', 'Kontaktuppgifter delas bara när båda sidor vill fortsätta, oavsett om det gäller en anställningsintervju, ett FoU-projekt eller en pilotavgränsning.', 'Öppna samtyckessimulatorn'],
      ],
    },
    participant: {
      label: 'Talanger',
      title: 'Guide för talanger och lösare',
      intro: 'Du är lösare: arbetssökande, forskare, specialist eller del av ett startup- eller projektteam, och tittar på verkliga problem från värdar i Esbo. I demon är du Solver #ESP-4821. Du har redan ett utkast, två delade svar, två samtalsförfrågningar och en väntande inbjudan.',
      youAre: 'Talang, forskare, specialist eller startup- och projektpartner',
      steps: [
        ['Börja på utmaningstavlan', 'Öppna **Talanger** och sedan **Utmaningstavlan**. Läs rubriken och klicka på **Bläddra bland 6 utmaningar**.', 'Varje kort är en kort förhandsvisning av ett verkligt problem som en värd arbetar med: format, rubrik, en rad, två färdigheter och värden. Inte en jobbannons eller en anbudsförfrågan, och ingen frågar efter CV, pitchdeck, foto eller din bakgrund.', 'Du bedöms efter hur du tänker, inte efter hur ditt CV eller ditt deck ser ut.', 'Öppna utmaningstavlan'],
        ['Filtrera efter samarbetsform', 'Klicka på **R&D & Co-Creation** och sedan **Pilot & Project** i raden med formatknappar. Klicka på **Alla format** för att gå tillbaka.', 'Varje knapp visar hur många utmaningar som matchar. Utmaningar med Open Format visas under varje format, och antalet under filtren säger det. Korten visar sina format som märken: blått för Talent & Hiring, blågrönt för R&D & Co-Creation, ockra för Pilot & Project och en streckad kant för Open Format.', 'Du ser direkt om en värd rekryterar, söker forskning eller vill ha en pilotpartner.', 'Prova formatfiltret'],
        ['Avgränsa efter färdighet och språk', 'Skriv i sökrutan och öppna sedan **Fler filter** för **ESCO-färdighet** och **Språk du kan arbeta på**. Välj till exempel Svenska som språk.', 'Svenska lämnar kvar utmaningarna som accepterar svenska: Sillat Digitals flerspråkiga tjänster och Tukki Builds spårbarhet för material. Om inget matchar kan du rensa alla filter med ett klick.', 'Språkmärket på varje utmanings sida visar vad arbetet verkligen kräver, så ”Engelska går bra” betyder precis det.', 'Prova filtren'],
        ['Spara utmaningar till senare', 'Klicka på hjärtat på ett utmaningskort. Klicka igen för att ta bort det.', 'Hjärtat fylls i, och utmaningen visas under Sparade utmaningar på **Min arbetsyta**.', 'Du kan samla de utmaningar du gillar innan du börjar skriva.', 'Spara en utmaning'],
        ['Öppna en utmaning', 'Klicka på ett kort, till exempel Lumivirta Energys **Clean energy microgrid load balancing**.', 'Utmaningens sida har det verkliga sammanhanget, vad som gör den knepig, alla ESCO-färdigheter, språkkravet och deadline. Till höger: **Visa ditt tänkande**, **Be om ett samtal** och **Se det som Lumivirta Energy** som byter till arbetsgivarens sida.', 'Tavlan förblir kort och lätt att överblicka. Detaljerna är ett klick bort.', 'Öppna utmaningen'],
        ['Använd din arbetsyta', 'Öppna **Min arbetsyta**.', 'Dina privata utkast (med Fortsätt utkastet och Radera utkast), tänkandet du redan har delat och hur du tog dig an varje utmaning, dina sparade utmaningar, räknaren för samtalsförfrågningar och **Dina uppgifter**, där du kan läsa samtyckesinformationen eller dra tillbaka samtycket.', 'Utkast är privata tills du väljer att dela dem. Att dra tillbaka samtycket raderar dina uppgifter direkt, utan att vänta 30 dagar.', 'Öppna Min arbetsyta'],
        ['Säg hur du tar dig an utmaningen', 'Klicka på **Fortsätt utkastet** för Lumivirta Energys utkast. Välj ett av de fyra alternativen under **Hur tar du dig an den här utmaningen?**.', 'Lumivirta Energy erbjuder Talent & Hiring och R&D & Co-Creation, så Projekt- / pilot- / lösningspartner är gråmarkerat med ”Erbjuds inte för den här utmaningen”. Öppen för att diskutera vad som passar bäst fungerar alltid.', 'Värden ser ditt val som ett märke bredvid dina svar. Det används aldrig för att sortera eller dölja någon.', 'Öppna utkastet'],
        ['Visa ditt tänkande i tre delar', 'Välj **Punktlista** eller **Korta stycken** och svara på de tre frågorna: vad du skulle göra först, varför och vilket perspektiv du bidrar med, och vilka kritiska frågor du skulle ställa till värdens team.', 'Fråga 3 är framhävd eftersom dina frågor är kärnan i Skillink. Utkastet sparas medan du skriver (”Utkastet sparades nyss”), och **Spara privat utkast** sparar det direkt.', 'Tre ärliga punkter räknas lika mycket som välputsade stycken. Inget poängsätter längd, grammatik eller stil.', 'Öppna redigeraren'],
        ['Skriv på det språk du tänker bäst på', 'Ändra **Språk du skriver på** till finska, svenska eller annat i redigeraren. Om du väljer annat, skriv språkets namn.', 'En notering upprepar värdens verkliga språkkrav. Värdarna kan öppna en översättning som visas bredvid dina ursprungliga ord.', 'Dina idéer är viktigare än ditt ordförråd. Maskinöversättning är valfri, märkt och ersätter aldrig det du skrev.', 'Öppna redigeraren'],
        ['Godkänn ändamålet och dela', 'Kryssa i samtyckesrutan (**Läs hela informationen** öppnar hela texten) och klicka på **Dela med** och värdens namn. Prova först att dela med ett tomt svar för att se hur formuläret hjälper.', 'Saknade delar nämns med enkla ord, och markören hoppar till den första. När du har delat står det ”Tänkande delat” vid utmaningen. **Dra tillbaka och redigera** tar tillbaka det.', 'Samtycket gäller bara ett ändamål: att ordna samtal på det här evenemanget. Dina uppgifter raderas 30 dagar senare.', 'Slutför och dela'],
        ['Be om ett samtal', 'Öppna **Samtal**. Klicka på **Be om** vid en värd under **Be om ett nytt samtal**. Välj vad samtalet ska handla om, välj en tid och klicka på **Skicka förfrågan**.', 'Formatvalet utgår från hur du tog dig an utmaningen. Räknaren går från 2 / 5 till 3 / 5. Vid 5 / 5 försvinner Be om-knapparna och en notering förklarar varför. **Avbryt förfrågan** frigör en igen.', 'Fem förfrågningar var håller samtalen meningsfulla för både lösare och värdar.', 'Öppna Samtal'],
        ['Svara på en inbjudan', 'Under **Inbjudningar till dig** har Revontuli Mobility bjudit in dig till ett samtal om Talent & Hiring. Klicka på **Tacka ja och dela mitt namn** eller **Tacka nej**.', 'Om du tackar ja kan bara Revontuli Mobility se ditt namn och din e-post. Inbjudningar räknas inte mot dina fem förfrågningar. Om du tackar nej får värden inte veta varför.', 'Du förblir anonym tills du bestämmer dig för att träffas.', 'Se inbjudan'],
        ['Kontrollera ditt schema', 'Titta på panelen **Ditt schema** på fliken Samtal och klicka på **Ladda ner kalenderfil (.ics)**.', 'Ditt bekräftade samtal med Open Format med Sillat Digital kl. 10.30 på evenemangsdagen, redo att läggas in i din egen kalender.', 'Ett samtal är bekräftat när båda sidor har sagt ja och Esbo stads evenemangsteam har godkänt tiden.', 'Öppna ditt schema'],
        ['Efter evenemanget: välj privat', 'Välj **Vi fortsätter** eller **Inte nu** för varje samtal du hade under **Efter dina samtal**.', 'Om du och värden båda väljer att fortsätta ser du värdkontaktens namn, roll och e-post. Annars delas inget, och ingen får veta vem som sa ”inte nu”.', 'Inga pinsamma avslag. Kontakt sker bara när båda sidor vill, för en anställningsintervju, ett FoU-projekt eller en pilotavgränsning.', 'Gör ditt val'],
        ['Använd stödet i ekosystemet', 'Öppna **Stöd i ekosystemet**. Växla mellan **Internationella talanger och karriär** och **Företagande, FoU och innovation** med ett klick eller piltangenterna.', 'Work in Finland, Talent Espoo vid Espoo Talent Hub, Esbo stads tjänster och InfoFinland på den första fliken. Business Espoo, Enter Espoo, Aalto-universitetet och VTT på den andra, med svar om piloter, examensarbeten och att starta företag.', 'Båda flikarna visas för alla. Skillink frågar aldrig var du kommer ifrån eller hur stort ditt team är.', 'Öppna Stöd i ekosystemet'],
      ],
    },
    host: {
      label: 'Arbetsgivare',
      title: 'Guide för arbetsgivare och värdar',
      intro: 'Du är rekryterande chef, FoU-ansvarig eller innovationspartner. Du publicerar ett verkligt problem från ditt team, säger vilka samarbetsformer ni är öppna för och läser hur lösare skulle ta sig an det. Skillink poängsätter eller rangordnar aldrig någon: du läser svaren och bestämmer vem du vill prata med. Guiden börjar som Lumivirta Energy.',
      youAre: 'Rekryterande chef, FoU-ansvarig eller innovationspartner på ett företag i Esbo',
      steps: [
        ['Välj vilken värd du agerar som', 'Öppna **Arbetsgivare** och använd menyn **Du är värd som** i fältet under sidhuvudet.', 'Sex fiktiva värdar i Esbo. Var och en ser bara svaren på sina egna utmaningar.', 'Det gör det lätt att jämföra hur olika värdar ser evenemanget.', 'Öppna som Lumivirta Energy'],
        ['Läs löftet om att inget rangordnas', 'Läs noteringen högst upp i **Granskningsvyn**. Växla sedan mellan **Per utmaning** och **Alla, efter tidpunkt**.', 'Svaren listas alltid äldst först, antingen grupperade per utmaning eller alla tillsammans. Det finns ingen ”bästa matchning”-ordning och inga logotyper eller företagsstorlekar att bedöma efter.', 'Ingen programvara rangordnar, poängsätter eller filtrerar människor eller team, vilket håller Skillink utanför EU:s AI-förordnings högriskkategori och rättvist mot små aktörer.', 'Öppna granskningsvyn'],
        ['Läs svar utan namn', 'Titta på namnraden för varje svar och märket bredvid.', 'Solver #ESP-2093 visas bara som en pseudonym, med märket Enskild talang / karriärmöjlighet. Daniel Okafors riktiga namn visas med det gröna ”Identiteten delad efter att ni båda kom överens om att träffas”, eftersom hen tackade ja till din inbjudan; märket är Forskare / akademiker / samarbete kring examensarbete. Varje svar listar också ESCO-färdigheterna lösaren säger sig använda.', 'Du bedömer tänkandet först. Namnet kommer senare, och bara med samtycke.', 'Se svaren'],
        ['Översätt sida vid sida', 'Slå på **EU-baserad maskinöversättning (simulerad)** under Solver #ESP-2093:s finska svar. Om ett svar har flera översättningar, som Solver #ESP-7356:s svenska svar hos Sillat Digital, välj engelska eller finska i menyn **Till**.', 'Originalet stannar till vänster, och översättningen till höger är märkt [EU-baserad maskinöversättning — originalet visas alltid]. Slå av reglaget för att dölja den igen.', 'Människor kan skriva på sitt starkaste språk, och du ser ändå exakt vad de skrev.', 'Prova översättningen'],
        ['Bjud in en lösare till ett samtal', 'Byt till **Sillat Digital**. Klicka på **Bjud in till ett samtal** under Solver #ESP-7356:s svar. Kontrollera vad samtalet ska handla om, välj en av dina tider och klicka på **Skicka inbjudan**.', 'Formatet börjar som Pilot & Project, eftersom lösaren tar sig an det som projektpartner. Svaret visar sedan formatet och ”Väntar på lösaren”. Klicka på **Se det som Solver #ESP-7356** i meddelandet för att se inbjudan på hens sida. Namnet visas bara om hen tackar ja.', 'Du väljer vem du pratar med utifrån vad de skrev, inte vem de är.', 'Öppna som Sillat Digital'],
        ['Svara på förfrågningar från lösare', 'Öppna **Samtal** som Lumivirta Energy. Klicka på **Godkänn** eller **Avböj** för förfrågan från Solver #ESP-4821 under **Förfrågningar från lösare**.', 'Att godkänna visar namn och e-post direkt och skickar samtalet till evenemangsteamet för godkännande. Att avböja ger lösaren tillbaka sin förfrågan. **Se det som Solver #ESP-4821** i meddelandet visar resultatet på talangsidan.', 'Båda sidor måste säga ja innan någons identitet delas.', 'Öppna Samtal'],
        ['Skriv en utmaning på tio minuter', 'Öppna **Publicera en utmaning**. Kryssa i ett eller flera av Rekrytering / öppen tjänst, FoU / examensarbete / samskapande, B2B-pilot / projektpartner och Öppen för alla under **Vilken typ av samarbete är ni öppna för?**. Fyll sedan i problemets rubrik, sammanfattningen, det verkliga sammanhanget och ”Vad gör det här knepigt?”.', 'Varje alternativ visar formatets namn och vad det betyder. Checklistan ”Redo att publicera” bockar av varje del medan du skriver.', 'En tydlig flaskhals ger bättre svar än en välputsad jobbannons eller en anbudsförfrågan, och gör generiska AI-skrivna svar lätta att känna igen.', 'Öppna mallen'],
        ['Lägg till färdigheter, språk och deadline', 'Skriv ett ord som ”cirkulär” i rutan för ESCO-färdigheter och välj färdigheter med piltangenterna och Enter. Ange språkkrav, bransch och deadline.', 'Klicka på en färdighet för att ta bort den. Du kan välja 2 till 6 färdigheter. Språkkravet avgör vilket filter för ”Språk du kan arbeta på” som hittar din utmaning.', 'Färdigheterna beskriver problemet så att lösare hittar det. De används aldrig för att rangordna människor.', 'Öppna mallen'],
        ['Använd Business Espoos skrivstöd', 'Slå på **Be om skrivstöd**. Svara på de tre snabba frågorna och klicka på **Skapa ett utkast från anteckningarna**. Avsluta med **Granska mitt utkast**. **Fyll tomma fält med en startmall** finns om du hellre börjar från en mall.', 'Tomma fält fylls från dina anteckningar, med en mening för varje format du valt, och rubriken får en [hakparentes] att ersätta. Checklistan föreslår förbättringar, som att lägga till en siffra eller, för en pilot, hur stor en första pilot kan vara. Du kan inte publicera så länge det finns [hakparenteser] kvar.', 'Upptagna chefer och innovationsansvariga får ett skarpt första utkast. Assistenten följer en fast mall, inte AI, och en rådgivare från Business Espoo följer upp.', 'Prova assistenten'],
        ['Publicera och följ dina utmaningar', 'Klicka på **Publicera utmaningen**. Om något saknas säger ett meddelande exakt vad. Öppna sedan **Dina utmaningar**.', 'Din nya utmaning listas med formatmärken, deadline, färdigheter och antal svar. Klicka på **Se det som talang** i meddelandet för att öppna den på utmaningstavlan, märkt ”Skriven tillsammans med Business Espoo” om du använde stödet.', 'Utmaningarna publiceras innan anmälan stänger, så att lösarna har tid att tänka.', 'Öppna Dina utmaningar'],
        ['Efter evenemanget: välj privat', 'Byt till **Tukki Build**, öppna **Samtal** och skrolla till **Efter evenemanget**. Välj **Vi fortsätter** eller **Inte nu**.', 'Varje genomfört samtal visar sitt format, här ett samtal om Pilot & Project. Om du och lösaren båda vill fortsätta uppmanas du att ta kontakt. Lösaren ser aldrig ett ”inte nu”.', 'Uppföljning sker bara när båda sidor vill, oavsett om det gäller en anställningsintervju, ett FoU-projekt eller en pilotavgränsning.', 'Öppna som Tukki Build'],
      ],
    },
    organizer: {
      label: 'Evenemangsteamet',
      title: 'Guide för evenemangsteamet',
      intro: 'Du driver Espoo Challenge Match för Esbo stad och Business Espoo, med ett rekryteringsspår och ett matchmakingspår samma dag. Varje samtal bekräftas av en person i ditt team, och allt du mäter är anonymt.',
      youAre: 'Esbo stads och Business Espoos evenemangsteam',
      steps: [
        ['Godkänn samtal', 'Klicka på **Evenemangsteamet** i sidhuvudet och sedan **Godkännandekö**. Klicka på **Godkänn** eller **Avböj** under **Redo för ditt godkännande**.', 'Samtal som båda sidor redan har godkänt, vart och ett med sitt format: ett samtal om R&D & Co-Creation med Lumivirta Energy och ett om Pilot & Project med Kestomo Industrial. Siffran på fliken visar hur många som väntar, och dina beslut visas under **Dina senaste beslut**.', 'Människor har kontrollen. Inget godkänns automatiskt.', 'Öppna godkännandekön'],
        ['Ta ett spår i taget', 'Klicka på **Pilot & Project** i raden **Spår** och sedan **Alla spår**.', 'Varje knapp räknar öppna förfrågningar och inbjudningar för det formatet, och listorna nedanför visar bara det spåret.', 'En kö för rekrytering och matchmaking, med ett snabbt sätt att fokusera på en sorts samtal.', 'Prova spårfiltret'],
        ['Håll koll på öppna förfrågningar', 'Skrolla till **Väntar på den andra sidan**.', 'Förfrågningar och inbjudningar där en sida inte har svarat än. Du kan avböja en, till exempel för att lösa en krock. Godkännande blir möjligt först när båda sidor är överens.', 'Du kan gå in tidigt utan att köra över någons val.', 'Se öppna förfrågningar'],
        ['Kontrollera schemat för evenemangsdagen', 'Öppna **Schema och export**.', 'Varje bekräftat samtal efter tid, med bord i Dipoli, värd, lösare, format och utmaning. Namn visas bara där båda sidor har kommit överens om att träffas.', 'Ett schema för hela evenemanget, över båda spåren.', 'Öppna schemat'],
        ['Exportera till kalendrar, Brella och Tavata', 'Använd knapparna under **Förhandsvisning** för att titta på formaten .ics, Brella CSV och Tavata JSON och klicka sedan på en **Ladda ner**-knapp.', 'Filerna skapas i din webbläsare och inget skickas någonstans. Varje fil innehåller varje samtals samarbetsform, och .ics-filen öppnas i vilken kalenderapp som helst.', 'Skillink avgör vem som ska prata och varför. Brella och Tavata sköter evenemangsdagen.', 'Öppna exporten'],
        ['Läs insikterna från evenemanget', 'Öppna **Insikter**.', 'Totaler och sedan **Intresse för rekrytering, FoU och piloter**: för varje format hur många utmaningar som erbjuder det, hur många svar som kom från lösare som tog sig an det på det sättet och hur många samtal som bekräftades. Därunder: svar per utmaning, de mest efterfrågade ESCO-färdigheterna, ouppfyllda behov i ekosystemet (i gult) och språken som människor skrev på.', 'Ouppfyllda behov visar var Esbo kan fokusera utbildning, forskningsutlysningar eller kommande evenemang. Varje siffra är ett antal, aldrig en person eller ett team.', 'Öppna Insikter'],
        ['Kör det ömsesidiga samtycket efter evenemanget', 'Öppna **Efter evenemanget**. Varje rad visar lösarens privata val, värdens privata val och resultatet. Klicka på **Vi fortsätter** eller **Inte nu** på varje sida.', 'När båda vill fortsätta visas ”Kontaktuppgifter utbytta” med båda kontakterna. När någon säger ”inte nu” ser du ”Inga kontaktuppgifter delade”, utan att det framgår vem. **Rensa alla val** börjar om.', 'Med simulatorn kan du spela båda sidor. På ett verkligt evenemang svarar var och en på sin egen enhet.', 'Öppna simulatorn'],
        ['Följ pilotens mål på 40 %', 'Håll ögonen på panelen **Pilotens nyckeltal** medan du ändrar val.', 'Stapeln visar andelen genomförda samtal, i alla format, där båda sidor valde att fortsätta, med en linje vid 40 %. Den blir grön vid eller över målet och gul under det, och visar hur många fler ömsesidiga samtycken som behövs.', 'Det här är pilotens viktigaste mått på framgång.', 'Se nyckeltalet'],
        ['Gör en värderapport för en värd', 'Öppna **Företagsrapporter**, välj en värd och klicka på **Skriv ut eller spara som PDF** eller **Ladda ner rapporten (HTML)**.', 'Vilka som engagerade sig i utmaningen (talanger, forskare, pilotpartner eller öppna för det som passar bäst), vägen från intresse till samtal, teman i lösarnas frågor och mötesutfall per format.', 'Värdarna ser vad de fick ut av evenemanget. Teman grupperas efter en publicerad nyckelordslista och beskriver frågor, aldrig människor.', 'Öppna Företagsrapporter'],
      ],
    },
  },
};

const ORDER = ['start', 'participant', 'host', 'organizer'];

/** One guide in the interface language. Structure (links, companies) comes from GUIDES. */
function guide(id) {
  const base = GUIDES[id];
  const t = TEXT[getLang()]?.[id];
  if (!t) return base;
  return {
    ...base,
    label: t.label,
    title: t.title,
    intro: t.intro,
    youAre: t.youAre,
    steps: base.steps.map((s, i) => {
      const [title, doText, see, why, goLabel] = t.steps[i] || [];
      return {
        ...s,
        title: title || s.title,
        do: doText || s.do,
        see: see || s.see,
        why: why || s.why,
        go: s.go ? { ...s.go, label: goLabel || s.go.label } : undefined,
      };
    }),
  };
}

export function tabs() {
  return ORDER.map((id) => {
    const g = guide(id);
    const total = g.steps.length;
    const done = g.steps.filter((_, i) => progress[`${id}:${i}`]).length;
    return { id, label: g.label + (done === total ? ' ✓' : '') };
  });
}

export function context() {
  return `<span>${ICON.person}</span><span><strong>${esc(L('Step-by-step guide.', 'Vaiheittainen opas.', 'Steg-för-steg-guide.'))}</strong> ${esc(L('Every step works with the original demo data, and “Try it” takes you to the right screen.', 'Jokainen vaihe toimii alkuperäisellä demodatalla, ja ”Kokeile” vie oikeaan näkymään.', 'Varje steg fungerar med de ursprungliga demodata, och ”Prova” tar dig till rätt vy.'))}</span>`;
}

export function render(state, tab) {
  const id = GUIDES[tab] ? tab : 'start';
  const g = guide(id);
  const done = g.steps.filter((_, i) => progress[`${id}:${i}`]).length;
  const pct = Math.round((done / g.steps.length) * 100);
  const next = ORDER[ORDER.indexOf(id) + 1];
  return `
  <div class="split">
    <article aria-labelledby="g-title">
      <h1 id="g-title">${esc(g.title)}</h1>
      <p class="lede">${esc(g.intro)}</p>
      <p class="small muted">${esc(L('For: {who}. {n} steps.', 'Kenelle: {who}. {n} vaihetta.', 'För: {who}. {n} steg.', { who: g.youAre, n: g.steps.length }))}</p>
      <ol class="guide-steps">
        ${g.steps
          .map((s, i) => {
            const key = `${id}:${i}`;
            const isDone = !!progress[key];
            return `<li class="gstep${isDone ? ' is-done' : ''}" id="gs-${i}" data-n="${i + 1}" tabindex="-1">
              <div class="gstep__body">
                <h2 class="gstep__title">${fmt(s.title)}</h2>
                <p>${fmt(s.do)}</p>
                <p class="gstep__see">${fmt(s.see)}</p>
                <p class="gstep__why">${fmt(s.why)}</p>
                <div class="row no-print">
                  ${s.go ? `<a class="btn btn--sm btn--secondary" href="${esc(s.go.href)}" data-go="${esc(s.go.href)}" ${s.go.company ? `data-company="${esc(s.go.company)}"` : ''}>${esc(L('Try it: {what}', 'Kokeile: {what}', 'Prova: {what}', { what: s.go.label }))}</a>` : ''}
                  <button type="button" class="btn btn--sm btn--ghost" data-done="${key}" id="done-${key.replace(':', '-')}" aria-pressed="${isDone}">${esc(isDone ? L('Done', 'Tehty', 'Klart') : L('Mark as done', 'Merkitse tehdyksi', 'Markera som klart'))}<span class="sr-only">: ${esc(s.title)}</span></button>
                </div>
              </div>
            </li>`;
          })
          .join('')}
      </ol>
      ${next ? `<div class="panel panel--quiet no-print" style="margin-top:var(--s6)"><p style="margin:0">${esc(L('Next:', 'Seuraavaksi:', 'Nästa:'))} <a href="#/guide/${next}">${esc(guide(next).title)}</a></p></div>` : ''}
    </article>
    <aside class="stack guide-aside no-print">
      <div class="panel">
        <div class="quota" role="group" aria-label="${esc(L('Guide progress', 'Oppaan edistyminen', 'Framsteg i guiden'))}">
          <div class="quota__label"><span>${esc(L('{d} of {n} steps done', '{d}/{n} vaihetta tehty', '{d} av {n} steg klara', { d: done, n: g.steps.length }))}</span><span class="muted">${pct}%</span></div>
          <div class="kpi__track" style="height:10px" aria-hidden="true"><div class="kpi__fill" style="width:${pct}%"></div></div>
        </div>
        <ol class="guide-toc">
          ${g.steps.map((s, i) => `<li class="${progress[`${id}:${i}`] ? 'is-done' : ''}"><button type="button" class="linkbtn" data-jump="gs-${i}">${esc(s.title)}</button></li>`).join('')}
        </ol>
      </div>
      <div class="panel panel--quiet">
        <h3>${esc(L('All guides', 'Kaikki oppaat', 'Alla guider'))}</h3>
        <ul class="guide-all">${ORDER.map((k) => `<li><a href="#/guide/${k}" ${k === id ? 'aria-current="page"' : ''}>${esc(guide(k).title)}</a></li>`).join('')}</ul>
        <div class="row" style="margin-top:var(--s4)">
          <button type="button" class="btn btn--sm btn--ghost" id="print-guide">${esc(L('Print this guide', 'Tulosta tämä opas', 'Skriv ut guiden'))}</button>
          <button type="button" class="btn btn--sm btn--ghost" id="reset-progress">${esc(L('Clear my ticks', 'Tyhjennä rastini', 'Rensa mina bockar'))}</button>
        </div>
      </div>
    </aside>
  </div>`;
}

export function bind(root, ctx) {
  root.querySelectorAll('[data-go]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const company = a.dataset.company;
      if (!company) return; // plain link, let the router handle it
      e.preventDefault();
      setCurrentCompany(company, { render: false });
      location.hash = a.dataset.go;
    }),
  );
  root.querySelectorAll('[data-done]').forEach((b) =>
    b.addEventListener('click', () => {
      const key = b.dataset.done;
      if (progress[key]) delete progress[key];
      else progress[key] = true;
      saveProgress(progress);
      ctx.rerender();
    }),
  );
  root.querySelectorAll('[data-jump]').forEach((b) =>
    b.addEventListener('click', () => {
      const el = root.querySelector(`#${b.dataset.jump}`);
      el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      el?.focus({ preventScroll: true });
    }),
  );
  root.querySelector('#print-guide')?.addEventListener('click', () => window.print());
  root.querySelector('#reset-progress')?.addEventListener('click', () => {
    progress = {};
    saveProgress(progress);
    ctx.rerender();
  });
}
