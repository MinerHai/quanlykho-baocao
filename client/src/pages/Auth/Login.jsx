import { useState } from 'react';
import logoImg from '../../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Divider, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        setPending(false);
        try {
            await login(values.email, values.password);
            toast.success('Đăng nhập thành công!');
            navigate('/dashboard');
        } catch (error) {
            if (error.response?.data?.code === 'ACCOUNT_PENDING') {
                setPending(true);
            } else {
                toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img
                        src={logoImg}
                        alt="Hải Hương"
                        style={{ height: 90, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                    />
                    <h1>Hải Hương</h1>
                    <p>Hệ thống quản lý kho — Đăng nhập để tiếp tục</p>
                </div>

                {pending && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="Tài khoản đang chờ xét duyệt"
                        description="Quản trị viên chưa duyệt tài khoản của bạn. Vui lòng đợi được duyệt rồi đăng nhập lại."
                    />
                )}

                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
                    </Form.Item>

                    <div className="flex justify-end mb-4">
                        <Link
                            to="/forgot-password"
                            className="text-sm hover:opacity-80"
                            style={{ color: '#49c9f4' }}
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: 46,
                                fontSize: 15,
                                fontWeight: 600,
                                borderRadius: 10,
                            }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>

                <Divider plain style={{ color: '#49c9f4', fontSize: 13 }}>
                    hoặc
                </Divider>

                <p className="text-center text-sm" style={{ color: '#64748B' }}>
                    Chưa có tài khoản?{' '}
                    <Link to="/register" style={{ color: '#f79707', fontWeight: 600 }}>
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
