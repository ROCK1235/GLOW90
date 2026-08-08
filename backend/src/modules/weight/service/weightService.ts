import { weightRepository } from '../repository/weightRepository.js';
import { IBodyMeasurements, IWeightLog } from '../model/index.js';
import { eventBus, DomainEvents } from '../../../events/bus.js';
import { LogWeightInput } from '../schema/weightSchema.js';
import { addDaysStr, todayStr } from '../../../common/utils/dateCadence.js';

const DEFAULT_LOOKBACK_DAYS = 90;

function normalizeMeasurements(
  measurements: LogWeightInput['measurements']
): IBodyMeasurements | null {
  if (!measurements) return null;
  return {
    waistCm: measurements.waistCm ?? null,
    chestCm: measurements.chestCm ?? null,
    hipsCm: measurements.hipsCm ?? null,
    armsCm: measurements.armsCm ?? null,
    thighsCm: measurements.thighsCm ?? null,
  };
}

class WeightService {
  async logWeight(userId: string, data: LogWeightInput): Promise<IWeightLog> {
    const logDate = data.date ?? todayStr();

    const log = await weightRepository.upsertLog(userId, logDate, {
      userId: userId as any,
      date: logDate,
      weightKg: data.weightKg,
      bodyFatPercent: data.bodyFatPercent ?? null,
      measurements: normalizeMeasurements(data.measurements),
      note: data.note ?? null,
      loggedAt: new Date(),
    });

    await eventBus.emit(DomainEvents.WEIGHT_LOGGED, {
      userId,
      date: logDate,
      weightKg: data.weightKg,
    });

    return log;
  }

  async getLatest(userId: string): Promise<IWeightLog | null> {
    return weightRepository.findLatest(userId);
  }

  async deleteLog(userId: string, date: string): Promise<void> {
    await weightRepository.deleteByDate(userId, date);
  }

  async listLogs(userId: string, from?: string, to?: string): Promise<IWeightLog[]> {
    const toDate = to ?? todayStr();
    const fromDate = from ?? addDaysStr(toDate, -DEFAULT_LOOKBACK_DAYS);
    return weightRepository.findInRange(userId, fromDate, toDate);
  }
}

export const weightService = new WeightService();
