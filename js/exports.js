// Export utilities. Everything is generated in the browser and downloaded locally;
// nothing is sent to a network endpoint.
import { getState, isConfirmed, company, challenge, participant, slot, canRevealIdentity, pseudoLabel } from './store.js';
import { format as fmtOf } from './formats.js';

export function downloadFile(filename, mime, text) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function confirmedMeetings() {
  return getState().meetings.filter(isConfirmed);
}

function who(m) {
  const p = participant(m.participantId);
  if (!p) return { label: 'Solver (deleted)', email: '' };
  return canRevealIdentity(m) ? { label: p.name, email: p.email } : { label: pseudoLabel(m.participantId), email: '' };
}

// ---------- .ics (RFC 5545) ----------
const icsDate = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Lines longer than 75 octets must be folded (RFC 5545 §3.1).
const enc = new TextEncoder();
function fold(line) {
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 74) {
      out.push(cur);
      cur = ' ';
      bytes = 1;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n');
}

export function buildIcs(meetings = confirmedMeetings()) {
  const s = getState();
  const stamp = icsDate(new Date().toISOString());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Skillink//Espoo pre-event matchmaking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsText(s.event.name)}`];
  meetings.forEach((m) => {
    const sl = slot(m.slotId);
    const c = company(m.companyId);
    const ch = challenge(m.challengeId);
    const p = who(m);
    const f = fmtOf(m.format || 'open');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${m.id}@skillink.espoo.example`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(sl.start)}`,
      `DTEND:${icsDate(sl.end)}`,
      `SUMMARY:${icsText(`Skillink conversation: ${c.name} and ${p.label}`)}`,
      `LOCATION:${icsText(sl.location)}`,
      `CATEGORIES:${icsText(f.label)}`,
      `DESCRIPTION:${icsText(`Challenge: ${ch.title}\nCollaboration format: ${f.label}\nA real conversation about a real problem. Approved by the City of Espoo event team.`)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

// ---------- Brella / Tavata ----------
// Generic schedule columns. Brella and Tavata publish their own import formats to customers;
// map these columns to the current spec when connecting a real event.
const BRELLA_COLUMNS = ['meeting_id', 'start_time', 'end_time', 'title', 'location', 'host_company', 'host_contact_email', 'guest_name', 'guest_email', 'challenge', 'collaboration_format'];

const csvCell = (v) => {
  const t = String(v ?? '');
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

function row(m) {
  const sl = slot(m.slotId);
  const c = company(m.companyId);
  const ch = challenge(m.challengeId);
  const p = who(m);
  return {
    meeting_id: m.id,
    start_time: new Date(sl.start).toISOString(),
    end_time: new Date(sl.end).toISOString(),
    title: `Skillink: ${c.name}`,
    location: sl.location,
    host_company: c.name,
    host_contact_email: c.hostEmail || '',
    guest_name: p.label,
    guest_email: p.email,
    challenge: ch.title,
    collaboration_format: fmtOf(m.format || 'open').label,
  };
}

export function buildBrellaCsv(meetings = confirmedMeetings()) {
  const rows = meetings.map(row);
  return [BRELLA_COLUMNS.join(','), ...rows.map((r) => BRELLA_COLUMNS.map((k) => csvCell(r[k])).join(','))].join('\r\n') + '\r\n';
}

export function buildTavataJson(meetings = confirmedMeetings()) {
  const s = getState();
  return JSON.stringify(
    {
      source: 'skillink',
      schema: 'skillink.schedule.v1',
      event: { name: s.event.name, date: s.event.date, venue: s.event.venue, timezone: 'Europe/Helsinki' },
      generatedAt: new Date().toISOString(),
      meetings: meetings.map((m) => {
        const r = row(m);
        return {
          id: r.meeting_id,
          start: r.start_time,
          end: r.end_time,
          location: r.location,
          title: r.title,
          participants: [
            { role: 'host', organisation: r.host_company, email: r.host_contact_email },
            { role: 'guest', name: r.guest_name, email: r.guest_email },
          ],
          topic: r.challenge,
          collaborationFormat: r.collaboration_format,
        };
      }),
    },
    null,
    2,
  );
}
