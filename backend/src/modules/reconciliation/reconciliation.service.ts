import { AppDataSource } from '../../database/dataSource';
import {
  RemittanceFile,
  RemittanceFileStatusEnum,
  ReconciliationRecord,
  ReconciliationStatusEnum,
  PayoutDiscrepancy,
  DiscrepancyResolutionEnum,
  Order,
  OrderStatusEnum,
  RemittanceStatusEnum,
  AuditLog,
} from '../../database/entities';

export interface RemittanceRowInput {
  trackingNumber: string;
  remittedAmount: number;
  carrierStatus?: string;
  notes?: string;
}

export class ReconciliationService {
  private fileRepo = AppDataSource.getRepository(RemittanceFile);
  private recordRepo = AppDataSource.getRepository(ReconciliationRecord);
  private discrepancyRepo = AppDataSource.getRepository(PayoutDiscrepancy);
  private orderRepo = AppDataSource.getRepository(Order);
  private auditRepo = AppDataSource.getRepository(AuditLog);

  async processRemittanceData(
    storeId: string,
    data: {
      fileName: string;
      courierAccountId?: string;
      rows: RemittanceRowInput[];
    }
  ) {
    const file = this.fileRepo.create({
      storeId,
      courierAccountId: data.courierAccountId,
      fileName: data.fileName,
      status: RemittanceFileStatusEnum.PROCESSING,
      totalRows: data.rows.length,
      matchedRows: 0,
      discrepancyRows: 0,
      totalRemittedAmount: 0,
    });
    const savedFile = await this.fileRepo.save(file);

    let matchedCount = 0;
    let discrepancyCount = 0;
    let totalRemitted = 0;

    for (const row of data.rows) {
      const tracking = (row.trackingNumber || '').trim();
      const remittedAmount = Number(row.remittedAmount) || 0;
      totalRemitted += remittedAmount;

      // Find order by tracking number in this store
      const order = await this.orderRepo.findOne({
        where: { storeId, trackingNumber: tracking },
      });

      let status = ReconciliationStatusEnum.MATCHED;
      let expectedAmount = 0;
      let diff = 0;
      let discrepancyType: string | null = null;

      if (!order) {
        status = ReconciliationStatusEnum.ORDER_NOT_FOUND;
        diff = -remittedAmount;
        discrepancyType = 'ghost_shipment';
      } else {
        expectedAmount = Number(order.codAmount) || 0;
        diff = remittedAmount - expectedAmount;

        if (order.status !== OrderStatusEnum.DELIVERED) {
          status = ReconciliationStatusEnum.STATUS_MISMATCH;
          discrepancyType = 'uncollected_returned';
        } else if (Math.abs(diff) > 0.01) {
          status = ReconciliationStatusEnum.AMOUNT_MISMATCH;
          discrepancyType = diff < 0 ? 'underpayment' : 'overpayment';
        }
      }

      // Create ReconciliationRecord
      const record = await this.recordRepo.save(
        this.recordRepo.create({
          remittanceFileId: savedFile.id,
          storeId,
          orderId: order?.id,
          trackingNumber: tracking,
          expectedAmount,
          remittedAmount,
          differenceAmount: diff,
          status,
          carrierStatus: row.carrierStatus,
          notes: row.notes,
        })
      );

      if (status === ReconciliationStatusEnum.MATCHED) {
        matchedCount += 1;
        if (order) {
          order.remittanceStatus = RemittanceStatusEnum.RECONCILED;
          await this.orderRepo.save(order);
        }
      } else {
        discrepancyCount += 1;
        if (order) {
          order.remittanceStatus = RemittanceStatusEnum.DISCREPANCY;
          await this.orderRepo.save(order);
        }

        // Create PayoutDiscrepancy for resolution
        await this.discrepancyRepo.save(
          this.discrepancyRepo.create({
            storeId,
            reconciliationRecordId: record.id,
            orderId: order?.id,
            trackingNumber: tracking,
            discrepancyType: discrepancyType || 'amount_discrepancy',
            discrepancyAmount: Math.abs(diff),
            resolutionStatus: DiscrepancyResolutionEnum.OPEN,
          })
        );
      }
    }

    savedFile.matchedRows = matchedCount;
    savedFile.discrepancyRows = discrepancyCount;
    savedFile.totalRemittedAmount = totalRemitted;
    savedFile.status = RemittanceFileStatusEnum.COMPLETED;
    await this.fileRepo.save(savedFile);

    await this.auditRepo.save(
      this.auditRepo.create({
        storeId,
        action: 'reconciliation.file_processed',
        entityType: 'RemittanceFile',
        entityId: savedFile.id,
        details: { totalRows: data.rows.length, matchedCount, discrepancyCount, totalRemitted },
      })
    );

    return savedFile;
  }

  async listFiles(storeId: string) {
    return this.fileRepo.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getFileRecords(remittanceFileId: string) {
    return this.recordRepo.find({
      where: { remittanceFileId },
      order: { createdAt: 'ASC' },
    });
  }

  async listDiscrepancies(storeId: string, status?: DiscrepancyResolutionEnum) {
    const where: any = { storeId };
    if (status) where.resolutionStatus = status;

    return this.discrepancyRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async resolveDiscrepancy(
    storeId: string,
    discrepancyId: string,
    data: {
      resolutionStatus: DiscrepancyResolutionEnum;
      resolutionNotes?: string;
      resolvedByUserId?: string;
    }
  ) {
    const discrepancy = await this.discrepancyRepo.findOne({
      where: { id: discrepancyId, storeId },
    });
    if (!discrepancy) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Discrepancy not found' };

    discrepancy.resolutionStatus = data.resolutionStatus;
    discrepancy.resolutionNotes = data.resolutionNotes;
    discrepancy.resolvedByUserId = data.resolvedByUserId;
    discrepancy.resolvedAt = new Date();

    const saved = await this.discrepancyRepo.save(discrepancy);

    await this.auditRepo.save(
      this.auditRepo.create({
        storeId,
        userId: data.resolvedByUserId,
        action: 'reconciliation.discrepancy_resolved',
        entityType: 'PayoutDiscrepancy',
        entityId: saved.id,
        details: { resolutionStatus: data.resolutionStatus, notes: data.resolutionNotes },
      })
    );

    return saved;
  }
}
