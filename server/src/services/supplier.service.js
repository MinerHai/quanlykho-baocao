const modelSupplier = require('../models/supplier.model');
const { BadRequestError, ConflictRequestError, NotFoundError } = require('../core/error.response');

class SupplierService {
    async createSupplier(data) {
        const { name, phone, email, address, contactPerson, taxCode, note } = data;

        if (email) {
            const existing = await modelSupplier.findOne({ email });
            if (existing) {
                throw new ConflictRequestError('Email nhà cung cấp đã tồn tại');
            }
        }

        const supplier = await modelSupplier.create({
            name, phone, email, address, contactPerson, taxCode, note,
        });
        return supplier;
    }

    async getAllSuppliers(query = {}) {
        const { search, status, page = 1, limit = 20 } = query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [suppliers, total] = await Promise.all([
            modelSupplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            modelSupplier.countDocuments(filter),
        ]);

        return {
            suppliers,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        };
    }

    async getSupplierById(id) {
        const supplier = await modelSupplier.findById(id);
        if (!supplier) {
            throw new NotFoundError('Nhà cung cấp không tồn tại');
        }
        return supplier;
    }

    async updateSupplier(id, data) {
        const supplier = await modelSupplier.findById(id);
        if (!supplier) {
            throw new NotFoundError('Nhà cung cấp không tồn tại');
        }

        if (data.email && data.email !== supplier.email) {
            const existing = await modelSupplier.findOne({ email: data.email });
            if (existing) {
                throw new ConflictRequestError('Email nhà cung cấp đã tồn tại');
            }
        }

        Object.assign(supplier, data);
        await supplier.save();
        return supplier;
    }

    async deleteSupplier(id) {
        const supplier = await modelSupplier.findById(id);
        if (!supplier) {
            throw new NotFoundError('Nhà cung cấp không tồn tại');
        }

        const modelProduct = require('../models/product.model');
        const productCount = await modelProduct.countDocuments({ supplier: id });
        if (productCount > 0) {
            throw new BadRequestError(`Không thể xóa. Nhà cung cấp đang có ${productCount} sản phẩm`);
        }

        await supplier.deleteOne();
        return supplier;
    }

    /**
     * Các đơn nhập hàng giữa cửa hàng và 1 nhà cung cấp, kèm thống kê tổng hợp.
     * Tổng SL / tổng tiền chỉ tính phiếu đã hoàn thành (hàng đã thực sự vào kho).
     */
    async getSupplierOrders(id, query = {}) {
        const supplier = await modelSupplier.findById(id);
        if (!supplier) {
            throw new NotFoundError('Nhà cung cấp không tồn tại');
        }

        const modelImport = require('../models/import.model');
        const filter = { supplier: supplier._id };
        if (query.status) filter.status = query.status;

        const orders = await modelImport
            .find(filter)
            .populate('createdBy', 'fullName')
            .sort({ importDate: -1, createdAt: -1 })
            .lean();

        const completed = orders.filter((o) => o.status === 'completed');
        const effectiveDate = (o) => o.importDate || o.createdAt;
        const lastCompleted = completed.map(effectiveDate).sort((a, b) => new Date(b) - new Date(a))[0] || null;

        return {
            supplier,
            summary: {
                totalOrders: orders.length,
                completedOrders: completed.length,
                pendingOrders: orders.filter((o) => o.status === 'pending').length,
                cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
                totalQuantity: completed.reduce((s, o) => s + (o.totalItems || 0), 0),
                totalAmount: completed.reduce((s, o) => s + (o.totalAmount || 0), 0),
                lastImportDate: lastCompleted,
            },
            orders,
        };
    }

    async getAllSuppliersSimple() {
        return await modelSupplier.find({ status: 'active' }).select('_id name code').sort({ name: 1 });
    }
}

module.exports = new SupplierService();
