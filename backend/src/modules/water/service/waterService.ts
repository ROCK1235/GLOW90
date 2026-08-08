import { waterRepository } from '../repository/waterRepository.js';
import { userRepository } from '../../users/repository/userRepository.js';
import { IWaterLog } from '../model/index.js';
import { eventBus, DomainEvents } from '../../../events/bus.js';
import { addDaysStr, todayStr } from '../../../common/utils/dateCadence.js';

const DEFAULT_GOAL_ML = 2500;

export interface WaterDailyState {
  date: string;
  totalMl: number;
  goalMl: number;
  goalMet: boolean;
}

class WaterService {
  private async getGoal(userId: string): Promise<number> {
    const settings = await userRepository.findSettingsByUserId(userId);
    return settings?.hydration?.dailyGoalMl ?? DEFAULT_GOAL_ML;
  }

  async logWater(userId: string, amountMl: number, date?: string): Promise<{ log: IWaterLog } & WaterDailyState> {
    const logDate = date ?? todayStr();

    const existingLogs = await waterRepository.findByDate(userId, logDate);
    const previousTotal = existingLogs.reduce((sum, l) => sum + l.amountMl, 0);

    const log = await waterRepository.create({
      userId: userId as any,
      date: logDate,
      amountMl,
      loggedAt: new Date(),
    });

    const totalMl = previousTotal + amountMl;
    const goalMl = await this.getGoal(userId);
    const goalMet = totalMl >= goalMl;
    const wasGoalMet = previousTotal >= goalMl;

    if (goalMet && !wasGoalMet) {
      await eventBus.emit(DomainEvents.WATER_GOAL_MET, { userId, date: logDate, totalMl, goalMl });
    }

    return { log, date: logDate, totalMl, goalMl, goalMet };
  }

  async undoLog(userId: string, logId: string): Promise<void> {
    const log = await waterRepository.findOwnedLog(userId, logId);
    if (!log) {
      throw new Error('WATER_LOG_NOT_FOUND');
    }
    await waterRepository.deleteById(logId);
  }

  async getDailySummary(userId: string, date?: string): Promise<WaterDailyState & { logs: IWaterLog[] }> {
    const summaryDate = date ?? todayStr();
    const logs = await waterRepository.findByDate(userId, summaryDate);
    const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
    const goalMl = await this.getGoal(userId);

    return { date: summaryDate, totalMl, goalMl, goalMet: totalMl >= goalMl, logs };
  }

  async listLogs(userId: string, from?: string, to?: string): Promise<IWaterLog[]> {
    const toDate = to ?? todayStr();
    const fromDate = from ?? addDaysStr(toDate, -30);
    return waterRepository.findInRange(userId, fromDate, toDate);
  }
}

export const waterService = new WaterService();
