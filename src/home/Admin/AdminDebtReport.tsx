import { useEffect, useMemo, useState } from "react";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";
import {
	ArrowDownCircle,
	BadgeDollarSign,
	CheckCircle2,
	Gauge,
	RefreshCw,
	Search,
	ShieldAlert,
	Wallet,
} from "lucide-react";
import type { DebtReportResponse } from "../../api/debtReportApi";
import { fetchAdminDebtReport, resetSystemFinancials } from "../../api/debtReportApi";

// ✅ MAPPING TÊN NHÀ XE
const NHA_XE_MAPPING: Record<string, string> = {
  "yft1Ag1eaRf3uCigXyCJLpmu9R42": "Phúc Yên",
  "SFbbzut0USTG5F6ZM3COrLXKGS93": "Cúc Tư",
  "BuPwvEMgfCNEDbz2VNKx5hnpBT52": "Hồng Sơn",
  "U5XWQ12kL8VnyQ0ovZTvUZLdJov1": "Nhật Tân"
};
const getNhaXeName = (id: string, name?: string) => NHA_XE_MAPPING[id] || name || id;

type FeeStatus = "all" | "settled" | "due";

const money = new Intl.NumberFormat("vi-VN", {
	style: "currency",
	currency: "VND",
	maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("vi-VN", {
	maximumFractionDigits: 0,
});

const statusMeta: Record<Exclude<FeeStatus, "all">, { label: string; bg: string; color: string }> = {
	settled: { label: "Đã thanh toán", bg: "#dcfce7", color: "#15803d" },
	due: { label: "Còn nợ", bg: "#fee2e2", color: "#b91c1c" },
};

const formatDate = (value: string | null) => {
	if (!value) return "-";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleString("vi-VN", { hour12: false });
};

const getLastActivityIso = (partner: DebtReportResponse["partners"][number]) => {
	const timestamps = [partner.latestBooking, partner.lastWithdrawalAt]
		.map((value) => (value ? new Date(value).getTime() : 0))
		.filter((time) => time > 0);
	if (!timestamps.length) return null;
	return new Date(Math.max(...timestamps)).toISOString();
};

export default function AdminDebtReport() {
	const [report, setReport] = useState<DebtReportResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<FeeStatus>("all");
	const [search, setSearch] = useState("");

	const loadReport = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchAdminDebtReport();
			setReport(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Không thể tải báo cáo.";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const handleReset = async () => {
		if (!confirm("⚠️ CẢNH BÁO QUAN TRỌNG:\n\nHành động này sẽ XÓA TOÀN BỘ dữ liệu tài chính của hệ thống bao gồm:\n- Tất cả Booking (Vé)\n- Tất cả Lịch sử rút tiền (Withdrawals)\n- Tất cả Sổ cái (Ledgers)\n- Tất cả Hóa đơn & Thanh toán (Invoices, Payments)\n\nDữ liệu sẽ trở về 0 và KHÔNG THỂ KHÔI PHỤC.\n\nBạn có chắc chắn muốn tiếp tục?")) {
			return;
		}
		
		if (!confirm("Xác nhận lần cuối: Bạn thực sự muốn xóa sạch dữ liệu và bắt đầu lại từ đầu?")) return;

		try {
			setLoading(true);
			await resetSystemFinancials();
			alert("✅ Đã reset toàn bộ hệ thống thành công! Mọi số liệu đã trở về 0.");
			loadReport();
		} catch (err) {
			alert("❌ Lỗi khi reset: " + (err instanceof Error ? err.message : String(err)));
			setLoading(false);
		}
	};

	useEffect(() => {
		loadReport();
	}, []);

	const filteredPartners = useMemo(() => {
		if (!report) return [];
		const keyword = search.trim().toLowerCase();
		return report.partners.filter((partner) => {
			// Map 'partial' to 'due' for filtering purposes if backend still returns 'partial'
			const effectiveStatus = partner.feeStatus === "partial" ? "due" : partner.feeStatus;
			const statusMatch = status === "all" || effectiveStatus === status;
			const displayName = getNhaXeName(partner.partnerId, partner.partnerName);
			const keywordMatch = !keyword
				? true
				: displayName.toLowerCase().includes(keyword) ||
					partner.partnerId.toLowerCase().includes(keyword);
			return statusMatch && keywordMatch;
		});
	}, [report, status, search]);

	const flow = useMemo(() => {
		if (!report) return [];
		const { summary } = report;
		const partnerReceivable = Math.max(0, summary.totalRevenue - summary.totalServiceFee);
		return [
			{
				title: "1. Doanh thu ghi nhận",
				desc: "Tổng tiền vé đã hoàn tất từ các nhà xe",
				value: summary.totalRevenue,
				icon: <BadgeDollarSign size={22} color="#0f172a" />,
			},
			{
				title: "2. Phí dịch vụ phải thu",
				desc: "% phí theo cấu hình hệ thống",
				value: summary.totalServiceFee,
				icon: <Gauge size={22} color="#0f172a" />,
			},
			{
				title: "3. Nhà xe được nhận",
				desc: "Doanh thu sau khi trừ phí dịch vụ",
				value: partnerReceivable,
				icon: <Wallet size={22} color="#0f172a" />,
			},
			{
				title: "4. Phí đã thanh toán về admin",
				desc: "Tổng phí dịch vụ đã thu (rút từ bucket fee)",
				value: summary.feePaid,
				icon: <CheckCircle2 size={22} color="#0f172a" />,
			},
			{
				title: "5. Phí còn phải thu",
				desc: "Dựa trên serviceFeeBalance / ledger",
				value: summary.feeOutstanding,
				icon: <ShieldAlert size={22} color="#0f172a" />,
			},
		];
	}, [report]);

	if (loading) {
		return <div style={{ padding: 40, textAlign: "center" }}>⏳ Đang tải báo cáo công nợ...</div>;
	}

	if (error) {
		return (
			<div style={{ padding: 40, textAlign: "center", color: "#b91c1c" }}>
				❌ {error}
				<div>
					<button
						style={{ marginTop: 16, padding: "10px 18px", borderRadius: 12, border: "none", background: "#2563eb", color: "white", cursor: "pointer" }}
						onClick={loadReport}
					>
						Thử tải lại
					</button>
				</div>
			</div>
		);
	}

	if (!report) {
		return null;
	}

	const { summary, charts, generatedAt } = report;

	const summaryCards = [
		{
			title: "Tổng nhà xe",
			value: summary.totalPartners,
			description: "Đang hoạt động trong hệ thống",
			accent: "linear-gradient(135deg,#a5b4fc,#6366f1)",
			icon: <Wallet size={22} />,
		},
		{
			title: "Tổng doanh thu",
			value: money.format(summary.totalRevenue),
			description: "Đã ghi nhận từ booking",
			accent: "linear-gradient(135deg,#fde68a,#f59e0b)",
			icon: <BadgeDollarSign size={22} />,
		},
		{
			title: "Tổng phí dịch vụ",
			value: money.format(summary.totalServiceFee),
			description: "Tổng phát sinh từ booking",
			accent: "linear-gradient(135deg,#bfdbfe,#3b82f6)",
			icon: <Gauge size={22} />,
		},
		{
			title: "Đã thu phí",
			value: money.format(summary.feePaid),
			description: "Tương ứng bucket fee đã rút",
			accent: "linear-gradient(135deg,#bbf7d0,#22c55e)",
			icon: <CheckCircle2 size={22} />,
		},
		{
			title: "Phí dịch vụ phải thu",
			value: money.format(summary.feeOutstanding),
			description: "Số tiền nhà xe còn nợ",
			accent: "linear-gradient(135deg,#fecaca,#ef4444)",
			icon: <ShieldAlert size={22} />,
		},
		{
			title: "Nhà xe còn nợ",
			value: `${summary.overdue} đơn vị`,
			description: "feeStatus = due",
			accent: "linear-gradient(135deg,#fcd34d,#f97316)",
			icon: <ArrowDownCircle size={22} />,
		},
	];

	const statusButtons: Array<{ key: FeeStatus; label: string; count: number }> = [
		{ key: "all", label: "Tất cả", count: report.partners.length },
		{ key: "settled", label: "Đã thanh toán", count: summary.fullySettled },
		// Combine partial + overdue into "due" count
		{ key: "due", label: "Còn nợ", count: summary.overdue + (summary.partial || 0) },
	];

	const statusLegend = [
		{ status: "Đã thanh toán", value: summary.fullySettled, color: "#16a34a" },
		{ status: "Còn nợ", value: summary.overdue + (summary.partial || 0), color: "#dc2626" },
	].filter((item) => item.value > 0);

	return (
		<div className="admin-debt-report">
			<style>{`
				.admin-debt-report {
					font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
					background: #f8fafc;
					min-height: 100vh;
					padding: 32px;
					color: #0f172a;
				}
				.adr-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
					gap: 18px;
				}
				.adr-card {
					background: white;
					border-radius: 20px;
					padding: 22px;
					box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15);
				}
				.adr-summary-card {
					color: #0f172a;
					border-radius: 24px;
					padding: 20px;
					display: flex;
					flex-direction: column;
					backdrop-filter: blur(6px);
					min-height: 160px;
					box-shadow: 0 20px 35px rgba(15,23,42,0.12);
				}
				.adr-summary-card h3 {
					margin: 0;
					font-size: 16px;
					font-weight: 600;
				}
				.adr-summary-card .value {
					margin-top: 18px;
					font-size: 26px;
					font-weight: 800;
				}
				.adr-summary-card p {
					margin: 6px 0 0;
					font-size: 13px;
					color: rgba(15,23,42,0.75);
				}
				.adr-flow {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
					gap: 16px;
				}
				.adr-flow-item {
					border-radius: 18px;
					background: #fff;
					padding: 16px;
					border: 1px solid rgba(148, 163, 184, 0.25);
					display: flex;
					gap: 12px;
				}
				.adr-flow-icon {
					width: 44px;
					height: 44px;
					border-radius: 14px;
					background: #e0e7ff;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.adr-table-wrapper {
					overflow-x: auto;
					border-radius: 20px;
					border: 1px solid rgba(148, 163, 184, 0.2);
				}
				table {
					width: 100%;
					border-collapse: collapse;
					font-size: 14px;
				}
				th {
					text-align: left;
					font-weight: 600;
					color: #475569;
					padding: 14px;
					background: #f1f5f9;
				}
				td {
					padding: 12px 14px;
					border-top: 1px solid rgba(148, 163, 184, 0.2);
				}
				.adr-status-filter {
					display: flex;
					flex-wrap: wrap;
					gap: 12px;
				}
				.adr-status-filter button {
					border: none;
					border-radius: 999px;
					padding: 8px 16px;
					background: #e2e8f0;
					color: #0f172a;
					font-weight: 600;
					cursor: pointer;
				}
				.adr-status-filter button.active {
					background: #2563eb;
					color: white;
					box-shadow: 0 12px 20px rgba(37, 99, 235, 0.3);
				}
				.adr-search {
					display: flex;
					align-items: center;
					gap: 10px;
					background: white;
					border-radius: 16px;
					padding: 10px 16px;
					border: 1px solid rgba(148, 163, 184, 0.4);
				}
				.adr-search input {
					border: none;
					outline: none;
					flex: 1;
					font-size: 15px;
					background: transparent;
				}
				.adr-badge {
					display: inline-flex;
					align-items: center;
					padding: 4px 10px;
					border-radius: 9999px;
					font-size: 12px;
					font-weight: 600;
				}
			`}</style>

			<header style={{ marginBottom: 28 }}>
				<p style={{ color: "#64748b", textTransform: "uppercase", fontWeight: 600, fontSize: 12 }}>
					Đồng bộ dữ liệu từ PartnerLedger • {new Date(generatedAt).toLocaleString("vi-VN", { hour12: false })}
				</p>
				<h1 style={{ fontSize: 32, margin: "6px 0" }}>Quản lý phí dịch vụ - Admin</h1>
				<p style={{ color: "#475569" }}>
					Mọi số liệu bên dưới lấy từ cùng nguồn dữ liệu với dashboard nhà xe (bookings + ledger), đảm bảo đồng bộ công nợ dịch vụ.
				</p>
			</header>

			<div className="adr-grid">
				{summaryCards.map((card) => (
					<div
						key={card.title}
						className="adr-summary-card"
						style={{ backgroundImage: card.accent, color: "#0f172a" }}
					>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<h3>{card.title}</h3>
							{card.icon}
						</div>
						<div className="value">{card.value}</div>
						<p>{card.description}</p>
					</div>
				))}
			</div>

			<section style={{ margin: "32px 0" }} className="adr-card">
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
					<div>
						<h2 style={{ margin: 0 }}>Sơ đồ dòng tiền &amp; phí dịch vụ</h2>
						<p style={{ color: "#475569", margin: 0 }}>Dựa trên cùng logic của dashboard nhà xe → không lệch số liệu.</p>
					</div>
					<div style={{ display: "flex", gap: 12 }}>
						<button
							onClick={handleReset}
							style={{ border: "none", background: "#ef4444", color: "white", padding: "10px 18px", borderRadius: 999, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}
						>
							<ShieldAlert size={18} /> Reset Hệ Thống
						</button>
						<button
							onClick={loadReport}
							style={{ border: "none", background: "#2563eb", color: "white", padding: "10px 18px", borderRadius: 999, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
						>
							<RefreshCw size={18} /> Làm mới
						</button>
					</div>
				</div>
				<div className="adr-flow">
					{flow.map((step) => (
						<div key={step.title} className="adr-flow-item">
							<div className="adr-flow-icon">{step.icon}</div>
							<div>
								<div style={{ fontWeight: 700 }}>{step.title}</div>
								<div style={{ color: "#475569", fontSize: 13 }}>{step.desc}</div>
								<div style={{ marginTop: 6, fontSize: 18, fontWeight: 800 }}>{money.format(step.value)}</div>
							</div>
						</div>
					))}
				</div>
			</section>

			<section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
				<div className="adr-card">
					<h3 style={{ marginTop: 0, marginBottom: 16 }}>Top doanh thu nhà xe</h3>
					{charts.revenueTop.length === 0 ? (
						<p style={{ color: "#94a3b8" }}>Chưa đủ dữ liệu để vẽ biểu đồ.</p>
					) : (
						<div style={{ width: "100%", height: 240 }}>
							<ResponsiveContainer>
								<BarChart 
									data={charts.revenueTop.map(item => ({ ...item, name: getNhaXeName(item.name) }))} 
									margin={{ top: 8, right: 12, left: -20, bottom: 4 }}
								>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
									<XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
									<Tooltip formatter={(value: number) => money.format(value)} />
									<Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>

				<div className="adr-card">
					<h3 style={{ marginTop: 0, marginBottom: 16 }}>Tình trạng phí dịch vụ</h3>
					{statusLegend.length === 0 ? (
						<p style={{ color: "#94a3b8" }}>Chưa có dữ liệu.</p>
					) : (
						<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
							<div style={{ width: 200, height: 200 }}>
								<ResponsiveContainer>
									<PieChart>
										<Pie
											data={statusLegend}
											dataKey="value"
											nameKey="status"
											innerRadius={60}
											outerRadius={90}
											paddingAngle={3}
										>
											{statusLegend.map((entry, index) => (
												<Cell key={entry.status} fill={entry.color || ["#22c55e", "#f59e0b", "#ef4444"][index % 3]} />
											))}
										</Pie>
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								{statusLegend.map((item) => (
									<div key={item.status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
										<span style={{ width: 14, height: 14, borderRadius: 4, background: item.color }} />
										<span style={{ fontWeight: 600 }}>{item.status}</span>
										<span style={{ color: "#475569" }}>{number.format(item.value)}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</section>

			<section style={{ marginTop: 32 }} className="adr-card">
				<div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
					<div className="adr-search" style={{ flex: "1 1 280px" }}>
						<Search size={18} color="#94a3b8" />
						<input
							type="text"
							placeholder="Tìm nhà xe theo tên hoặc ID"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div className="adr-status-filter" style={{ flex: "1 1 320px", justifyContent: "flex-end" }}>
						{statusButtons.map((btn) => (
							<button
								key={btn.key}
								className={status === btn.key ? "active" : ""}
								onClick={() => setStatus(btn.key)}
							>
								{btn.label} ({btn.count})
							</button>
						))}
					</div>
				</div>

				<div className="adr-table-wrapper">
					<table>
						<thead>
							<tr>
								<th>Nhà xe</th>
								<th>ID</th>
								<th>Doanh thu</th>
								<th>Phí dịch vụ phải thu</th>
								<th>Trạng thái</th>
								<th>Cập nhật gần nhất</th>
							</tr>
						</thead>
						<tbody>
							{filteredPartners.length === 0 ? (
								<tr>
									<td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
										Không tìm thấy dữ liệu.
									</td>
								</tr>
							) : (
								filteredPartners.map((partner) => (
									<tr key={partner.partnerId}>
										<td style={{ fontWeight: 600 }}>{getNhaXeName(partner.partnerId, partner.partnerName)}</td>
										<td style={{ fontFamily: "monospace" }}>{partner.partnerId}</td>
										<td>{money.format(partner.totalRevenue)}</td>
										<td>
											{partner.feeStatus === "settled" ? (
												<span style={{ color: "#16a34a", fontWeight: 600 }}>Đã thanh toán</span>
											) : (
												money.format(partner.serviceFeeBalance)
											)}
										</td>
										<td>
											<span
												className="adr-badge"
												style={{
													background: statusMeta[partner.feeStatus === "partial" ? "due" : partner.feeStatus]?.bg,
													color: statusMeta[partner.feeStatus === "partial" ? "due" : partner.feeStatus]?.color,
												}}
											>
												{statusMeta[partner.feeStatus === "partial" ? "due" : partner.feeStatus]?.label}
											</span>
										</td>
										<td>{formatDate(getLastActivityIso(partner))}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			<footer style={{ marginTop: 32, textAlign: "center", color: "#64748b", fontSize: 13 }}>
				Dữ liệu đồng bộ trực tiếp từ bookings → ledger → withdrawals. Admin và nhà xe nhìn cùng một nguồn nên không xảy ra lệch số liệu.
			</footer>
		</div>
	);
}
