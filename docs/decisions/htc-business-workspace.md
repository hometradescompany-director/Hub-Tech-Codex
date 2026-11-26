# Home Trades Co business workspace

The Hub reintroduces the original residential trade workflow as a local sample.
The operator and customer views read one in-memory event history for a single
synthetic customer and property. Scheduling records one of two sample visit
windows. Issuing an invoice and recording a payment are demonstration state
changes. Refreshing the page starts a fresh sample.

| Capability | Implementation in this Hub slice |
| --- | --- |
| Customers, properties and customer portal | One sample relationship and a read-only customer projection |
| Quotes, job booking, completion, invoicing and payment status | Ordered demonstration actions and an append-only session timeline |
| Before-and-after and design customization | Perspective scene, three layout choices, cabinetry and worktop finishes, camera angle and JSON settings download |
| Leads, live estimating, service catalogue and pricing | Source migration pending |
| Messaging, documents, tasks, SOPs and templates | Source migration pending |
| Suppliers, vendors, reporting, finance and settings | Source migration pending |
| Authentication, persistent CRM, payment, messaging and accounting services | Production adapters pending |

The business source and its records stay in the owning private project.
The visual studio is new Hub code built on the public Hub's existing projection
math. The Reality Generator still owns its runtime. A proposal settings download
is a Hub preview configuration and carries no authoritative generator run,
measurement, price change or operational write.

A future production handoff needs an approved export or an owner-operated adapter
for each source. The useful first CRM handoff is the customer/property/quote/job
relationship and its event IDs. The visual handoff needs a versioned input for
layout and finishes and a response that identifies the resulting scene revision.
No private implementation is bundled here.
