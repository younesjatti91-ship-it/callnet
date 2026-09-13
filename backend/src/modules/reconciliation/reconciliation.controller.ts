import { Request, Response, NextFunction } from 'express';
import { ReconciliationService } from './reconciliation.service';
import { DiscrepancyResolutionEnum } from '../../database/entities';

const reconService = new ReconciliationService();

export class ReconciliationController {
  async uploadAndProcess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const { fileName, courierAccountId, rows } = req.body;

      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        res.status(400).json({ success: false, error: { message: 'rows array is required' } });
        return;
      }

      const file = await reconService.processRemittanceData(storeId, {
        fileName: fileName || `remittance_${Date.now()}.csv`,
        courierAccountId,
        rows,
      });

      res.status(201).json({ success: true, data: file });
    } catch (err) {
      next(err);
    }
  }

  async listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = await reconService.listFiles(req.params.storeId);
      res.json({ success: true, data: files });
    } catch (err) {
      next(err);
    }
  }

  async getFileRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await reconService.getFileRecords(req.params.fileId);
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async listDiscrepancies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const discrepancies = await reconService.listDiscrepancies(
        req.params.storeId,
        status as DiscrepancyResolutionEnum
      );
      res.json({ success: true, data: discrepancies });
    } catch (err) {
      next(err);
    }
  }

  async resolveDiscrepancy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, discrepancyId } = req.params;
      const { resolutionStatus, resolutionNotes } = req.body;

      const result = await reconService.resolveDiscrepancy(storeId, discrepancyId, {
        resolutionStatus,
        resolutionNotes,
        resolvedByUserId: req.user?.id,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
