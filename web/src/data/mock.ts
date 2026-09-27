export type CargoStatus = "Stored" | "Documentation" | "Held" | "Release authorised" | "Gate out";

export type CargoRecord = {
	id: string;
	reference: string;
	container: string;
	billOfLading: string;
	cargo: string;
	consignee: string;
	status: CargoStatus;
	location: string;
	arrival: string;
	storage: string;
	holds: number;
	outstanding: string;
	weight: string;
};

export const cargoRecords: CargoRecord[] = [
	{
		id: "2481",
		reference: "TRN-IMP-002481",
		container: "TRIU1234564",
		billOfLading: "TRN-BL-2026-008721",
		cargo: "Consumer electronics",
		consignee: "Atlantic Trade Nigeria Ltd",
		status: "Stored",
		location: "Bond WH · Bay 2",
		arrival: "06 Sep 2026",
		storage: "3 days",
		holds: 0,
		outstanding: "₦1,248,000",
		weight: "18,420 kg",
	},
	{
		id: "2482",
		reference: "TRN-IMP-002482",
		container: "CMAU4829106",
		billOfLading: "TRN-BL-2026-008742",
		cargo: "Household appliances",
		consignee: "Kaduna Import & Distribution Ltd",
		status: "Documentation",
		location: "Yard B · B02",
		arrival: "07 Sep 2026",
		storage: "2 days",
		holds: 1,
		outstanding: "₦834,500",
		weight: "21,080 kg",
	},
	{
		id: "1932",
		reference: "TRN-EXP-001932",
		container: "MSCU1234560",
		billOfLading: "TRN-BL-2026-007991",
		cargo: "Industrial components",
		consignee: "Westbridge Logistics",
		status: "Held",
		location: "Yard C · C05",
		arrival: "04 Sep 2026",
		storage: "5 days",
		holds: 2,
		outstanding: "₦2,410,000",
		weight: "26,700 kg",
	},
	{
		id: "2483",
		reference: "TRN-IMP-002483",
		container: "TEMU3849204",
		billOfLading: "TRN-BL-2026-008755",
		cargo: "Textile materials",
		consignee: "Coastal Freight Nigeria",
		status: "Release authorised",
		location: "Yard A · A04",
		arrival: "02 Sep 2026",
		storage: "7 days",
		holds: 0,
		outstanding: "₦0",
		weight: "14,920 kg",
	},
	{
		id: "2484",
		reference: "TRN-IMP-002484",
		container: "OOLU2948108",
		billOfLading: "TRN-BL-2026-008781",
		cargo: "Food-grade packaging",
		consignee: "Prime Haulage Ltd",
		status: "Gate out",
		location: "Gate 3",
		arrival: "01 Sep 2026",
		storage: "8 days",
		holds: 0,
		outstanding: "₦0",
		weight: "12,640 kg",
	},
];

export const documents = [
	{
		name: "Commercial Invoice · 008721",
		type: "Commercial Invoice",
		status: "Verified",
		uploadedBy: "M. Adeyemi",
		date: "08 Sep 2026",
		version: "v2",
	},
	{
		name: "Packing List · 008721",
		type: "Packing List",
		status: "Under review",
		uploadedBy: "M. Adeyemi",
		date: "08 Sep 2026",
		version: "v1",
	},
	{
		name: "Bill of Lading · 008721",
		type: "Bill of Lading",
		status: "Verified",
		uploadedBy: "Shipping desk",
		date: "06 Sep 2026",
		version: "v1",
	},
	{
		name: "Customs support documents",
		type: "Customs Documents",
		status: "Required",
		uploadedBy: "—",
		date: "—",
		version: "—",
	},
	{
		name: "Delivery Order · 008721",
		type: "Delivery Order",
		status: "Uploaded",
		uploadedBy: "Meridian Customs Services",
		date: "09 Sep 2026",
		version: "v1",
	},
];

export const invoices = [
	{
		number: "TRN-INV-2026-01482",
		customer: "Atlantic Trade Nigeria Ltd",
		amount: "₦1,248,000",
		date: "09 Sep 2026",
		due: "16 Sep 2026",
		status: "Issued",
	},
	{
		number: "TRN-INV-2026-01475",
		customer: "Kaduna Import & Distribution Ltd",
		amount: "₦834,500",
		date: "08 Sep 2026",
		due: "15 Sep 2026",
		status: "Paid",
	},
	{
		number: "TRN-INV-2026-01461",
		customer: "Westbridge Logistics",
		amount: "₦2,410,000",
		date: "05 Sep 2026",
		due: "12 Sep 2026",
		status: "Overdue",
	},
	{
		number: "TRN-INV-2026-01440",
		customer: "Coastal Freight Nigeria",
		amount: "₦392,000",
		date: "02 Sep 2026",
		due: "09 Sep 2026",
		status: "Paid",
	},
];

export const gateQueue = [
	{
		time: "07:42",
		truck: "ABJ-482-KD",
		driver: "A. Balogun",
		container: "TRIU1234564",
		cargo: "TRN-IMP-002481",
		status: "Admitted",
		decision: "In · Lane 2",
	},
	{
		time: "07:55",
		truck: "KJA-918-LA",
		driver: "S. Okoro",
		container: "CMAU4829106",
		cargo: "TRN-IMP-002482",
		status: "Loading",
		decision: "In · Lane 4",
	},
	{
		time: "08:10",
		truck: "KAN-302-XY",
		driver: "M. Yusuf",
		container: "MSCU1234560",
		cargo: "TRN-EXP-001932",
		status: "Referred",
		decision: "Hold · docs",
	},
	{
		time: "08:18",
		truck: "KJA-918-LA",
		driver: "E. Eze",
		container: "TEMU3849204",
		cargo: "TRN-IMP-002483",
		status: "Waiting",
		decision: "Queue",
	},
	{
		time: "08:30",
		truck: "ABJ-482-KD",
		driver: "R. Bello",
		container: "OOLU2948108",
		cargo: "TRN-IMP-002484",
		status: "Expected",
		decision: "Slot 12",
	},
];

export const notifications = [
	{
		title: "Document awaiting upload",
		detail: "TRN-IMP-002482 · Customs support documents",
		category: "Documents",
		time: "8 min ago",
		tone: "warning",
	},
	{
		title: "Examination scheduled",
		detail: "TRN-IMP-002481 · 09 Sep 2026 at 14:30",
		category: "Examination",
		time: "24 min ago",
		tone: "info",
	},
	{
		title: "Financial hold applied",
		detail: "TRN-EXP-001932 · outstanding charges",
		category: "Holds",
		time: "1 hr ago",
		tone: "critical",
	},
	{
		title: "Gate pass generated",
		detail: "TRN-IMP-002483 · GP-2026-00481",
		category: "Gate",
		time: "2 hrs ago",
		tone: "success",
	},
];

export const timeline: [string, string, string, string, string, string][] = [
	["05 Sep 2026", "Manifest received", "Documentation desk", "Abuja · Docs Desk", "TRINU-OPS-14", "MAN-008721"],
	["06 Sep 2026", "Cargo arrived at terminal", "Gate officer · I. Musa", "Gate 3", "Gate-03", "GATE-01982"],
	["06 Sep 2026", "Gate-in completed", "Yard officer · D. Okafor", "Receiving Bay 2", "RFID-04", "GIN-002481"],
	["06 Sep 2026", "Receiving completed", "Warehouse team", "Receiving Bay 2", "Tablet-07", "RCV-002481"],
	["07 Sep 2026", "Positioned in bonded storage", "Yard officer · S. Eze", "Bond WH · Bay 2", "RFID-11", "MOV-004119"],
	["08 Sep 2026", "Documentation review started", "M. Adeyemi", "Docs Desk", "TRINU-OPS-18", "DOC-009842"],
	["09 Sep 2026", "Examination scheduled", "Coordination desk", "Examination Area 1", "TRINU-OPS-21", "EXM-001192"],
];

export const roles = ["Management", "Operations Manager", "Gate Officer", "Finance Officer", "Importer"];