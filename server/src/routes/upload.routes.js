const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const { authUser } = require('../auth/checkAuth');
const modelImage = require('../models/image.model');

// Mặc định lưu ảnh vào MongoDB. Đặt IMAGE_STORAGE=cloudinary để dùng lại Cloudinary.
const USE_CLOUDINARY = (process.env.IMAGE_STORAGE || 'mongo').toLowerCase() === 'cloudinary';
const cloudinary = USE_CLOUDINARY ? require('../config/cloudinary') : null;

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ được upload file ảnh'), false);
        }
    },
});

// URL tuyệt đối để <img> hoạt động dù client và server khác cổng
const buildImageUrl = (req, id) => {
    const base = process.env.PUBLIC_SERVER_URL || `${req.protocol}://${req.get('host')}`;
    return `${base}/api/upload/image/${id}`;
};

const saveToMongo = async (req, file, folder) => {
    const doc = await modelImage.create({
        data: file.buffer,
        contentType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        folder,
        createdBy: req.user?.id,
    });
    return { url: buildImageUrl(req, doc._id), publicId: String(doc._id) };
};

const saveToCloudinary = (file, folder) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id });
            },
        );
        stream.end(file.buffer);
    });

const saveImage = (req, file, folder) => (USE_CLOUDINARY ? saveToCloudinary(file, folder) : saveToMongo(req, file, folder));

// Xem ảnh (public, cache dài vì ảnh không đổi theo id)
router.get('/image/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Ảnh không tồn tại' });
        }
        const doc = await modelImage.findById(req.params.id).select('data contentType');
        if (!doc) {
            return res.status(404).json({ message: 'Ảnh không tồn tại' });
        }
        res.set({
            'Content-Type': doc.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            // Cho phép <img> ở origin khác (client :5173) hiển thị ảnh từ server :3000
            'Cross-Origin-Resource-Policy': 'cross-origin',
        });
        return res.send(doc.data);
    } catch (error) {
        return res.status(500).json({ message: 'Không đọc được ảnh', error: error.message });
    }
});

// Upload 1 ảnh
router.post('/single', authUser, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
        }

        const folder = req.body.folder || 'ql-kho/products';
        const result = await saveImage(req, req.file, folder);

        res.status(200).json({
            status: 200,
            message: 'Upload ảnh thành công',
            metadata: result,
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload ảnh thất bại', error: error.message });
    }
});

// Upload nhiều ảnh
router.post('/multiple', authUser, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
        }

        const folder = req.body.folder || 'ql-kho/products';
        const results = await Promise.all(req.files.map((file) => saveImage(req, file, folder)));

        res.status(200).json({
            status: 200,
            message: 'Upload ảnh thành công',
            metadata: results,
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload ảnh thất bại', error: error.message });
    }
});

module.exports = router;
