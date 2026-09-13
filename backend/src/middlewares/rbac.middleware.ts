import { Request, Response, NextFunction } from 'express';
import { UserRoleEnum } from '../database/entities';

/**
 * Role-Based Access Control Middleware
 * Requires user to have at least one of the specified allowed roles.
 */
export function requireRoles(...allowedRoles: (UserRoleEnum | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // SuperAdmins always have access across all endpoints
    if (req.user.role === UserRoleEnum.SUPERADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' does not have sufficient permissions.`,
        },
      });
      return;
    }

    next();
  };
}
