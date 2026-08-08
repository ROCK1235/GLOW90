import { skincareRepository } from '../repository/skincareRepository.js';
import { ISkincareLog, ISkincareRoutine, ISkincareStep } from '../model/index.js';
import { eventBus, DomainEvents } from '../../../events/bus.js';
import { CreateRoutineInput, UpdateRoutineInput } from '../schema/skincareSchema.js';
import { addDaysStr, todayStr } from '../../../common/utils/dateCadence.js';

function toOrderedSteps(steps: Array<{ name: string; product?: string | null }>): ISkincareStep[] {
  return steps.map((step, index) => ({
    order: index + 1,
    name: step.name,
    product: step.product ?? null,
  }));
}

class SkincareService {
  async createRoutine(userId: string, data: CreateRoutineInput): Promise<ISkincareRoutine> {
    return skincareRepository.create({
      userId: userId as any,
      name: data.name,
      timeOfDay: data.timeOfDay ?? 'anytime',
      steps: toOrderedSteps(data.steps),
      cadence: { daysOfWeek: data.daysOfWeek ?? [] },
    });
  }

  async listRoutines(userId: string, includeArchived: boolean): Promise<ISkincareRoutine[]> {
    return skincareRepository.findByUser(userId, includeArchived);
  }

  async getRoutine(userId: string, routineId: string): Promise<ISkincareRoutine> {
    const routine = await skincareRepository.findById(routineId);
    if (!routine || routine.userId.toString() !== userId) {
      throw new Error('SKINCARE_ROUTINE_NOT_FOUND');
    }
    return routine;
  }

  async updateRoutine(userId: string, routineId: string, updates: UpdateRoutineInput): Promise<ISkincareRoutine> {
    const routine = await this.getRoutine(userId, routineId);

    const { daysOfWeek, steps, ...rest } = updates;
    const update: Record<string, unknown> = { ...rest };
    if (steps !== undefined) {
      update.steps = toOrderedSteps(steps);
    }
    if (daysOfWeek !== undefined) {
      update.cadence = { daysOfWeek };
    }

    const updated = await skincareRepository.update(routine._id.toString(), update);
    return updated!;
  }

  async archiveRoutine(userId: string, routineId: string): Promise<ISkincareRoutine> {
    const routine = await this.getRoutine(userId, routineId);
    const archived = await skincareRepository.archive(routine._id.toString());
    return archived!;
  }

  async logRoutine(
    userId: string,
    routineId: string,
    date?: string,
    completedSteps?: number[]
  ): Promise<{ routine: ISkincareRoutine; log: ISkincareLog; alreadyLogged: boolean }> {
    const routine = await this.getRoutine(userId, routineId);
    const logDate = date ?? todayStr();
    const totalSteps = routine.steps.length;

    const validOrders = new Set(routine.steps.map((s) => s.order));
    const requestedSteps = completedSteps ?? routine.steps.map((s) => s.order);
    const steps = [...new Set(requestedSteps.filter((order) => validOrders.has(order)))].sort((a, b) => a - b);

    const isComplete = totalSteps > 0 && steps.length >= totalSteps;

    const existing = await skincareRepository.findLog(routine._id.toString(), logDate);
    const wasComplete = existing?.isComplete ?? false;

    const log = await skincareRepository.upsertLog(routine._id.toString(), logDate, {
      userId: routine.userId,
      routineId: routine._id,
      date: logDate,
      completedSteps: steps,
      totalSteps,
      isComplete,
      completedAt: new Date(),
    });

    if (isComplete && !wasComplete) {
      await eventBus.emit(DomainEvents.SKINCARE_COMPLETED, {
        userId,
        routineId: routine._id.toString(),
        date: logDate,
      });
    }

    return { routine, log, alreadyLogged: wasComplete && isComplete };
  }

  async undoLog(userId: string, routineId: string, date: string): Promise<void> {
    const routine = await this.getRoutine(userId, routineId);
    await skincareRepository.deleteLog(routine._id.toString(), date);
  }

  async listLogs(userId: string, routineId: string, from?: string, to?: string): Promise<ISkincareLog[]> {
    const routine = await this.getRoutine(userId, routineId);
    const toDate = to ?? todayStr();
    const fromDate = from ?? addDaysStr(toDate, -30);
    return skincareRepository.findLogsInRange(routine._id.toString(), fromDate, toDate);
  }
}

export const skincareService = new SkincareService();
