import { supplementRepository } from '../repository/supplementRepository.js';
import { ISupplement, ISupplementLog } from '../model/index.js';
import { eventBus, DomainEvents } from '../../../events/bus.js';
import { CreateSupplementInput, UpdateSupplementInput } from '../schema/supplementSchema.js';
import { addDaysStr, isDueOnDate, todayStr } from '../../../common/utils/dateCadence.js';

class SupplementService {
  async createSupplement(userId: string, data: CreateSupplementInput): Promise<ISupplement> {
    return supplementRepository.create({
      userId: userId as any,
      name: data.name,
      dosageAmount: data.dosageAmount,
      dosageUnit: data.dosageUnit,
      notes: data.notes ?? null,
      schedule: {
        daysOfWeek: data.daysOfWeek ?? [],
        times: data.times ?? ['09:00'],
      },
    });
  }

  async listSupplements(userId: string, includeArchived: boolean): Promise<ISupplement[]> {
    return supplementRepository.findByUser(userId, includeArchived);
  }

  async getSupplement(userId: string, supplementId: string): Promise<ISupplement> {
    const supplement = await supplementRepository.findById(supplementId);
    if (!supplement || supplement.userId.toString() !== userId) {
      throw new Error('SUPPLEMENT_NOT_FOUND');
    }
    return supplement;
  }

  async updateSupplement(userId: string, supplementId: string, updates: UpdateSupplementInput): Promise<ISupplement> {
    const supplement = await this.getSupplement(userId, supplementId);

    const { daysOfWeek, times, ...rest } = updates;
    const update: Record<string, unknown> = { ...rest };
    if (daysOfWeek !== undefined || times !== undefined) {
      update.schedule = {
        daysOfWeek: daysOfWeek ?? supplement.schedule.daysOfWeek,
        times: times ?? supplement.schedule.times,
      };
    }

    const updated = await supplementRepository.update(supplement._id.toString(), update);
    return updated!;
  }

  async archiveSupplement(userId: string, supplementId: string): Promise<ISupplement> {
    const supplement = await this.getSupplement(userId, supplementId);
    const archived = await supplementRepository.archive(supplement._id.toString());
    return archived!;
  }

  async logDose(
    userId: string,
    supplementId: string,
    date?: string,
    time?: string
  ): Promise<{ supplement: ISupplement; alreadyLogged: boolean }> {
    const supplement = await this.getSupplement(userId, supplementId);
    const logDate = date ?? todayStr();
    const logTime = time ?? supplement.schedule.times[0] ?? '09:00';

    const existing = await supplementRepository.findLog(supplement._id.toString(), logDate, logTime);
    if (existing) {
      return { supplement, alreadyLogged: true };
    }

    await supplementRepository.createLog({
      userId: supplement.userId,
      supplementId: supplement._id,
      date: logDate,
      time: logTime,
      takenAt: new Date(),
    });

    await eventBus.emit(DomainEvents.SUPPLEMENT_TAKEN, {
      userId,
      supplementId: supplement._id.toString(),
      date: logDate,
      time: logTime,
    });

    return { supplement, alreadyLogged: false };
  }

  async undoDose(userId: string, supplementId: string, date: string, time: string): Promise<void> {
    const supplement = await this.getSupplement(userId, supplementId);
    await supplementRepository.deleteLog(supplement._id.toString(), date, time);
  }

  async listLogs(userId: string, supplementId: string, from?: string, to?: string): Promise<ISupplementLog[]> {
    const supplement = await this.getSupplement(userId, supplementId);
    const toDate = to ?? todayStr();
    const fromDate = from ?? addDaysStr(toDate, -30);
    return supplementRepository.findLogsInRange(supplement._id.toString(), fromDate, toDate);
  }

  async getAdherence(
    userId: string,
    supplementId: string,
    from?: string,
    to?: string
  ): Promise<{ from: string; to: string; expectedDoses: number; takenDoses: number; adherenceRate: number }> {
    const supplement = await this.getSupplement(userId, supplementId);
    const toDate = to ?? todayStr();
    const fromDate = from ?? addDaysStr(toDate, -30);

    let expectedDoses = 0;
    let cursor = fromDate;
    while (cursor <= toDate) {
      if (isDueOnDate(supplement.schedule.daysOfWeek, cursor)) {
        expectedDoses += supplement.schedule.times.length;
      }
      cursor = addDaysStr(cursor, 1);
    }

    const takenDoses = await supplementRepository.countLogsInRange(supplement._id.toString(), fromDate, toDate);
    const adherenceRate = expectedDoses > 0 ? Math.min(1, takenDoses / expectedDoses) : 0;

    return { from: fromDate, to: toDate, expectedDoses, takenDoses, adherenceRate };
  }
}

export const supplementService = new SupplementService();
