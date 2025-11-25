// Recurrence helpers - generate task instances
import type { D1Database } from '@cloudflare/workers-types';
import type { Task, TaskRecurrence, RecurrenceType } from '../db-types';

// Generate instances for the next 3 months
const GENERATE_AHEAD_DAYS = 90;

export async function generateTaskInstances(
  db: D1Database,
  taskId: number,
  recurrenceId: number,
  userId: number
): Promise<void> {
  // Get task and recurrence details
  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first<Task>();
  const recurrence = await db
    .prepare('SELECT * FROM task_recurrence WHERE id = ?')
    .bind(recurrenceId)
    .first<TaskRecurrence>();

  if (!task || !recurrence || recurrence.is_active === 0) {
    return;
  }

  // Delete future instances that haven't been modified
  await db
    .prepare(
      'DELETE FROM task_instances WHERE recurrence_id = ? AND scheduled_datetime > datetime("now") AND is_modified = 0'
    )
    .bind(recurrenceId)
    .run();

  const startDate = new Date(task.start_datetime);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + GENERATE_AHEAD_DAYS);

  const instances = calculateOccurrences(
    startDate,
    endDate,
    recurrence.recurrence_type,
    recurrence.interval_value,
    recurrence.days_of_week,
    recurrence.day_of_month,
    recurrence.end_type,
    recurrence.end_date,
    recurrence.end_count
  );

  // Insert new instances
  for (const scheduledDate of instances) {
    // Check if instance already exists
    const existing = await db
      .prepare(
        'SELECT id FROM task_instances WHERE recurrence_id = ? AND scheduled_datetime = ?'
      )
      .bind(recurrenceId, scheduledDate.toISOString())
      .first();

    if (!existing) {
      await db
        .prepare(`
        INSERT INTO task_instances (
          parent_task_id, recurrence_id, user_id, scheduled_datetime,
          title, description, priority, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          taskId,
          recurrenceId,
          userId,
          scheduledDate.toISOString(),
          task.title,
          task.description,
          task.priority,
          'planned'
        )
        .run();
    }
  }
}

function calculateOccurrences(
  startDate: Date,
  endDate: Date,
  recurrenceType: RecurrenceType,
  intervalValue: number,
  daysOfWeek: string | null,
  dayOfMonth: number | null,
  endType: string,
  endDateStr: string | null,
  endCount: number | null
): Date[] {
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);
  let count = 0;

  const maxEnd =
    endType === 'date' && endDateStr ? new Date(endDateStr) : endDate;

  while (currentDate <= maxEnd && currentDate <= endDate) {
    // Check if we've reached the count limit
    if (endType === 'count' && endCount && count >= endCount) {
      break;
    }

    // Add current occurrence
    if (currentDate >= startDate) {
      occurrences.push(new Date(currentDate));
      count++;
    }

    // Calculate next occurrence
    currentDate = getNextOccurrence(
      currentDate,
      recurrenceType,
      intervalValue,
      daysOfWeek,
      dayOfMonth
    );

    // Safety check to prevent infinite loops
    if (occurrences.length > 1000) {
      break;
    }
  }

  return occurrences;
}

function getNextOccurrence(
  currentDate: Date,
  recurrenceType: RecurrenceType,
  intervalValue: number,
  daysOfWeek: string | null,
  dayOfMonth: number | null
): Date {
  const next = new Date(currentDate);

  switch (recurrenceType) {
    case 'daily':
      next.setDate(next.getDate() + intervalValue);
      break;

    case 'weekly':
      if (daysOfWeek) {
        const days = JSON.parse(daysOfWeek) as number[];
        const currentDay = next.getDay();
        
        // Find next day in the week
        let foundNextDay = false;
        for (const day of days) {
          if (day > currentDay) {
            next.setDate(next.getDate() + (day - currentDay));
            foundNextDay = true;
            break;
          }
        }
        
        if (!foundNextDay) {
          // Move to next week, first day
          const daysToAdd = 7 - currentDay + days[0];
          next.setDate(next.getDate() + daysToAdd);
        }
      } else {
        next.setDate(next.getDate() + 7 * intervalValue);
      }
      break;

    case 'monthly':
      if (dayOfMonth) {
        next.setMonth(next.getMonth() + intervalValue);
        next.setDate(Math.min(dayOfMonth, getDaysInMonth(next)));
      } else {
        next.setMonth(next.getMonth() + intervalValue);
      }
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + intervalValue);
      break;

    case 'workdays':
      // Skip to next workday (Mon-Fri)
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      break;

    case 'weekends':
      // Skip to next weekend day (Sat-Sun)
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() !== 0 && next.getDay() !== 6);
      break;

    case 'custom':
      // Custom interval in days
      next.setDate(next.getDate() + intervalValue);
      break;
  }

  return next;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

