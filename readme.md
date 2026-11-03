Step	Who performs it	Action and link	Result
1	Organisation	Create shipment: /portal/shipments/new	Fill in shipment declaration
2	Organisation	Submit declaration: /portal/shipments/new	Shipment is saved as pending_review
3	Organisation	View submitted shipments: /portal/shipments	Find the submitted shipment
4	Operations / Manifest staff	Manifest Intake: /operations/manifest	Import or record the carrier's manifest, validate cargo details, and match manifest entries to shipment declarations. Track unmatched entries for follow-up.
5	Operations	Open review queue: /operations/shipments/review	Review pending declarations
6	Operations	Open a shipment: /operations/shipments/:id	Inspect the declaration, manifest information and supporting details
7	Operations	Approve, reject or return for correction	Approved → EXPECTED; returned → CHANGES_REQUESTED; rejected → REJECTED
8	Organisation	Upload or correct documents: /portal/documents/upload	Provide requested supporting documents
9	Organisation	View shipment details: /portal/shipments/:id	Check status and shipment information
10	Operations	Manage shipment: /operations/shipments	Set IN_TRANSIT_TO_TERMINAL when movement begins
11	Gate officer	Gate-in: /gate/in	Record arrival; status ARRIVED_AT_GATE
12	Receiving staff	Receiving: /operations/receiving	Verify actual cargo; status RECEIVED
13	Yard staff	Yard allocation: /operations/yard	Record placement; status STORED
14	Warehouse staff	Warehouse placement: /operations/warehouse	Assign storage location where applicable
15	Warehouse / inventory staff	Inventory: /operations/inventory	Record cargo balances and movements
16	Documentation staff	Documents: /documents	Verify documents; status may be DOCS_IN_PROGRESS
17	Examination staff	Examination: /operations/examination	Schedule and record examination if required
18	Operations / compliance	Holds and exceptions: /operations/holds	Resolve blocking issues before release
19	Finance	Generate or review invoice: /finance/invoices	Record charges; status may become CHARGES_PENDING
20	Organisation	View invoice: /portal/invoices	Review charges due
21	Organisation	Make payment: /portal/payments	Submit payment
22	Finance	Verify payment: /finance/payments	Confirm settlement; status CHARGES_SETTLED when applicable
23	Finance	Reconcile payment: /finance/reconciliation	Match payment and financial records
24	Authorised Operations	Check release conditions: /operations/shipments/:id	Authorise release only when required conditions are satisfied
25	Organisation / transporter	Book collection: /gate/appointments	Confirm appointment; status SLOT_BOOKED
26	Gate / release staff	Verify collection pass: /gate/passes	Verify required gate pass
27	Yard / loading staff	Prepare and load cargo: /operations/yard	Status LOADING
28	Gate officer	Record departure: /gate/out	Status GATE_OUT
29	Operations / Finance	Finalise shipment: /operations/shipments/:id	Reconcile records and close as CLOSED