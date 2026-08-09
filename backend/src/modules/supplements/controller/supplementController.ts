import { Request, Response } from 'express';
import { supplementService } from '../service/supplementService.js';

export class SupplementController {
  async create(req: Request, res: Response): Promise<void> {
    const supplement = await supplementService.createSupplement(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { supplement } });
  }

  async list(req: Request, res: Response): Promise<void> {
    const includeArchived = req.query.includeArchived === 'true';
    const supplements = await supplementService.listSupplements(req.user!.userId, includeArchived);
    res.json({ success: true, data: { supplements } });
  }

  async getOne(req: Request, res: Response): Promise<void> {
    const supplement = await supplementService.getSupplement(req.user!.userId, req.params.id);
    res.json({ success: true, data: { supplement } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const supplement = await supplementService.updateSupplement(req.user!.userId, req.params.id, req.body);
    res.json({ success: true, data: { supplement } });
  }

  async archive(req: Request, res: Response): Promise<void> {
    const supplement = await supplementService.archiveSupplement(req.user!.userId, req.params.id);
    res.json({ success: true, data: { supplement } });
  }

  async logDose(req: Request, res: Response): Promise<void> {
    const result = await supplementService.logDose(req.user!.userId, req.params.id, req.body.date, req.body.time);
    res.status(result.alreadyLogged ? 200 : 201).json({
      success: true,
      data: { supplement: result.supplement, alreadyLogged: result.alreadyLogged },
    });
  }

  async undoDose(req: Request, res: Response): Promise<void> {
    await supplementService.undoDose(req.user!.userId, req.params.id, req.params.date, req.params.time);
    res.json({ success: true, data: { message: 'Dose log removed' } });
  }

  async listLogs(req: Request, res: Response): Promise<void> {
    const logs = await supplementService.listLogs(
      req.user!.userId,
      req.params.id,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json({ success: true, data: { logs } });
  }

  async getAdherence(req: Request, res: Response): Promise<void> {
    const adherence = await supplementService.getAdherence(
      req.user!.userId,
      req.params.id,
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json({ success: true, data: { adherence } });
  }
}

export const supplementController = new SupplementController();
