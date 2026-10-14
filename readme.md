| Step | Who performs it | Action and link | Result |
| :--- | :-------------- | :--- | :--- |
| 1    | Organisation    | Create shipment: `/portal/shipments/new` | Fill in shipment declaration |
| 2    | Organisation    | Submit declaration using the form on `/portal/shipments/new` | Shipment is saved as `pending_review` |
| 3    | Organisation    | View submitted shipment: `/portal/shipments` | Find the submitted shipment |
| 4    | Operations      | Open review queue: `/operations/shipments/review` | Review pending declarations |
| 5    | Operations      | Open a particular shipment: `/operations/shipments/:id` | Inspect declaration and supporting details |
| 6    | Operations      | Approve, reject or return for correction on the shipment details page | Approved $\rightarrow$ `EXPECTED`; returned $\rightarrow$ `CHANGES_REQUESTED`; rejected $\rightarrow$ `REJECTED` |
| 7    | Organisation    | Upload or correct documents: `/portal/documents/upload` | Provide requested supporting documents |
| 8    | Organisation    | View shipment details: `/portal/shipments/:id` | Check current status and shipment information |
| 9    | Operations      | Manage shipment: `/operations/shipments` | Update to `IN_TRANSIT_TO_TERMINAL` when movement begins |
| 10   | Gate officer    | Gate-in: `/gate/in` | Record arrival; status `ARRIVED_AT_GATE` |
| 11   | Receiving staff | Receiving: `/operations/receiving` | Verify actual cargo; status `RECEIVED` |
| 12   | Yard staff      | Yard allocation: `/operations/yard` | Record placement; status `STORED` |
| 13   | Warehouse staff | Warehouse placement: `/operations/warehouse` | Assign storage location where applicable |
| 14   | Warehouse / inventory staff | Inventory: `/operations/inventory` | Record cargo balances and movements |
| 15   | Documentation staff | Documents: `/documents` | Verify documents; status `DOCS_IN_PROGRESS` while checks continue |
| 16   | Examination staff | Examination: `/operations/examination` | Schedule, conduct and record examination if required |
| 17   | Operations / compliance | Holds and exceptions: `/operations/holds` | Resolve blocking issues before release |
| 18   | Finance         | Generate or review invoice: `/finance/invoices` | Charges are recorded; status may become `CHARGES_PENDING` |
| 19   | Organisation    | View invoice: `/portal/invoices` | Review charges due |
| 20   | Organisation    | Make payment: `/portal/payments` | Submit payment |
| 21   | Finance         | Verify payment: `/finance/payments` | Confirm settlement; status `CHARGES_SETTLED` |
| 22   | Finance         | Reconcile payment: `/finance/reconciliation` | Match payment and financial records |
| 23   | Authorised Operations | Check release conditions: `/operations/shipments/:id` | Authorise release when requirements are satisfied |
| 24   | Organisation / transporter | Book collection: `/gate/appointments` | Appointment confirmed; status `SLOT_BOOKED` |
| 25   | Gate / release staff | Verify collection pass: `/gate/passes` | Confirm the required gate pass |
| 26   | Yard / loading staff | Prepare and load cargo: `/operations/yard` | Status `LOADING` |
| 27   | Gate officer | Record departure: `/gate/out` | Status `GATE_OUT` |
| 28   | Operations / Finance | Finalise shipment: `/operations/shipments/:id` | Reconcile records and close as `CLOSED` |