import { longLabel } from '../lib/date';
import { useData } from '../lib/data';
import { useEditors } from '../lib/editors';
import { progressFor } from '../lib/recurrence';
import {
  habitLive,
  missedDeadlineProjects,
  missedDeadlineTasks,
  overdueTasks,
  tasksScheduledOn,
  upcomingDeadlines,
  upcomingScheduled,
} from '../lib/selectors';
import { HabitRow } from '../components/HabitRow';
import { QuickAdd } from '../components/QuickAdd';
import { Empty, ListCard, Section } from '../components/Section';
import { TaskRow } from '../components/TaskRow';

export function TodayView() {
  const { tasks, habits, habitLogs, projects, pmap, today } = useData();
  const { openReview, openHabit } = useEditors();

  const reviewCount =
    overdueTasks(tasks, pmap, today).length +
    missedDeadlineTasks(tasks, pmap, today).length +
    missedDeadlineProjects(projects, today).length;

  const dueHabits = habits
    .filter((h) => habitLive(h, pmap))
    .map((h) => ({ h, p: progressFor(h, habitLogs, today) }))
    .filter((x) => x.p !== null);
  const openHabits = dueHabits.filter((x) => !x.p!.complete);
  const doneHabits = dueHabits.filter((x) => x.p!.complete);

  const scheduled = tasksScheduledOn(tasks, pmap, today);
  const openToday = scheduled.filter((t) => t.status === 'open');
  const doneToday = scheduled.filter((t) => t.status === 'done');
  const deadlines = upcomingDeadlines(tasks, pmap, today);
  const upcoming = upcomingScheduled(tasks, pmap, today);

  const nothing = dueHabits.length === 0 && scheduled.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Heute</h1>
      <p className="mb-4 text-sm text-slate-500">{longLabel(today)}</p>

      {reviewCount > 0 && (
        <button
          onClick={openReview}
          className="mb-4 flex w-full items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-left ring-1 ring-amber-200 hover:bg-amber-100"
        >
          <span className="text-xl">🧹</span>
          <span className="flex-1">
            <span className="block font-medium text-amber-900">
              {reviewCount} {reviewCount === 1 ? 'Eintrag braucht' : 'Einträge brauchen'} Aufmerksamkeit
            </span>
            <span className="block text-xs text-amber-700">Überfällige Termine und verpasste Deadlines aufräumen</span>
          </span>
          <span className="text-amber-700">→</span>
        </button>
      )}

      <QuickAdd placeholder="Aufgabe für heute…" defaults={{ scheduledDate: today }} />

      {openHabits.length > 0 && (
        <Section title="Wiederkehrend" count={openHabits.length}>
          <ListCard>
            {openHabits.map(({ h }) => (
              <HabitRow key={h.id} habit={h} />
            ))}
          </ListCard>
        </Section>
      )}

      {openToday.length > 0 && (
        <Section title="Geplant für heute" count={openToday.length}>
          <ListCard>
            {openToday.map((t) => (
              <TaskRow key={t.id} task={t} hideDate />
            ))}
          </ListCard>
        </Section>
      )}

      {nothing && (
        <div className="mt-6">
          <Empty>Für heute ist nichts geplant. Plane Aufgaben über „Aufgaben" oder lege eine Wiederholung an.</Empty>
        </div>
      )}

      {deadlines.length > 0 && (
        <Section title="Deadlines in den nächsten 7 Tagen" count={deadlines.length}>
          <ListCard>
            {deadlines.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ListCard>
        </Section>
      )}

      {(doneHabits.length > 0 || doneToday.length > 0) && (
        <Section title="Erledigt" count={doneHabits.length + doneToday.length} collapsible defaultOpen={false}>
          <ListCard>
            {doneHabits.map(({ h }) => (
              <HabitRow key={h.id} habit={h} />
            ))}
            {doneToday.map((t) => (
              <TaskRow key={t.id} task={t} hideDate />
            ))}
          </ListCard>
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Demnächst" count={upcoming.length} collapsible defaultOpen={false}>
          <ListCard>
            {upcoming.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ListCard>
        </Section>
      )}

      <div className="mt-6 flex justify-center">
        <button className="btn-ghost text-sm" onClick={() => openHabit()}>
          ↻ Wiederholung anlegen
        </button>
      </div>
    </div>
  );
}
