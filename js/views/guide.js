// Step-by-step guide for each persona. Steps follow the seeded demo data, so every one of them
// works straight after "Reset demo data". Progress ticks are a per-viewer convenience kept in
// localStorage under their own key, so resetting the demo does not clear them.
import { esc } from '../ui.js';
import { update } from '../store.js';
import { ICON } from './shared.js';

const PROGRESS_KEY = 'skillink.guide.v1';

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

const GUIDES = {
  start: {
    label: 'Start here',
    title: 'How to explore Skillink',
    intro:
      'Skillink matches people to a company\'s real problem instead of a CV. You can explore it from four perspectives: participant, company recruiter, City of Espoo organizer and privacy inspector. Everything runs in your browser on made-up demo data, so nothing you try can break anything.',
    youAre: 'Anyone visiting for the first time, including demo evaluators',
    steps: [
      {
        title: 'Switch between the four perspectives',
        do: 'Use the switcher at the top of every page: **Participant**, **Company recruiter**, **Espoo organizer** and **Privacy & AI Act**. The bar underneath tells you who you are right now, for example “You are Participant #ESP-4821”.',
        see: 'All four perspectives share the same event. If a participant sends a request, it shows up for the recruiter and then in the organizer\'s queue.',
        why: 'You can follow one conversation from both sides in a few clicks.',
        go: { href: '#/participant/board', label: 'Open the participant view' },
      },
      {
        title: 'Start over at any time',
        do: 'Click **Reset demo data** in the header, then confirm. All data goes back to the original Espoo demo data. Your ticks in this guide are kept.',
        see: 'A short message confirms the reset. Use it between demo runs, or after trying the data deletion.',
        why: 'Every step in this guide is written for the original demo data.',
      },
      {
        title: 'Five-minute tour, part 1: share your thinking',
        do: 'As a **Participant**, open **My workspace** and click **Continue draft** on the Lumivirta Energy microgrid challenge. Write a line under question 2, tick the consent box and click **Share with Lumivirta Energy**.',
        see: 'A green “Shared with Lumivirta Energy” note. The company sees your answer under your participant ID only.',
        why: 'This is the core idea: you show how you think about a real problem, not a CV.',
        go: { href: '#/participant/workspace', label: 'Open My workspace' },
      },
      {
        title: 'Tour, part 2: read, translate and accept as the company',
        do: 'Switch to **Company recruiter**, recruiting for Lumivirta Energy. On the **Shared thinking** tab, turn on **EU-Hosted Machine Translation (Simulated)** under the Finnish answer from Participant #ESP-2093. Then open **Conversations** and click **Accept** on the request from Participant #ESP-4821.',
        see: 'The English translation appears next to the Finnish original. After you accept, the participant\'s name and email replace their ID.',
        why: 'Identities are shown only after both sides agree to meet, and translations never replace what people wrote.',
        go: { href: '#/recruiter/feed', company: 'c-lumi', label: 'Open as Lumivirta Energy' },
      },
      {
        title: 'Tour, part 3: approve and export as the organizer',
        do: 'Switch to **Espoo organizer**. Under **Ready for your approval**, click **Approve** on Lumivirta Energy and Participant #ESP-4821. Then open **Schedule and export** and click **Download calendar invites (.ics)**.',
        see: 'The conversation joins the schedule table, and you get a calendar file that works with Outlook, Google Calendar and Apple Calendar.',
        why: 'A person on the City of Espoo event team confirms every conversation.',
        go: { href: '#/organizer/queue', label: 'Open the approval queue' },
      },
      {
        title: 'Tour, part 4: after the event',
        do: 'Still as the organizer, open **After the event**. In any row, click **Let\'s continue** for both the participant and the company.',
        see: '“Contact details exchanged” appears, and the Pilot KPI bar moves toward the 40% target.',
        why: 'Contact details are shared only when both people want to continue.',
        go: { href: '#/organizer/optin', label: 'Open the opt-in simulator' },
      },
      {
        title: 'Tour, part 5: delete personal data, keep the statistics',
        do: 'Switch to **Privacy & AI Act**, open **30-day deletion** and click **Simulate 30-day post-event auto-deletion**. Then go back to **Espoo organizer**, **Insights**.',
        see: 'The deletion summary drops every personal record to 0. On Insights, the anonymous totals are still there.',
        why: 'This proves the 30-day deletion promise without losing what the city learned. Finish with **Reset demo data**.',
        go: { href: '#/privacy/purge', label: 'Open 30-day deletion' },
      },
    ],
  },

  participant: {
    label: 'Participant',
    title: 'Guide for participants',
    intro:
      'You\'re a job seeker or international professional looking at real problems from Espoo companies. In the demo you are Participant #ESP-4821. You already have one draft, two shared answers, two conversation requests and one invitation waiting.',
    youAre: 'Job seeker or international talent',
    steps: [
      {
        title: 'Start on the problem board',
        do: 'Open **Participant**, then **Problem board**. Read the three steps under the headline, then click **Browse the 6 challenges**.',
        see: 'Each challenge is a real problem a company is working on, not a job ad. Nobody asks for a CV, a photo or your background.',
        why: 'You\'re judged on how you think, not on how your CV looks.',
        go: { href: '#/participant/board', label: 'Open the problem board' },
      },
      {
        title: 'Find challenges that fit you',
        do: 'Use the filters above the challenges: **Search**, **ESCO skill**, **Language requirement** and **Industry**. For example, set Language requirement to “Swedish & English”.',
        see: 'Each card shows the company, industry, real language requirement, “What makes this tricky”, ESCO skill tags and the deadline with days left. If nothing matches, you can clear all filters in one click.',
        why: 'The language badge shows what the job really needs, so “English is fine” means exactly that.',
        go: { href: '#/participant/board', label: 'Try the filters' },
      },
      {
        title: 'Save challenges for later',
        do: 'Click **Save** on any challenge card. Click it again to remove it.',
        see: 'The button changes to Saved, and the challenge appears under Saved challenges in **My workspace**.',
        why: 'You can collect the ones you like before you start writing.',
        go: { href: '#/participant/board', label: 'Save a challenge' },
      },
      {
        title: 'Use your workspace',
        do: 'Open **My workspace**.',
        see: 'Your private drafts (with Continue draft and Delete draft), the thinking you\'ve already shared, your saved challenges, and your conversation requests counter.',
        why: 'Drafts are private and stay in your browser until you choose to share them.',
        go: { href: '#/participant/workspace', label: 'Open My workspace' },
      },
      {
        title: 'Show your thinking',
        do: 'Click **Show your thinking** on a challenge, or **Continue draft** on the Lumivirta Energy draft. Choose **Bullet points** or **Short paragraphs**, then answer the three questions: what you\'d do first, why, and what you\'d ask the company.',
        see: 'Question 3 is highlighted because your questions are the heart of Skillink. Your draft saves itself as you type (“Draft saved just now”), and **Save private draft** saves it straight away.',
        why: 'Three honest bullet points count as much as polished paragraphs. Nothing scores length, grammar or style.',
        go: { href: '#/participant/write/ch-1', label: 'Open the draft' },
      },
      {
        title: 'Write in the language you think best in',
        do: 'In the editor, change **Language you\'re writing in** to Finnish, Swedish or Other. If you pick Other, type the language name.',
        see: 'A note repeats the company\'s real language requirement. Recruiters can open a translation that appears next to your original words.',
        why: 'Your ideas matter more than your vocabulary. Machine translation is optional, labelled and never replaces what you wrote.',
        go: { href: '#/participant/write/ch-1', label: 'Open the editor' },
      },
      {
        title: 'Agree to the purpose and share',
        do: 'Tick the consent box, then click **Share with** and the company name. Try sharing with an empty answer first to see how the form helps.',
        see: 'Missing parts are named in plain words, and the cursor jumps to the first one. Once shared, the challenge shows “Thinking shared”. Use **Withdraw and edit** to take it back.',
        why: 'Consent is for one purpose only: arranging conversations at this event. Your data is deleted 30 days later.',
        go: { href: '#/participant/write/ch-1', label: 'Finish and share' },
      },
      {
        title: 'Request a conversation',
        do: 'Open **Conversations**. Under **Request a new conversation**, click **Request** next to a company, pick a time and click **Send request**.',
        see: 'The counter moves from 2 / 5 to 3 / 5. At 5 / 5, the Request buttons disappear and a note explains why. **Cancel request** frees one up again.',
        why: 'Five requests each keeps conversations meaningful for participants and companies alike.',
        go: { href: '#/participant/meetings', label: 'Open Conversations' },
      },
      {
        title: 'Answer an invitation',
        do: 'Under **Invitations for you**, Revontuli Mobility has invited you. Click **Accept and share my name**, or **Decline**.',
        see: 'If you accept, only Revontuli Mobility can now see your name and email. Invitations don\'t use any of your five requests. If you decline, the company isn\'t told why.',
        why: 'You stay anonymous until you decide to meet.',
        go: { href: '#/participant/meetings', label: 'See the invitation' },
      },
      {
        title: 'Check your schedule',
        do: 'Look at the **Your schedule** panel on the Conversations tab and click **Download calendar file (.ics)**.',
        see: 'Your confirmed conversation with Sillat Digital at 10:30 on event day, ready to add to your own calendar.',
        why: 'A conversation is confirmed when both sides have said yes and the City of Espoo event team has approved the time.',
        go: { href: '#/participant/meetings', label: 'Open your schedule' },
      },
      {
        title: 'After the event: choose privately',
        do: 'Under **After your conversations**, choose **Let\'s continue** or **Not now** for each conversation you had.',
        see: 'If you and the company both choose to continue, you see the recruiter\'s contact details. Otherwise nothing is shared, and nobody learns who said not now.',
        why: 'No awkward rejections. Contact only happens when both sides want it.',
        go: { href: '#/participant/meetings', label: 'Make your choice' },
      },
      {
        title: 'Get help moving to Espoo',
        do: 'Open **International support**.',
        see: 'Links to Work in Finland (including the Spouse Program), City of Espoo services and InfoFinland, plus answers about language, permits and family.',
        why: 'The page is the same for everyone. Skillink never asks where you\'re from.',
        go: { href: '#/participant/support', label: 'Open International support' },
      },
    ],
  },

  recruiter: {
    label: 'Company recruiter',
    title: 'Guide for company recruiters',
    intro:
      'You post a real problem from your team and read how people would tackle it. Skillink never scores or ranks anyone. You read the answers and decide who to talk to. The guide starts as Lumivirta Energy.',
    youAre: 'Hiring manager or recruiter at an Espoo company',
    steps: [
      {
        title: 'Choose which company you recruit for',
        do: 'Open **Company recruiter** and use the **Recruiting for** menu in the bar under the header.',
        see: 'Six fictional Espoo companies. Each one sees only the answers to its own challenges.',
        why: 'It makes it easy to compare how different companies see the event.',
        go: { href: '#/recruiter/feed', company: 'c-lumi', label: 'Open as Lumivirta Energy' },
      },
      {
        title: 'Read the no-ranking promise',
        do: 'On **Shared thinking**, read the note at the top. Then switch between **By challenge** and **All, by time shared**.',
        see: 'Answers are always listed oldest first, either grouped by challenge or all together. There is no “best match” order.',
        why: 'No software ranks, scores or filters people, which keeps Skillink out of the EU AI Act\'s high-risk category.',
        go: { href: '#/recruiter/feed', company: 'c-lumi', label: 'Open Shared thinking' },
      },
      {
        title: 'Read answers without names',
        do: 'Look at the name line of each answer.',
        see: 'Participant #ESP-2093 shows only a pseudonym with a lock icon. Daniel Okafor\'s real name is shown, with a green “Identity shared after you both agreed to meet”, because they accepted your invitation.',
        why: 'You judge the thinking first. The name comes later, and only with consent.',
        go: { href: '#/recruiter/feed', company: 'c-lumi', label: 'See the answers' },
      },
      {
        title: 'Translate side by side',
        do: 'Under Participant #ESP-2093\'s Finnish answer, turn on **EU-Hosted Machine Translation (Simulated)**. For an answer with more than one translation, such as the Swedish answer at Sillat Digital, use the **Into** menu to choose English or Finnish.',
        see: 'The original stays on the left, and the labelled translation appears on the right. Turn the switch off to hide the translation again.',
        why: 'People can write in their strongest language, and you still see exactly what they wrote.',
        go: { href: '#/recruiter/feed', company: 'c-lumi', label: 'Try the translation' },
      },
      {
        title: 'Invite someone to a conversation',
        do: 'Switch to **Sillat Digital**. Under Participant #ESP-7356\'s answer, click **Invite to a conversation**, pick one of your times and click **Send invitation**.',
        see: 'The answer now shows “Waiting for participant”. Their name appears only if they accept.',
        why: 'You choose who to talk to based on what they wrote.',
        go: { href: '#/recruiter/feed', company: 'c-sillat', label: 'Open as Sillat Digital' },
      },
      {
        title: 'Answer requests from participants',
        do: 'As Lumivirta Energy, open **Conversations**. Under **Requests from participants**, click **Accept** or **Decline** on the request from Participant #ESP-4821.',
        see: 'Accepting shows their name and email straight away and sends the conversation to the event team for approval. Declining gives the participant their request back.',
        why: 'Both sides have to say yes before anyone\'s identity is shared.',
        go: { href: '#/recruiter/meetings', company: 'c-lumi', label: 'Open Conversations' },
      },
      {
        title: 'Write a challenge in ten minutes',
        do: 'Open **Post a challenge**. Fill in the problem title, the real-world context and “What makes this tricky?”. In the ESCO skills box, type a word such as “energy”, then pick skills with the arrow keys and Enter. Set the language requirement, industry and deadline.',
        see: 'The “Ready to publish” checklist ticks off each part as you write. Click a skill chip to remove it. You can pick 2 to 6 skills.',
        why: 'A clear, specific problem gets better answers than a polished job ad, and makes generic copy-pasted answers easy to spot.',
        go: { href: '#/recruiter/new', company: 'c-lumi', label: 'Open the template' },
      },
      {
        title: 'Get help from Espoo Business Services',
        do: 'Turn on **Request co-writing support**. Click **Fill empty fields with a starting template**, then **Check my draft**.',
        see: 'Empty fields fill with a template that has [brackets] for your own details. The checklist suggests improvements, such as adding a concrete number. You can\'t publish while any [brackets] are left.',
        why: 'Busy employers get a strong first draft, and a City of Espoo business advisor follows up.',
        go: { href: '#/recruiter/new', company: 'c-lumi', label: 'Try co-writing' },
      },
      {
        title: 'Publish and track your challenges',
        do: 'Click **Publish challenge**. If anything is missing, a message says exactly what. Then open **Your challenges**.',
        see: 'Your new challenge is listed with its deadline, skills and number of answers, and it\'s on the participants\' problem board straight away, marked “Co-written with Espoo Business Services” if you used the help.',
        why: 'Challenges go up before registration closes, so participants have time to think.',
        go: { href: '#/recruiter/challenges', company: 'c-lumi', label: 'Open Your challenges' },
      },
      {
        title: 'After the event: choose privately',
        do: 'Switch to **Tukki Software**, open **Conversations** and scroll to **After the event**. Choose **Let\'s continue** or **Not now**.',
        see: 'If you and the participant both choose to continue, you\'re told to get in touch. The participant never sees a “not now”.',
        why: 'Follow-up happens only when both sides want it.',
        go: { href: '#/recruiter/meetings', company: 'c-tukki', label: 'Open as Tukki Software' },
      },
    ],
  },

  organizer: {
    label: 'Espoo organizer',
    title: 'Guide for City of Espoo organizers',
    intro:
      'You run Espoo Talent Match for the City of Espoo. Every conversation is confirmed by a person on your team, and everything you measure is anonymous.',
    youAre: 'City of Espoo event team',
    steps: [
      {
        title: 'Approve conversations',
        do: 'Open **Espoo organizer**, then **Approval queue**. Under **Ready for your approval**, click **Approve** or **Decline**.',
        see: 'These are conversations both sides already agreed to. The number on the tab shows how many are waiting. Your decisions appear in the **Your recent decisions** panel.',
        why: 'People stay in control. Nothing is approved automatically.',
        go: { href: '#/organizer/queue', label: 'Open the approval queue' },
      },
      {
        title: 'Keep an eye on open requests',
        do: 'Scroll to **Waiting for the other side**.',
        see: 'Requests and invitations where one side hasn\'t answered yet. You can decline one, for example to resolve a clash. Approval only becomes possible once both sides agree.',
        why: 'You can step in early without overruling anyone\'s choice.',
        go: { href: '#/organizer/queue', label: 'See open requests' },
      },
      {
        title: 'Check the event-day schedule',
        do: 'Open **Schedule and export**.',
        see: 'Every confirmed conversation by time, with its table at Dipoli, the company, the participant and the challenge. Names appear only where both sides agreed to meet.',
        why: 'One schedule for the whole event.',
        go: { href: '#/organizer/schedule', label: 'Open the schedule' },
      },
      {
        title: 'Export to calendars, Brella and Tavata',
        do: 'Use the **Preview** buttons to look at the .ics, Brella CSV and Tavata JSON formats, then click a **Download** button.',
        see: 'The files are generated in your browser and nothing is sent anywhere. The .ics file opens in any calendar app.',
        why: 'Skillink decides who should talk and why. Brella and Tavata run the event day.',
        go: { href: '#/organizer/schedule', label: 'Open the exports' },
      },
      {
        title: 'Read the event insights',
        do: 'Open **Insights**.',
        see: 'Totals for challenges, answers and conversations. Then answers per challenge, the ESCO skills companies asked for most, unmet skill needs (shown in amber), and the languages people wrote in.',
        why: 'Unmet skill needs show where Espoo could focus training or future events. Every figure is a count, never a person.',
        go: { href: '#/organizer/insights', label: 'Open Insights' },
      },
      {
        title: 'Run the post-event opt-in',
        do: 'Open **After the event**. Each row shows the participant\'s private choice, the company\'s private choice and the result. Click **Let\'s continue** or **Not now** on each side.',
        see: 'When both choose to continue, “Contact details exchanged” appears with both contacts. When either says not now, you see “No contact shared”, without saying who. **Clear all choices** starts again.',
        why: 'The simulator lets you play both sides. At a real event, each person answers on their own device.',
        go: { href: '#/organizer/optin', label: 'Open the simulator' },
      },
      {
        title: 'Track the 40% pilot target',
        do: 'Watch the **Pilot KPI** panel while you change choices.',
        see: 'The bar shows the share of held conversations where both sides chose to continue, with a line at 40%. It turns green at or above the target and amber below it, and tells you how many more mutual opt-ins you need.',
        why: 'This is the pilot\'s main success measure.',
        go: { href: '#/organizer/optin', label: 'See the KPI' },
      },
      {
        title: 'Make a value report for a company',
        do: 'Open **Company reports**, pick a company, then click **Print or save as PDF** or **Download report (HTML)**.',
        see: 'How many people showed their thinking and how many questions they asked, a chart from interest to conversation, and the themes of the questions people asked.',
        why: 'Companies see what they got from the event. Themes are grouped from a published keyword list and describe questions, never people.',
        go: { href: '#/organizer/reports', label: 'Open Company reports' },
      },
    ],
  },

  privacy: {
    label: 'Privacy inspector',
    title: 'Guide for privacy and EU AI Act inspectors',
    intro:
      'Check that Skillink keeps algorithms out of decisions about people, and that personal data really is deleted. Most of this view is read-only. The deletion simulation and the consent withdrawal really do change the demo data, and Reset demo data brings it back.',
    youAre: 'Data protection officer, legal reviewer or auditor',
    steps: [
      {
        title: 'See why recruitment AI is high-risk',
        do: 'Open **Privacy & AI Act**, then **EU AI Act, Annex III**.',
        see: 'A table that sets each high-risk recruitment use (filtering, evaluating candidates, targeted ads, hiring decisions) against what Skillink does instead.',
        why: 'Keeping software out of decisions about people avoids the high-risk obligations. The page also says this needs confirming with the City\'s DPO and lawyers.',
        go: { href: '#/privacy/annex', label: 'Open Annex III' },
      },
      {
        title: 'Check the guardrails live',
        do: 'Read the **Guardrails, checked live** panel on the right.',
        see: 'Six checks worked out from the data as it is right now: no demographic or scoring fields, no ranking, how many identities were shared and why, the highest request count against the cap of 5, side-by-side translation, and the deletion date.',
        why: 'These checks are recalculated from the data every time, so they are evidence, not just promises. Come back after using other perspectives and watch them update.',
        go: { href: '#/privacy/annex', label: 'See the guardrails' },
      },
      {
        title: 'Inspect the only AI feature',
        do: 'Read the translation section, then try it in the recruiter view.',
        see: 'Translation is off by default, labelled [EU-Hosted Machine Translation] and always shown next to the original.',
        why: 'It changes the language of the text, not anyone\'s chances.',
        go: { href: '#/recruiter/feed', company: 'c-lumi', label: 'Try it as a recruiter' },
      },
      {
        title: 'Read the consent notice',
        do: 'Open **Purpose-bound consent**.',
        see: 'The single purpose, who is responsible, what is kept and what is never asked for, who sees what, how long data is kept and people\'s rights. On the right is the approval workflow with the City of Espoo DPO.',
        why: 'Participants agree to exactly this before sharing. The DPO sign-off is simulated in the prototype.',
        go: { href: '#/privacy/consent', label: 'Open the consent notice' },
      },
      {
        title: 'Test withdrawing consent',
        do: 'Click **Withdraw consent and delete data** and confirm.',
        see: 'The current participant\'s answers, drafts, saved challenges and conversations are deleted at once. The participant view then offers to start as a new participant.',
        why: 'Withdrawing consent works straight away, without waiting 30 days. Use **Reset demo data** afterwards to restore the demo.',
        go: { href: '#/privacy/consent', label: 'Try the withdrawal' },
      },
      {
        title: 'Audit the stored data',
        do: 'Open **Data and live audit**.',
        see: 'A table of every kind of personal data with live counts, who can see it and when it is deleted. Below it, the forbidden-field audit and the log of decisions people made.',
        why: 'The audit scans everything stored for 22 forbidden field names, such as nationality, age, photo and score.',
        go: { href: '#/privacy/data', label: 'Open the audit' },
      },
      {
        title: 'Simulate the 30-day deletion',
        do: 'Open **30-day deletion** and click **Simulate 30-day post-event auto-deletion**, then confirm.',
        see: 'A before-and-after table with every personal record at 0, next to the anonymous figures that are kept: answers shared, conversations held and the mutual opt-in rate.',
        why: 'This is exactly what the automatic job does 30 days after the event.',
        go: { href: '#/privacy/purge', label: 'Open 30-day deletion' },
      },
      {
        title: 'Check that the statistics survive',
        do: 'Switch to **Espoo organizer** and open **Insights** and **Company reports**. When you\'re done, click **Reset demo data**.',
        see: 'The totals and company reports are still there with no personal data behind them, and a note says when the deletion ran.',
        why: 'The city keeps what it learned without keeping anyone\'s data.',
        go: { href: '#/organizer/insights', label: 'Open Insights' },
      },
    ],
  },
};

const ORDER = ['start', 'participant', 'recruiter', 'organizer', 'privacy'];

export function tabs() {
  return ORDER.map((id) => {
    const total = GUIDES[id].steps.length;
    const done = GUIDES[id].steps.filter((_, i) => progress[`${id}:${i}`]).length;
    return { id, label: GUIDES[id].label + (done === total ? ' ✓' : '') };
  });
}

export function context() {
  return `<span>${ICON.person}</span><span><strong>Step-by-step guide.</strong> Every step works with the original demo data, and “Try it” takes you to the right screen.</span>`;
}

export function render(state, tab) {
  const g = GUIDES[tab] || GUIDES.start;
  const id = GUIDES[tab] ? tab : 'start';
  const done = g.steps.filter((_, i) => progress[`${id}:${i}`]).length;
  const pct = Math.round((done / g.steps.length) * 100);
  const next = ORDER[ORDER.indexOf(id) + 1];
  return `
  <div class="split">
    <article aria-labelledby="g-title">
      <h1 id="g-title">${esc(g.title)}</h1>
      <p class="lede">${esc(g.intro)}</p>
      <p class="small muted">For: ${esc(g.youAre)}. ${g.steps.length} steps.</p>
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
                  ${s.go ? `<a class="btn btn--sm btn--secondary" href="${esc(s.go.href)}" data-go="${esc(s.go.href)}" ${s.go.company ? `data-company="${esc(s.go.company)}"` : ''}>Try it: ${esc(s.go.label)}</a>` : ''}
                  <button type="button" class="btn btn--sm btn--ghost" data-done="${key}" id="done-${key.replace(':', '-')}" aria-pressed="${isDone}">${isDone ? 'Done' : 'Mark as done'}<span class="sr-only">: ${esc(s.title)}</span></button>
                </div>
              </div>
            </li>`;
          })
          .join('')}
      </ol>
      ${next ? `<div class="panel panel--quiet no-print" style="margin-top:var(--s6)"><p style="margin:0">Next: <a href="#/guide/${next}">${esc(GUIDES[next].title)}</a></p></div>` : ''}
    </article>
    <aside class="stack guide-aside no-print">
      <div class="panel">
        <div class="quota" role="group" aria-label="Guide progress">
          <div class="quota__label"><span>${done} of ${g.steps.length} steps done</span><span class="muted">${pct}%</span></div>
          <div class="kpi__track" style="height:10px" aria-hidden="true"><div class="kpi__fill" style="width:${pct}%"></div></div>
        </div>
        <ol class="guide-toc">
          ${g.steps.map((s, i) => `<li class="${progress[`${id}:${i}`] ? 'is-done' : ''}"><button type="button" class="linkbtn" data-jump="gs-${i}">${esc(s.title)}</button></li>`).join('')}
        </ol>
      </div>
      <div class="panel panel--quiet">
        <h3>All guides</h3>
        <ul class="guide-all">${ORDER.map((k) => `<li><a href="#/guide/${k}" ${k === id ? 'aria-current="page"' : ''}>${esc(GUIDES[k].title)}</a></li>`).join('')}</ul>
        <div class="row" style="margin-top:var(--s4)">
          <button type="button" class="btn btn--sm btn--ghost" id="print-guide">Print this guide</button>
          <button type="button" class="btn btn--sm btn--ghost" id="reset-progress">Clear my ticks</button>
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
      update((s) => (s.currentCompanyId = company), { render: false });
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
