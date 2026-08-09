import { Request, Response } from 'express';
import { habitService } from '../service/habitService.js';

export class HabitController {
  async create(req: Request, res: Response): Promise<void> {
    const habit = await habitService.createHabit(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { habit } });
  }

  async list(req: Request, res: Response): Promise<void> {
    const includeArchived = req.query.includeArchived === 'true';
    const habits = await habitService.listHabits(req.user!.userId, includeArchived);
    res.json({ success: true, data: { habits } });
  }

  async getOne(req: Request, res: Response): Promise<void> {
    const habit = await habitService.getHabit(req.user!.userId, req.params.id);
    res.json({ success: true, data: { habit } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const habit = await habitService.updateHabit(req.user!.userId, req.params.id, req.body);
    res.json({ success: true, data: { habit } });
  }

  async archive(req: Request, res: Response): Promise<void> {
    const habit = await habitService.archiveHabit(req.user!.userId, req.params.id);
    res.json({ success: true, data: { habit } });
  }

  async logCompletion(req: Request, res: Response): Promise<void> {
    const result = await habitService.logCompletion(req.user!.userId, req.params.id, req.body.date);
    res.status(result.alreadyLogged ? 200 : 201).json({
      success: true,
      data: { habit: result.habit, alreadyLogged: result.alreadyLogged },
    });
  }

  async undoLog(req: Request, res: Response): Promise<void> {
    const habit = await habitService.undoCompletion(req.user!.userId, req.params.id, req.params.date);
    res.json({ success: true, data: { habit } });
  }

  async listLogs(req: Request, res: Response): Promise<void> {
    const logs = await habitService.listLogs(
      req.user!.userId,
      req.params.id,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json({ success: true, data: { logs } });
  }
}

export const habitController = new HabitController();
