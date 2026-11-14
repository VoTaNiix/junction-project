// Step-by-step guide for each persona. Steps follow the seeded demo data, so every one of them
// works straight after "Reset demo data". Progress ticks are a per-viewer convenience kept in
// localStorage under their own key, so resetting the demo does not clear them.
import { esc } from '../ui.js';
import { setCurrentCompany } from '../store.js';
import { ICON } from './shared.js';

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

const ORDER = ['start', 'participant', 'host', 'organizer'];

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
