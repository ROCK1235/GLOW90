import { Request, Response } from 'express';
import { weightService } from '../service/weightService.js';

export class WeightController {
  async logWeight(req: Request, res: Response): Promise<void> {
    const log = await weightService.logWeight(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { log } });
  }

  async getLatest(req: Request, res: Response): Promise<void> {
    const log = await weightService.getLatest(req.user!.userId);
    res.json({ success: true, data: { log } });
  }

  async deleteLog(req: Request, res: Response): Promise<void> {
    await weightService.deleteLog(req.user!.userId, req.params.date);
    res.json({ success: true, data: { message: 'Weight log removed' } });
  }

  async listLogs(req: Request, res: Response): Promise<void> {
    const logs = await weightService.listLogs(
      req.user!.userId,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json({ success: true, data: { logs } });
  }
}

export const weightController = new WeightController();
