import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service';

const productsService = new ProductsService();

export class ProductsController {
  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.params;
      const { search, category, source, inStockOnly } = req.query;
      const products = await productsService.listProducts(storeId, {
        search: search as string,
        category: category as string,
        source: source as string,
        inStockOnly: inStockOnly === 'true',
      });
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, productId } = req.params;
      const product = await productsService.getProductById(storeId, productId);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.params;
      const product = await productsService.createProduct(storeId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, productId } = req.params;
      const product = await productsService.updateProduct(storeId, productId, req.body);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, productId } = req.params;
      const result = await productsService.deleteProduct(storeId, productId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async importCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.params;
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Array of product items required' });
        return;
      }
      const result = await productsService.importProductsCsv(storeId, items);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async syncShops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.params;
      const result = await productsService.syncProductsFromShops(storeId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async syncSheets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.params;
      const result = await productsService.syncProductsFromSheets(storeId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
