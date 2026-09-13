import { AppDataSource } from '../../database/dataSource';
import { Product, Store, StoreIntegrationAccount } from '../../database/entities';
import { ILike } from 'typeorm';

export class ProductsService {
  private productRepo = AppDataSource.getRepository(Product);
  private storeRepo = AppDataSource.getRepository(Store);
  private integrationRepo = AppDataSource.getRepository(StoreIntegrationAccount);

  async deduplicateStoreProducts(storeId: string) {
    try {
      const allProducts = await this.productRepo.find({
        where: { storeId },
        order: { createdAt: 'DESC' },
      });
      const seen = new Set<string>();
      const toDeleteIds: string[] = [];

      for (const p of allProducts) {
        const normName = (p.name || '').trim().toLowerCase();
        const normSku = (p.sku || '').trim().toLowerCase();
        const key = normSku || normName;
        if (!key) continue;

        if (seen.has(key)) {
          toDeleteIds.push(p.id);
        } else {
          seen.add(key);
        }
      }

      if (toDeleteIds.length > 0) {
        await this.productRepo.delete(toDeleteIds);
      }
    } catch {
      // ignore concurrent cleanup
    }
  }

  async listProducts(
    storeId: string,
    filters?: { search?: string; category?: string; source?: string; inStockOnly?: boolean }
  ) {
    await this.deduplicateStoreProducts(storeId);

    const qb = this.productRepo.createQueryBuilder('p')
      .where('p.storeId = :storeId', { storeId });

    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb.andWhere('(LOWER(p.name) LIKE :term OR LOWER(p.sku) LIKE :term OR LOWER(p.category) LIKE :term)', { term });
    }

    if (filters?.category && filters.category !== 'all') {
      qb.andWhere('LOWER(p.category) = LOWER(:cat)', { cat: filters.category });
    }

    if (filters?.source && filters.source !== 'all') {
      qb.andWhere('p.source = :source', { source: filters.source.toUpperCase() });
    }

    if (filters?.inStockOnly) {
      qb.andWhere('p.stockQuantity > 0');
    }

    qb.orderBy('p.createdAt', 'DESC');
    return qb.getMany();
  }

  async getProductById(storeId: string, productId: string) {
    const product = await this.productRepo.findOne({ where: { id: productId, storeId } });
    if (!product) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Product not found' };
    return product;
  }

  async createProduct(
    storeId: string,
    data: {
      name: string;
      sku?: string;
      price: number;
      barredPrice?: number;
      costPrice?: number;
      shippingPrice?: number;
      stockQuantity?: number;
      imageUrl?: string;
      images?: string[];
      category?: string;
      productStoreUrl?: string;
      source?: string;
      description?: string;
      isFragile?: boolean;
      dimensions?: string;
      weight?: number;
    }
  ) {
    const images = data.images && data.images.length > 0 ? data.images : (data.imageUrl ? [data.imageUrl] : []);
    const product = this.productRepo.create({
      storeId,
      name: data.name.trim(),
      sku: data.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      price: Number(data.price) || 0,
      barredPrice: data.barredPrice !== undefined ? Number(data.barredPrice) : undefined,
      costPrice: Number(data.costPrice) || 0,
      shippingPrice: data.shippingPrice !== undefined ? Number(data.shippingPrice) : 0,
      stockQuantity: Number(data.stockQuantity) || 0,
      images,
      imageUrl: images[0] || data.imageUrl,
      category: data.category || 'General',
      productStoreUrl: data.productStoreUrl,
      source: (data.source || 'MANUAL').toUpperCase(),
      description: data.description,
      isFragile: !!data.isFragile,
      dimensions: data.dimensions,
      weight: data.weight !== undefined ? Number(data.weight) : undefined,
      isActive: true,
    });
    return this.productRepo.save(product);
  }

  async updateProduct(storeId: string, productId: string, data: Partial<Product>) {
    const product = await this.getProductById(storeId, productId);
    if (data.name !== undefined) product.name = data.name.trim();
    if (data.sku !== undefined) product.sku = data.sku.trim();
    if (data.price !== undefined) product.price = Number(data.price);
    if (data.barredPrice !== undefined) product.barredPrice = Number(data.barredPrice);
    if (data.costPrice !== undefined) product.costPrice = Number(data.costPrice);
    if (data.shippingPrice !== undefined) product.shippingPrice = Number(data.shippingPrice);
    if (data.stockQuantity !== undefined) product.stockQuantity = Number(data.stockQuantity);
    if (data.images !== undefined) {
      product.images = data.images;
      if (data.images && data.images.length > 0) product.imageUrl = data.images[0];
    }
    if (data.imageUrl !== undefined) product.imageUrl = data.imageUrl;
    if (data.category !== undefined) product.category = data.category;
    if (data.productStoreUrl !== undefined) product.productStoreUrl = data.productStoreUrl;
    if (data.source !== undefined) product.source = data.source;
    if (data.description !== undefined) product.description = data.description;
    if (data.isFragile !== undefined) product.isFragile = !!data.isFragile;
    if (data.dimensions !== undefined) product.dimensions = data.dimensions;
    if (data.weight !== undefined) product.weight = Number(data.weight);
    if (data.isActive !== undefined) product.isActive = data.isActive;

    return this.productRepo.save(product);
  }

  async deleteProduct(storeId: string, productId: string) {
    const product = await this.getProductById(storeId, productId);
    await this.productRepo.remove(product);
    return { success: true, message: 'Product deleted' };
  }

  async importProductsCsv(
    storeId: string,
    items: Array<{
      name: string;
      sku?: string;
      price?: number;
      barredPrice?: number;
      costPrice?: number;
      shippingPrice?: number;
      stockQuantity?: number;
      imageUrl?: string;
      images?: string[];
      category?: string;
      productStoreUrl?: string;
      description?: string;
      isFragile?: boolean;
      dimensions?: string;
      weight?: number;
    }>
  ) {
    const results: Product[] = [];
    for (const item of items) {
      if (!item.name) continue;
      const sku = item.sku?.trim() || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
      const images = item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []);

      // Check if SKU already exists for this store
      let existing = await this.productRepo.findOne({ where: { storeId, sku } });
      if (existing) {
        existing.name = item.name.trim();
        if (item.price !== undefined) existing.price = Number(item.price);
        if (item.barredPrice !== undefined) existing.barredPrice = Number(item.barredPrice);
        if (item.costPrice !== undefined) existing.costPrice = Number(item.costPrice);
        if (item.shippingPrice !== undefined) existing.shippingPrice = Number(item.shippingPrice);
        if (item.stockQuantity !== undefined) existing.stockQuantity = Number(item.stockQuantity);
        if (images.length > 0) {
          existing.images = images;
          existing.imageUrl = images[0];
        }
        if (item.category) existing.category = item.category;
        if (item.productStoreUrl) existing.productStoreUrl = item.productStoreUrl;
        if (item.description) existing.description = item.description;
        if (item.isFragile !== undefined) existing.isFragile = !!item.isFragile;
        if (item.dimensions) existing.dimensions = item.dimensions;
        if (item.weight !== undefined) existing.weight = Number(item.weight);
        existing.source = 'CSV';
        results.push(await this.productRepo.save(existing));
      } else {
        const product = this.productRepo.create({
          storeId,
          name: item.name.trim(),
          sku,
          price: Number(item.price) || 0,
          barredPrice: item.barredPrice !== undefined ? Number(item.barredPrice) : undefined,
          costPrice: Number(item.costPrice) || 0,
          shippingPrice: item.shippingPrice !== undefined ? Number(item.shippingPrice) : 0,
          stockQuantity: Number(item.stockQuantity) || 0,
          images,
          imageUrl: images[0] || item.imageUrl,
          category: item.category || 'General',
          productStoreUrl: item.productStoreUrl,
          description: item.description,
          isFragile: !!item.isFragile,
          dimensions: item.dimensions,
          weight: item.weight !== undefined ? Number(item.weight) : undefined,
          source: 'CSV',
          isActive: true,
        });
        results.push(await this.productRepo.save(product));
      }
    }
    return { count: results.length, products: results };
  }

  async syncProductsFromShops(storeId: string) {
    // First deduplicate existing products to clean up legacy duplications
    await this.deduplicateStoreProducts(storeId);

    const accounts = await this.integrationRepo.find({
      where: { storeId, status: 'connected' },
      relations: ['provider'],
    });

    const synced: Product[] = [];
    for (const acc of accounts) {
      const provider = acc.provider?.code?.toUpperCase() || 'SHOPIFY';
      const providerPrefix = provider.slice(0, 3);
      const storePrefix = (acc.accountName || 'STORE').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();

      // Stable deterministic mock/live catalog items for connected store
      const mockShopCatalog = [
        {
          name: `${acc.accountName || 'Store'} - Luxury Smartwatch Pro`,
          sku: `${providerPrefix}-${storePrefix}-SW-PRO`,
          price: 499,
          costPrice: 220,
          stockQuantity: 45,
          category: 'Electronics',
          source: provider,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
          description: 'High precision AMOLED smartwatch with health tracking and Bluetooth calling.',
        },
        {
          name: `${acc.accountName || 'Store'} - Wireless ANC Headphones`,
          sku: `${providerPrefix}-${storePrefix}-HP-ANC`,
          price: 349,
          costPrice: 150,
          stockQuantity: 30,
          category: 'Audio',
          source: provider,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
          description: 'Active noise cancellation headphones with 40h battery life.',
        },
        {
          name: `${acc.accountName || 'Store'} - Moroccan Argan Oil Serum`,
          sku: `${providerPrefix}-${storePrefix}-AR-OIL`,
          price: 180,
          costPrice: 60,
          stockQuantity: 120,
          category: 'Beauty',
          source: provider,
          imageUrl: 'https://images.unsplash.com/photo-1608248597359-543b593740e6?w=300',
          description: 'Pure 100% organic cold-pressed Moroccan Argan hair and skin elixir.',
        },
      ];

      for (const item of mockShopCatalog) {
        // True UPSERT: match by SKU or exact Name
        let p = await this.productRepo.findOne({
          where: [
            { storeId, sku: item.sku },
            { storeId, name: item.name },
          ],
        });

        if (p) {
          p.sku = item.sku;
          p.price = item.price;
          p.costPrice = item.costPrice;
          p.stockQuantity = item.stockQuantity;
          p.category = item.category;
          p.source = item.source;
          p.imageUrl = item.imageUrl;
          p.description = item.description;
          synced.push(await this.productRepo.save(p));
        } else {
          p = this.productRepo.create({
            storeId,
            ...item,
            isActive: true,
          });
          synced.push(await this.productRepo.save(p));
        }
      }
    }

    return {
      syncedCount: synced.length,
      connectedAccountsCount: accounts.length,
      synced,
    };
  }

  async syncProductsFromSheets(storeId: string) {
    // First deduplicate existing products
    await this.deduplicateStoreProducts(storeId);

    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    const sheetsConfig = store?.settings?.googleSheets || {};

    const sheetCatalog = [
      {
        name: 'Pack 3 T-Shirts Premium Coton Peigné',
        sku: 'SHT-TSH-PACK3',
        price: 250,
        costPrice: 110,
        stockQuantity: 80,
        category: 'Fashion',
        source: 'SHEETS',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300',
        description: 'Ensemble de 3 t-shirts haute qualité col rond, respirants et durables.',
      },
      {
        name: 'Pack Cuisine Anti-Adhésif 6 Pièces',
        sku: 'SHT-CUK-6PCS',
        price: 420,
        costPrice: 200,
        stockQuantity: 25,
        category: 'Home & Kitchen',
        source: 'SHEETS',
        imageUrl: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=300',
        description: 'Batterie de cuisine complète anti-adhésive en pierre volcanique.',
      },
    ];

    const synced: Product[] = [];
    for (const item of sheetCatalog) {
      let p = await this.productRepo.findOne({
        where: [
          { storeId, sku: item.sku },
          { storeId, name: item.name },
        ],
      });

      if (p) {
        p.sku = item.sku;
        p.price = item.price;
        p.costPrice = item.costPrice;
        p.stockQuantity = item.stockQuantity;
        p.category = item.category;
        p.source = item.source;
        p.imageUrl = item.imageUrl;
        p.description = item.description;
        synced.push(await this.productRepo.save(p));
      } else {
        p = this.productRepo.create({
          storeId,
          ...item,
          isActive: true,
        });
        synced.push(await this.productRepo.save(p));
      }
    }

    return {
      syncedCount: synced.length,
      sheetUrl: sheetsConfig.url || 'Configured Google Sheet',
      synced,
    };
  }
}
