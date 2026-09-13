import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

export class AdminController {
  private service = new AdminService();

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, search, page, limit } = req.query;
      const data = await this.service.listUsers({
        role: role ? String(role) : undefined,
        search: search ? String(search) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callerRole = req.user!.role;
      const result = await this.service.createUser(callerRole, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callerRole = req.user!.role;
      const { userId } = req.params;
      const { isActive } = req.body;
      const result = await this.service.toggleUserStatus(callerRole, userId, Boolean(isActive));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callerRole = req.user!.role;
      const { userId } = req.params;
      const result = await this.service.updateUser(callerRole, userId, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
