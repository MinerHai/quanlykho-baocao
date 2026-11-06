const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Ảnh lưu trực tiếp trong MongoDB (thay cho Cloudinary).
 * Giới hạn 5MB/ảnh ở tầng upload nên nằm trong giới hạn 16MB của 1 document.
 */
const imageSchema = new Schema(
    {
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
        size: { type: Number, default: 0 },
        originalName: { type: String, default: '' },
        folder: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
    },
    { timestamps: true },
);

module.exports = mongoose.model('image', imageSchema);
