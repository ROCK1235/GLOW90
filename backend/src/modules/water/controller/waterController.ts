import { Request, Response } from 'express';
import { waterService } from '../service/waterService.js';

export class WaterController {
  async logWater(req: Request, res: Response): Promise<void> {
    const result = await waterService.logWater(req.user!.userId, req.body.amountMl, req.body.date);
    res.status(201).json({ success: true, data: result });
  }

  async undoLog(req: Request, res: Response): Promise<void> {
    await waterService.undoLog(req.user!.userId, req.params.logId);
    res.json({ success: true, data: { message: 'Water log removed' } });
  }

  async getDailySummary(req: Request, res: Response): Promise<void> {
    const summary = await waterService.getDailySummary(req.user!.userId, req.query.date as string | undefined);
    res.json({ success: true, data: { summary } });
  }

  async listLogs(req: Request, res: Response): Promise<void> {
    const logs = await waterService.listLogs(
      req.user!.userId,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json({ success: true, data: { logs } });
  }
}

export const waterController = new WaterController();
