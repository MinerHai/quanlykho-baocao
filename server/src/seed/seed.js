const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Helper to parse MongoDB Extended JSON ($oid and $date)
function parseMongoJson(obj) {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => parseMongoJson(item));
    }
    if (typeof obj === 'object') {
        if (obj.$oid) {
            return new mongoose.Types.ObjectId(obj.$oid);
        }
        if (obj.$date) {
            return new Date(obj.$date);
        }
        const newObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = parseMongoJson(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}

const modelsMap = [
    { file: 'ql-kho.categories.json', model: require('../models/category.model'), name: 'Danh mục' },
    { file: 'ql-kho.suppliers.json', model: require('../models/supplier.model'), name: 'Nhà cung cấp' },
    { file: 'ql-kho.users.json', model: require('../models/users.model'), name: 'Người dùng' },
    { file: 'ql-kho.products.json', model: require('../models/product.model'), name: 'Sản phẩm' },
    { file: 'ql-kho.apikeys.json', model: require('../models/apiKey.model'), name: 'API Key' },
    { file: 'ql-kho.exports.json', model: require('../models/export.model'), name: 'Phiếu xuất' },
    { file: 'ql-kho.imports.json', model: require('../models/import.model'), name: 'Phiếu nhập' },
    { file: 'ql-kho.messagechatbots.json', model: require('../models/messageChatbot.model'), name: 'Message Chatbot' },
    { file: 'ql-kho.otps.json', model: require('../models/otp.model'), name: 'OTP' }
];

async function seed() {
    try {
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ Kết nối MongoDB thành công');

        // 1. Xóa dữ liệu cũ của tất cả các collection
        console.log('🗑️  Đang xóa dữ liệu cũ...');
        for (const item of modelsMap) {
            await item.model.deleteMany({});
            console.log(`  - Đã xóa collection: ${item.model.modelName}`);
        }

        // 2. Import dữ liệu từ các file JSON
        console.log('📥  Đang import dữ liệu từ JSON...');
        const databaseDir = path.join(__dirname, '..', '..', '..', 'Database');

        for (const item of modelsMap) {
            const filePath = path.join(databaseDir, item.file);
            if (!fs.existsSync(filePath)) {
                console.log(`  ⚠️ Không tìm thấy file: ${item.file}, bỏ qua.`);
                continue;
            }

            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (!Array.isArray(rawData) || rawData.length === 0) {
                console.log(`  ℹ️ File ${item.file} rỗng hoặc không phải array, bỏ qua.`);
                continue;
            }

            const parsedData = parseMongoJson(rawData);
            await item.model.insertMany(parsedData);
            console.log(`  ✅ Đã import ${parsedData.length} ${item.name} từ ${item.file}`);
        }

        console.log('\n🎉 ĐÃ IMPORT TOÀN BỘ DỮ LIỆU THÀNH CÔNG!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi import dữ liệu:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
