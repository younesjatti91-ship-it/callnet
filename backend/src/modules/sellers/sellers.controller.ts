import { Request, Response, NextFunction } from 'express';
import { SellersService } from './sellers.service';
import { UserRoleEnum } from '../../database/entities';

const sellersService = new SellersService();

export class SellersController {
  async listSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellers = await sellersService.listSellers();
      res.json({ success: true, data: sellers });
    } catch (err) {
      next(err);
    }
  }

  async getSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await sellersService.getSellerById(req.params.id);
      res.json({ success: true, data: seller });
    } catch (err) {
      next(err);
    }
  }

  async getAllStores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stores = await sellersService.getAllStores();
      res.json({ success: true, data: stores });
    } catch (err) {
      next(err);
    }
  }

  async getMyStores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stores = await sellersService.getStoresForUser(req.user!.id);
      res.json({ success: true, data: stores });
    } catch (err) {
      next(err);
    }
  }

  async createStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await sellersService.createStore(req.params.sellerId, req.body);
      res.status(201).json({ success: true, data: store });
    } catch (err) {
      next(err);
    }
  }

  async createStoreDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await sellersService.createStoreForUser(req.user!.id, req.body);
      res.status(201).json({ success: true, data: store });
    } catch (err) {
      next(err);
    }
  }

  async getStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await sellersService.getStoreById(req.params.storeId);
      res.json({ success: true, data: store });
    } catch (err) {
      next(err);
    }
  }

  async updateStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updateData = { ...req.body };
      // STRICT RBAC: Only SuperAdmin can modify Agent Payout / Commission rates
      if (req.user?.role !== 'SuperAdmin') {
        delete updateData.agentCommissionPerConfirmedOrder;
        delete updateData.agentCommissionPerDeliveredOrder;
        if (updateData.settings) {
          delete updateData.settings.agentCommissionPerConfirmedOrder;
          delete updateData.settings.agentCommissionPerDeliveredOrder;
        }
      }
      const store = await sellersService.updateStore(req.params.storeId, updateData);
      res.json({ success: true, data: store });
    } catch (err) {
      next(err);
    }
  }

  async requestAgentChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sellersService.requestAgentChange(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sellersService.deleteStore(req.params.storeId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateStoreSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await sellersService.updateStoreSettings(req.params.storeId, req.body.settings);
      res.json({ success: true, data: store });
    } catch (err) {
      next(err);
    }
  }

  async assignUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignment = await sellersService.assignUserToStore(
        req.params.storeId,
        req.body.userId,
        req.body.role
      );
      res.json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  }

  async removeUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sellersService.removeUserFromStore(req.params.storeId, req.params.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agents = await sellersService.getStoreAgents(req.params.storeId);
      res.json({ success: true, data: agents });
    } catch (err) {
      next(err);
    }
  }

  async updateCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if ((req.user?.role as any) !== UserRoleEnum.SUPERADMIN) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: Only SuperAdmins can modify Agent Payout and commission rates. Admins, managers, moderators, and sellers are prohibited.',
          },
        });
        return;
      }
      const store = await sellersService.updateStoreCommissions(req.params.storeId, req.body);
      res.json({ success: true, data: store });
    } catch (err) {
      next(err);
    }
  }

  async getAgentCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const commissions = await sellersService.getAgentCommissions(req.params.storeId);
      res.json({ success: true, data: commissions });
    } catch (err) {
      next(err);
    }
  }

  async listIntegrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const integrations = await sellersService.listStoreIntegrations(req.params.storeId);
      res.json({ success: true, data: integrations });
    } catch (err) {
      next(err);
    }
  }

  async createIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const integration = await sellersService.createStoreIntegration(req.params.storeId, req.body);
      res.status(201).json({ success: true, data: integration });
    } catch (err) {
      next(err);
    }
  }

  async deleteIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sellersService.deleteStoreIntegration(req.params.storeId, req.params.integrationId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

