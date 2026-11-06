import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Select,
    InputNumber,
    Input,
    Space,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
    Popconfirm,
    Descriptions,
    Divider,
    message,
    DatePicker,
    Tooltip,
    Dropdown,
} from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ImportOutlined,
    DeleteOutlined,
    SearchOutlined,
    FileTextOutlined,
    DownloadOutlined,
    PrinterOutlined,
} from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { createWorkbook, addTableSheet, downloadWorkbook, exportInvoiceExcel, printInvoice, IMPORT_STATUS } from '../../utils/excelExport';

const { Option } = Select;
const { TextArea } = Input;

const ImportList = () => {
    const [imports, setImports] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedImport, setSelectedImport] = useState(null);
    const [stats, setStats] = useState({});
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [exportMonth, setExportMonth] = useState(null);
    const [exporting, setExporting] = useState(false);
    // Lưu thông tin SP đã chọn theo field index để hiển thị tồn kho
    const [selectedProductsMap, setSelectedProductsMap] = useState({});
    const [form] = Form.useForm();
    const { user } = useAuth();
    const isStaff = user?.role === 'staff';

    const fetchImports = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const params = { page, limit: pagination.pageSize };
                if (searchText) params.search = searchText;
                if (filterStatus) params.status = filterStatus;
                if (filterSupplier) params.supplier = filterSupplier;
                const res = await axiosClient.get('/imports', { params });
                setImports(res.metadata.imports);
                setPagination((prev) => ({ ...prev, current: page, total: res.metadata.total }));
            } catch (error) {
                message.error('Lỗi khi tải danh sách phiếu nhập');
            } finally {
                setLoading(false);
            }
        },
        [searchText, filterStatus, filterSupplier, pagination.pageSize],
    );

    const fetchDropdownData = async () => {
        try {
            const [supRes, prodRes, statsRes] = await Promise.all([
                axiosClient.get('/suppliers/simple'),
                axiosClient.get('/products', { params: { limit: 500 } }),
                axiosClient.get('/imports/stats'),
            ]);
            setSuppliers(supRes.metadata);
            setProducts(prodRes.metadata.products || prodRes.metadata);
            setStats(statsRes.metadata);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    useEffect(() => {
        fetchDropdownData();
    }, []);
    useEffect(() => {
        fetchImports(1);
    }, [searchText, filterStatus, filterSupplier]);

    // Xuất Excel theo tháng
    const handleExportExcel = async () => {
        if (!exportMonth) {
            message.warning('Vui lòng chọn tháng cần xuất');
            return;
        }
        setExporting(true);
        try {
            const year = exportMonth.year();
            const month = exportMonth.month(); // 0-indexed
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
            const res = await axiosClient.get('/imports', {
                params: { startDate, endDate, limit: 10000, page: 1 },
            });
            const data = res.metadata.imports || [];
            if (data.length === 0) {
                message.info('Không có phiếu nhập nào trong tháng này');
                return;
            }

            const notCancelled = (r) => r.rawStatus !== 'cancelled';
            const wb = await createWorkbook();
            const periodText = `Tháng ${month + 1}/${year}`;

            addTableSheet(wb, {
                name: 'Danh sách phiếu nhập',
                title: 'Báo cáo phiếu nhập kho',
                subtitle: `${periodText} — ${data.length} phiếu (tổng cộng không tính phiếu đã hủy)`,
                columns: [
                    { header: 'STT', key: 'stt', width: 6, type: 'center' },
                    { header: 'Mã phiếu', key: 'code', width: 14 },
                    { header: 'Nhà cung cấp', key: 'supplier', width: 26 },
                    { header: 'Số SP', key: 'products', width: 9, type: 'int' },
                    { header: 'Tổng SL', key: 'qty', width: 11, type: 'int' },
                    { header: 'Tổng tiền (VNĐ)', key: 'amount', width: 18, type: 'money' },
                    { header: 'Trạng thái', key: 'status', width: 13, type: 'center' },
                    { header: 'Người tạo', key: 'creator', width: 18 },
                    { header: 'Ngày giờ nhập', key: 'date', width: 18, type: 'datetime' },
                    { header: 'Ghi chú', key: 'note', width: 28 },
                ],
                rows: data.map((imp, idx) => ({
                    stt: idx + 1,
                    code: imp.code,
                    supplier: imp.supplier?.name || '',
                    products: imp.items?.length || 0,
                    qty: imp.totalItems || 0,
                    amount: imp.totalAmount || 0,
                    status: IMPORT_STATUS[imp.status] || imp.status,
                    rawStatus: imp.status,
                    creator: imp.createdBy?.fullName || '',
                    date: new Date(imp.importDate || imp.createdAt),
                    note: imp.note || '',
                })),
                totals: { label: 'TỔNG CỘNG', keys: ['products', 'qty', 'amount'], include: notCancelled },
            });

            const detailRows = [];
            data.forEach((imp) => {
                (imp.items || []).forEach((item) => {
                    detailRows.push({
                        code: imp.code,
                        date: new Date(imp.importDate || imp.createdAt),
                        supplier: imp.supplier?.name || '',
                        sku: item.sku,
                        name: item.productName,
                        quantity: item.quantity,
                        price: item.importPrice,
                        total: item.totalPrice,
                        status: IMPORT_STATUS[imp.status] || imp.status,
                        rawStatus: imp.status,
                    });
                });
            });
            addTableSheet(wb, {
                name: 'Chi tiết sản phẩm',
                title: 'Chi tiết sản phẩm nhập kho',
                subtitle: `${periodText} — ${detailRows.length} dòng`,
                columns: [
                    { header: 'Mã phiếu', key: 'code', width: 14 },
                    { header: 'Ngày giờ nhập', key: 'date', width: 18, type: 'datetime' },
                    { header: 'Nhà cung cấp', key: 'supplier', width: 24 },
                    { header: 'Mã SP', key: 'sku', width: 12 },
                    { header: 'Tên sản phẩm', key: 'name', width: 34 },
                    { header: 'Số lượng', key: 'quantity', width: 11, type: 'int' },
                    { header: 'Đơn giá nhập (VNĐ)', key: 'price', width: 18, type: 'money' },
                    { header: 'Thành tiền (VNĐ)', key: 'total', width: 18, type: 'money' },
                    { header: 'Trạng thái phiếu', key: 'status', width: 16, type: 'center' },
                ],
                rows: detailRows,
                totals: { label: 'TỔNG CỘNG', keys: ['quantity', 'total'], include: notCancelled },
            });

            const monthStr = `${String(month + 1).padStart(2, '0')}-${year}`;
            await downloadWorkbook(wb, `Nhap_Kho_Thang_${monthStr}.xlsx`);
            message.success(`Đã xuất Excel tháng ${month + 1}/${year} (${data.length} phiếu)`);
        } catch (e) {
            message.error('Xuất Excel thất bại');
        } finally {
            setExporting(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

    const formatDate = (date) =>
        new Date(date).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const statusConfig = {
        draft: { color: 'default', text: 'Nháp' },
        pending: { color: 'orange', text: 'Chờ duyệt' },
        completed: { color: 'green', text: 'Đã nhập' },
        cancelled: { color: 'red', text: 'Đã hủy' },
    };

    // Tạo phiếu nhập
    const handleSubmit = async (values) => {
        if (!values.items || values.items.length === 0) {
            message.warning('Vui lòng thêm ít nhất 1 sản phẩm');
            return;
        }
        setSubmitting(true);
        try {
            // Gom nhóm item trùng sản phẩm: cộng dồn số lượng, lấy giá nhập mới nhất
            const mergedMap = {};
            for (const item of values.items) {
                if (!item?.product) continue;
                if (!mergedMap[item.product]) {
                    mergedMap[item.product] = { product: item.product, quantity: 0, importPrice: item.importPrice };
                }
                mergedMap[item.product].quantity += item.quantity || 0;
                mergedMap[item.product].importPrice = item.importPrice;
            }
            const mergedItems = Object.values(mergedMap);

            await axiosClient.post('/imports', {
                supplier: values.supplier,
                items: mergedItems,
                note: values.note || '',
                status: values.status || 'pending',
                importDate: values.importDate ? values.importDate.format('YYYY-MM-DDTHH:mm:ss') : null,
            });
            message.success('Tạo phiếu nhập thành công');
            setModalOpen(false);
            form.resetFields();
            fetchImports(pagination.current);
            fetchDropdownData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Tạo phiếu nhập thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    // Duyệt phiếu
    const handleApprove = async (id) => {
        try {
            await axiosClient.patch(`/imports/${id}/approve`);
            message.success('Duyệt phiếu nhập thành công — đã cộng tồn kho');
            fetchImports(pagination.current);
            fetchDropdownData();
            if (detailOpen) {
                const res = await axiosClient.get(`/imports/${id}`);
                setSelectedImport(res.metadata);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Duyệt thất bại');
        }
    };

    // Hủy phiếu
    const handleCancel = async (id) => {
        try {
            await axiosClient.patch(`/imports/${id}/cancel`);
            message.success('Đã hủy phiếu nhập');
            fetchImports(pagination.current);
            fetchDropdownData();
            if (detailOpen) {
                const res = await axiosClient.get(`/imports/${id}`);
                setSelectedImport(res.metadata);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Hủy thất bại');
        }
    };

    // Xuất hóa đơn / phiếu nhập: lấy bản đầy đủ (có địa chỉ, SĐT NCC) rồi in hoặc tải Excel
    const handleInvoice = async (record, mode) => {
        try {
            const res = await axiosClient.get(`/imports/${record._id}`);
            if (mode === 'excel') {
                await exportInvoiceExcel('import', res.metadata);
                message.success(`Đã xuất hóa đơn ${record.code}`);
            } else {
                printInvoice('import', res.metadata);
            }
        } catch (error) {
            message.error('Xuất hóa đơn thất bại');
        }
    };

    const invoiceMenu = (record) => ({
        items: [
            { key: 'print', label: 'In / Lưu PDF', icon: <PrinterOutlined /> },
            { key: 'excel', label: 'Tải file Excel', icon: <DownloadOutlined /> },
        ],
        onClick: ({ key }) => handleInvoice(record, key),
    });

    // Xem chi tiết
    const handleView = async (record) => {
        try {
            const res = await axiosClient.get(`/imports/${record._id}`);
            setSelectedImport(res.metadata);
            setDetailOpen(true);
        } catch (error) {
            message.error('Lỗi khi tải chi tiết');
        }
    };

    // Khi chọn SP trong form → auto fill giá nhập + cảnh báo trùng
    const handleProductSelect = (value, fieldName) => {
        const product = products.find((p) => p._id === value);
        if (product) {
            const items = form.getFieldValue('items') || [];
            items[fieldName] = { ...items[fieldName], importPrice: product.importPrice, product: value };
            form.setFieldsValue({ items });
            setSelectedProductsMap((prev) => ({ ...prev, [fieldName]: product }));

            // Kiểm tra có dòng khác cùng sản phẩm không
            const duplicateCount = items.filter((it, idx) => idx !== fieldName && it?.product === value).length;
            if (duplicateCount > 0) {
                message.warning(
                    `Sản phẩm “${product.name}” đã có trong phiếu! → Số lượng sẽ được cộng gộp khi lưu.`,
                    4,
                );
            }
        }
    };

    // Reset map khi đóng modal
    const handleCloseModal = () => {
        setModalOpen(false);
        form.resetFields();
        setSelectedProductsMap({});
    };

    const columns = [
        {
            title: 'Mã phiếu',
            dataIndex: 'code',
            key: 'code',
            width: 110,
            render: (code) => <span style={{ fontWeight: 600, color: '#4F46E5' }}>{code}</span>,
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: ['supplier', 'name'],
            key: 'supplier',
            ellipsis: true,
            width: 110,
        },
        {
            title: 'Số SP',
            dataIndex: 'items',
            key: 'itemCount',
            width: 75,
            align: 'center',
            render: (items) => items?.length || 0,
        },
        {
            title: 'Tổng SL',
            dataIndex: 'totalItems',
            key: 'totalItems',
            width: 80,
            align: 'center',
            render: (v) => <span className="font-semibold">{v}</span>,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 140,
            align: 'right',
            render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            align: 'center',
            render: (s) => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.text}</Tag>,
        },
        {
            title: 'Ngày nhập',
            dataIndex: 'importDate',
            key: 'importDate',
            width: 120,
            render: (d, r) => {
                const date = d || r.createdAt;
                return (
                    <span style={{ fontSize: 13, color: '#64748B' }}>{new Date(date).toLocaleDateString('vi-VN')}</span>
                );
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) => formatDate(date),
            responsive: ['lg'],
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 170,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        style={{ color: '#06B6D4' }}
                    />
                    <Tooltip title="Xuất hóa đơn">
                        <Dropdown menu={invoiceMenu(record)} trigger={['click']}>
                            <Button type="text" icon={<PrinterOutlined />} style={{ color: '#4F46E5' }} />
                        </Dropdown>
                    </Tooltip>
                    {record.status === 'pending' && !isStaff && (
                        <>
                            <Popconfirm
                                title="Duyệt phiếu nhập?"
                                description="Tồn kho sẽ được cộng thêm"
                                onConfirm={() => handleApprove(record._id)}
                                okText="Duyệt"
                                cancelText="Hủy"
                            >
                                <Button type="text" icon={<CheckCircleOutlined />} style={{ color: '#10B981' }} />
                            </Popconfirm>
                            <Popconfirm
                                title="Hủy phiếu nhập?"
                                onConfirm={() => handleCancel(record._id)}
                                okText="Hủy phiếu"
                                cancelText="Không"
                                okButtonProps={{ danger: true }}
                            >
                                <Button type="text" icon={<CloseCircleOutlined />} danger />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý nhập kho</h2>
                <p>Tạo và quản lý phiếu nhập kho hàng hóa</p>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Tổng phiếu</span>}
                            value={stats.total || 0}
                            prefix={<FileTextOutlined style={{ color: '#4F46E5' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Chờ duyệt</span>}
                            value={stats.pending || 0}
                            prefix={<ImportOutlined style={{ color: '#F59E0B' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Đã nhập</span>}
                            value={stats.completed || 0}
                            prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Tổng giá trị nhập</span>}
                            value={stats.totalValue || 0}
                            formatter={(val) => formatCurrency(val)}
                            valueStyle={{ fontSize: 16, fontWeight: 700, color: '#4F46E5' }}
                        />
                    </div>
                </Col>
            </Row>

            <Card>
                {/* Toolbar */}
                <div className="flex justify-between items-center flex-wrap gap-2" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Danh sách phiếu nhập</h3>
                    <Space wrap>
                        <DatePicker
                            picker="month"
                            placeholder="Chọn tháng xuất Excel"
                            value={exportMonth}
                            onChange={setExportMonth}
                            format="MM/YYYY"
                            style={{ width: 180 }}
                        />
                        <Tooltip title="Xuất Excel tất cả phiếu nhập trong tháng đã chọn">
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExportExcel}
                                loading={exporting}
                                style={{ borderColor: '#10B981', color: '#10B981' }}
                            >
                                Xuất Excel
                            </Button>
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                form.resetFields();
                                setModalOpen(true);
                            }}
                        >
                            Tạo phiếu nhập
                        </Button>
                    </Space>
                </div>

                {/* Filters */}
                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Tìm mã phiếu..."
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Select
                            placeholder="Nhà cung cấp"
                            value={filterSupplier || undefined}
                            onChange={(v) => setFilterSupplier(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {suppliers.map((s) => (
                                <Option key={s._id} value={s._id}>
                                    {s.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Select
                            placeholder="Trạng thái"
                            value={filterStatus || undefined}
                            onChange={(v) => setFilterStatus(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="pending">Chờ duyệt</Option>
                            <Option value="completed">Đã nhập</Option>
                            <Option value="cancelled">Đã hủy</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={imports}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} phiếu`,
                        onChange: (page) => fetchImports(page),
                    }}
                    locale={{ emptyText: 'Chưa có phiếu nhập nào' }}
                    scroll={{ x: 900 }}
                />
            </Card>

            {/* Modal Tạo phiếu nhập */}
            <Modal
                title="Tạo phiếu nhập kho"
                open={modalOpen}
                onCancel={handleCloseModal}
                footer={null}
                destroyOnClose
                width={860}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="mt-2">
                    <Row gutter={16}>
                        <Col span={10}>
                            <Form.Item
                                name="supplier"
                                label="Nhà cung cấp"
                                rules={[{ required: true, message: 'Chọn NCC' }]}
                            >
                                <Select placeholder="Chọn nhà cung cấp" showSearch optionFilterProp="children">
                                    {suppliers.map((s) => (
                                        <Option key={s._id} value={s._id}>
                                            {s.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={isStaff ? 14 : 7}>
                            <Form.Item name="importDate" label="Ngày & giờ nhập kho">
                                <DatePicker
                                    style={{ width: '100%' }}
                                    showTime={{ format: 'HH:mm' }}
                                    format="DD/MM/YYYY HH:mm"
                                    placeholder="Chọn ngày & giờ nhập"
                                    disabledDate={(d) => d && d.valueOf() > Date.now()}
                                />
                            </Form.Item>
                        </Col>
                        {!isStaff && (
                            <Col span={7}>
                                <Form.Item name="status" label="Trạng thái" initialValue="pending">
                                    <Select>
                                        <Option value="pending">Chờ duyệt</Option>
                                        <Option value="completed">Nhập kho ngay</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        )}
                        {/* Ẩn với staff: mặc định pending */}
                        {isStaff && (
                            <Form.Item name="status" initialValue="pending" hidden>
                                <Input />
                            </Form.Item>
                        )}
                    </Row>

                    <Divider orientation="left" style={{ fontSize: 13, color: '#64748B' }}>
                        Danh sách sản phẩm nhập
                    </Divider>

                    <Form.List
                        name="items"
                        rules={[
                            {
                                validator: async (_, items) => {
                                    if (!items || items.length < 1) throw new Error('Thêm ít nhất 1 sản phẩm');
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.length > 0 && (
                                    <Row
                                        gutter={12}
                                        style={{ marginBottom: 8, fontSize: 12, color: '#64748B', fontWeight: 600 }}
                                    >
                                        <Col span={9}>Sản phẩm</Col>
                                        <Col span={4}>Tồn kho</Col>
                                        <Col span={4}>Số lượng</Col>
                                        <Col span={5}>Giá nhập (VNĐ)</Col>
                                        <Col span={2}></Col>
                                    </Row>
                                )}
                                {fields.map(({ key, name, ...restField }) => {
                                    const selProd = selectedProductsMap[name];
                                    const stock = selProd?.quantity ?? null;
                                    const stockColor =
                                        stock === null
                                            ? '#94A3B8'
                                            : stock === 0
                                              ? '#EF4444'
                                              : stock <= (selProd?.minStock || 10)
                                                ? '#F59E0B'
                                                : '#10B981';
                                    return (
                                        <Row gutter={12} key={key} align="middle" style={{ marginBottom: 10 }}>
                                            <Col span={9}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'product']}
                                                    noStyle
                                                    rules={[{ required: true, message: 'Chọn SP' }]}
                                                >
                                                    <Select
                                                        placeholder="Chọn sản phẩm"
                                                        showSearch
                                                        filterOption={(input, option) =>
                                                            option?.children
                                                                ?.join('')
                                                                .toLowerCase()
                                                                .includes(input.toLowerCase())
                                                        }
                                                        onChange={(val) => handleProductSelect(val, name)}
                                                        style={{ width: '100%' }}
                                                    >
                                                        {products.map((p) => (
                                                            <Option key={p._id} value={p._id}>
                                                                {p.sku} - {p.name}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                {stock !== null ? (
                                                    <div
                                                        style={{
                                                            background: stockColor + '18',
                                                            border: `1px solid ${stockColor}40`,
                                                            borderRadius: 6,
                                                            padding: '4px 8px',
                                                            textAlign: 'center',
                                                            fontWeight: 700,
                                                            color: stockColor,
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        {stock === 0 ? 'Hết hàng' : stock}
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{ color: '#CBD5E1', textAlign: 'center', fontSize: 12 }}
                                                    >
                                                        —
                                                    </div>
                                                )}
                                            </Col>
                                            <Col span={4}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'quantity']}
                                                    noStyle
                                                    rules={[{ required: true, message: 'Nhập SL' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} min={1} placeholder="SL" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'importPrice']}
                                                    noStyle
                                                    rules={[{ required: true, message: 'Nhập giá' }]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        min={0}
                                                        placeholder="Giá nhập"
                                                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={(v) => v.replace(/,/g, '')}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                                <DeleteOutlined
                                                    onClick={() => {
                                                        remove(name);
                                                        setSelectedProductsMap((prev) => {
                                                            const next = { ...prev };
                                                            delete next[name];
                                                            return next;
                                                        });
                                                    }}
                                                    style={{ color: '#EF4444', fontSize: 16, cursor: 'pointer' }}
                                                />
                                            </Col>
                                        </Row>
                                    );
                                })}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    icon={<PlusOutlined />}
                                    block
                                    style={{ marginTop: 4 }}
                                >
                                    Thêm sản phẩm
                                </Button>
                                <Form.ErrorList errors={errors} />
                            </>
                        )}
                    </Form.List>

                    <Form.Item name="note" label="Ghi chú" style={{ marginTop: 16 }}>
                        <TextArea rows={2} placeholder="Ghi chú phiếu nhập..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                        <Button onClick={handleCloseModal}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Tạo phiếu nhập
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Modal Chi tiết phiếu nhập */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        Chi tiết phiếu nhập
                        {selectedImport && (
                            <Tag color={statusConfig[selectedImport.status]?.color}>
                                {statusConfig[selectedImport.status]?.text}
                            </Tag>
                        )}
                    </div>
                }
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={
                    <Space>
                        {selectedImport?.status === 'pending' && !isStaff && (
                            <>
                                <Popconfirm
                                    title="Duyệt phiếu nhập?"
                                    description="Tồn kho sẽ được cộng thêm"
                                    onConfirm={() => handleApprove(selectedImport._id)}
                                    okText="Duyệt"
                                    cancelText="Hủy"
                                >
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        style={{ background: '#10B981', borderColor: '#10B981' }}
                                    >
                                        Duyệt phiếu
                                    </Button>
                                </Popconfirm>
                                <Popconfirm
                                    title="Hủy phiếu nhập?"
                                    onConfirm={() => handleCancel(selectedImport._id)}
                                    okText="Hủy phiếu"
                                    cancelText="Không"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button danger>Hủy phiếu</Button>
                                </Popconfirm>
                            </>
                        )}
                        {selectedImport && (
                            <Dropdown menu={invoiceMenu(selectedImport)} trigger={['click']}>
                                <Button icon={<PrinterOutlined />}>Xuất hóa đơn</Button>
                            </Dropdown>
                        )}
                        <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
                    </Space>
                }
                width={780}
            >
                {selectedImport && (
                    <div className="mt-4">
                        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Mã phiếu">
                                <span style={{ fontWeight: 600, color: '#4F46E5' }}>{selectedImport.code}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày nhập kho">
                                <strong style={{ color: '#4F46E5' }}>
                                    {selectedImport.importDate
                                        ? new Date(selectedImport.importDate).toLocaleDateString('vi-VN')
                                        : new Date(selectedImport.createdAt).toLocaleDateString('vi-VN')}
                                </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {formatDate(selectedImport.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Nhà cung cấp">
                                {selectedImport.supplier?.name || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Người tạo">
                                {selectedImport.createdBy?.fullName || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng số lượng">
                                <span className="font-semibold">{selectedImport.totalItems}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền">
                                <span className="font-semibold" style={{ color: '#4F46E5', fontSize: 15 }}>
                                    {formatCurrency(selectedImport.totalAmount)}
                                </span>
                            </Descriptions.Item>
                            {selectedImport.note && (
                                <Descriptions.Item label="Ghi chú" span={2}>
                                    {selectedImport.note}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        <Divider orientation="left" style={{ fontSize: 13 }}>
                            Chi tiết sản phẩm ({selectedImport.items?.length || 0})
                        </Divider>
                        <Table
                            dataSource={selectedImport.items}
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            columns={[
                                {
                                    title: 'Mã SP',
                                    dataIndex: 'sku',
                                    width: 90,
                                    render: (sku) => <span style={{ color: '#4F46E5', fontWeight: 600 }}>{sku}</span>,
                                },
                                { title: 'Tên sản phẩm', dataIndex: 'productName', ellipsis: true },
                                {
                                    title: 'Số lượng',
                                    dataIndex: 'quantity',
                                    width: 80,
                                    align: 'center',
                                    render: (v) => <span className="font-semibold">{v}</span>,
                                },
                                {
                                    title: 'Đơn giá nhập',
                                    dataIndex: 'importPrice',
                                    width: 130,
                                    align: 'right',
                                    render: (v) => formatCurrency(v),
                                },
                                {
                                    title: 'Thành tiền',
                                    dataIndex: 'totalPrice',
                                    width: 140,
                                    align: 'right',
                                    render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
                                },
                            ]}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={2}>
                                        <strong>Tổng cộng</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="center">
                                        <strong>{selectedImport.totalItems}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                                    <Table.Summary.Cell index={4} align="right">
                                        <strong style={{ color: '#4F46E5' }}>
                                            {formatCurrency(selectedImport.totalAmount)}
                                        </strong>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ImportList;
