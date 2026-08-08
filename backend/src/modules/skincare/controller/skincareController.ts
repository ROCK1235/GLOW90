import { Request, Response } from 'express';
import { skincareService } from '../service/skincareService.js';

export class SkincareController {
  async create(req: Request, res: Response): Promise<void> {
    const routine = await skincareService.createRoutine(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { routine } });
  }

  async list(req: Request, res: Response): Promise<void> {
    const includeArchived = req.query.includeArchived === 'true';
    const routines = await skincareService.listRoutines(req.user!.userId, includeArchived);
    res.json({ success: true, data: { routines } });
  }

  async getOne(req: Request, res: Response): Promise<void> {
    const routine = await skincareService.getRoutine(req.user!.userId, req.params.id);
    res.json({ success: true, data: { routine } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const routine = await skincareService.updateRoutine(req.user!.userId, req.params.id, req.body);
    res.json({ success: true, data: { routine } });
  }

  async archive(req: Request, res: Response): Promise<void> {
    const routine = await skincareService.archiveRoutine(req.user!.userId, req.params.id);
    res.json({ success: true, data: { routine } });
  }

  async logRoutine(req: Request, res: Response): Promise<void> {
    const result = await skincareService.logRoutine(
      req.user!.userId,
      req.params.id,
      req.body.date,
      req.body.completedSteps
    );
    res.status(result.alreadyLogged ? 200 : 201).json({
      success: true,
      data: { routine: result.routine, log: result.log, alreadyLogged: result.alreadyLogged },
    });
  }

  async undoLog(req: Request, res: Response): Promise<void> {
    await skincareService.undoLog(req.user!.userId, req.params.id, req.params.date);
    res.json({ success: true, data: { message: 'Log removed' } });
  }

  async listLogs(req: Request, res: Response): Promise<void> {
    const logs = await skincareService.listLogs(
      req.user!.userId,
      req.params.id,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json({ success: true, data: { logs } });
  }
}

export const skincareController = new SkincareController();
