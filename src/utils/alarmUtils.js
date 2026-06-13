import { addDays, addWeeks, nextDay, setHours, setMinutes, parseISO, startOfDay } from 'date-fns';

const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

export function getNextAlarmDate(alarm) {
  const now = new Date();
  const [h, m] = alarm.time.split(':').map(Number);

  const setTime = (date) => {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  };

  if (alarm.repeat === 'once') {
    if (!alarm.date) return null;
    const d = setTime(typeof alarm.date === 'string' ? parseISO(alarm.date) : new Date(alarm.date));
    return d > now ? d : null;
  }

  if (alarm.repeat === 'daily') {
    const today = setTime(now);
    return today > now ? today : setTime(addDays(now, 1));
  }

  if (alarm.repeat === 'weekly' && alarm.days?.length > 0) {
    const todayIdx = now.getDay();
    const dayIndices = alarm.days.map((d) => DAY_MAP[d]);
    let best = null;
    for (let offset = 0; offset <= 7; offset++) {
      const candidate = addDays(now, offset);
      const idx = candidate.getDay();
      if (dayIndices.includes(idx)) {
        const t = setTime(candidate);
        if (t > now) {
          best = t;
          break;
        }
      }
    }
    return best;
  }

  return null;
}

export function formatRepeat(alarm) {
  if (alarm.repeat === 'once') return 'Once';
  if (alarm.repeat === 'daily') return 'Every day';
  if (alarm.repeat === 'weekly') {
    if (!alarm.days?.length) return 'Weekly';
    const labels = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
    return alarm.days.map((d) => labels[d] || d).join(', ');
  }
  return '';
}

export function formatTime12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}
