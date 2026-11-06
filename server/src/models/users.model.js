const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelUser = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        birthDay: { type: Date, default: null },
        role: {
            type: String,
            enum: ['admin', 'manager', 'staff'],
            default: 'staff',
        },
        isLocked: { type: Boolean, default: false },
        // false = đăng ký mới, đang chờ admin duyệt. Tài khoản cũ (không có field) coi như đã duyệt.
        isApproved: { type: Boolean, default: true },
        approvedAt: { type: Date, default: null },
        typeLogin: { type: String, enum: ['email', 'google'], default: 'email' },
        avatar: { type: String, default: '' },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('user', modelUser);
