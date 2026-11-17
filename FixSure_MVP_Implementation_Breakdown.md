# FixSure MVP: Simple Implementation Breakdown

**Stack:** Next.js (route handlers) + TypeORM + Neon (PostgreSQL)
**Source:** FixSure Hackathon Project Blueprint v1.0
**Goal:** A small, reliable end-to-end flow: request → quote → approval → payment → proof of work → confirmation or dispute → settlement.

---

## 1. Simplifications from the PRD

- **One table for request and job.** `MaintenanceRequest` carries the status through the whole lifecycle.
- **Matching is a plain query:** technician category + city, and not suspended.
- **Verification is a status flag** on the user, set by the admin or a simulated provider. Badges are derived from it, never stored.
- **Paga sits behind one adapter** (`PaymentProvider`) with a simulated implementation, so the flow works before sandbox access.
- **Skipped for now:** chat, ratings, multi-staff organisations, geo ranking, analytics, push notifications.
- **Be honest in the UI and the demo:** anything simulated (payment, verification, payout) is labelled as simulated.

---

## 2. Roles

| Role | Can do |
|---|---|
| `MANAGER` | Add properties, create requests, compare and approve quotes, pay, confirm or dispute |
| `TECHNICIAN` | Maintain profile, view matching requests, quote, do the work, upload evidence |
| `ADMIN` | Verify users, review disputes, record decisions, view audit log |

Every route checks the caller's role and ownership of the record.

---

## 3. Entities (TypeORM)

| Entity | Key fields |
|---|---|
| **User** | id, name, email, phone, passwordHash, role, status (`ACTIVE`/`SUSPENDED`), contactVerified, identityStatus, createdAt |
| **TechnicianProfile** | userId, categories[], city, bio, professionalStatus |
| **Property** | id, managerId, name, address, city |
| **MaintenanceRequest** | id, propertyId, category, title, description, urgency, preferredDate, status, selectedQuoteId, createdAt |
| **Quote** | id, requestId, technicianId, price, scope, durationDays, status |
| **Payment** | id, requestId, type (`COLLECTION`/`PAYOUT`/`REFUND`), internalRef, providerRef, amount, status |
| **Evidence** | id, requestId, uploadedBy, kind (`BEFORE`/`AFTER`), url, note, createdAt |
| **Dispute** | id, requestId, raisedBy, reason, status, decision, decisionReason, decidedBy |
| **Notification** | id, userId, message, read, createdAt |
| **AuditLog** | id, actorId, action, entity, entityId, meta (jsonb), createdAt |

**Enums**

- Category: `ELECTRICAL`, `PLUMBING`, `AC_REFRIGERATION`
- Verification status: `NOT_STARTED`, `PENDING`, `IN_REVIEW`, `VERIFIED`, `REJECTED`, `EXPIRED`, `REQUIRES_RESUBMISSION`
- Payment status: `PENDING`, `SUCCESS`, `FAILED`, `REVERSED`

**Badges (derived, not stored)**

| Badge | Rule |
|---|---|
| Contact Verified | `contactVerified = true` |
| Identity Verified | `identityStatus = VERIFIED` |
| Professional Verified | `professionalStatus = VERIFIED` |
| Trusted Provider | Identity Verified + Professional Verified |

Never store raw NIN/BVN. Keep only the status, a provider reference and a timestamp.

---

## 4. Status flows

Enforce these in one backend function (`transition(request, nextStatus, actor)`), not in the frontend.

**Request**

```
OPEN → AWAITING_PAYMENT → FUNDED → IN_PROGRESS → AWAITING_CONFIRMATION → COMPLETED
                                                        │
                                                        └→ DISPUTED → COMPLETED (paid out or refunded)

OPEN / AWAITING_PAYMENT → CANCELLED
```

**Quote:** `SUBMITTED` → `SELECTED` or `NOT_SELECTED`

**Dispute:** `OPEN` → `RESOLVED_PAYOUT` or `RESOLVED_REFUND`

---

## 5. User stories and APIs

### Story 1: Sign up and get verified
*As a user, I register as a manager or technician and complete verification.*

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register` | role = `MANAGER` or `TECHNICIAN` |
| POST | `/api/auth/login` | returns session or JWT |
| GET | `/api/me` | profile, role, badges |
| POST | `/api/verification/contact` | phone/email confirmation (simulated OTP) |
| POST | `/api/verification/identity` | NIN/BVN check (simulated); store status and provider ref only |
| PUT | `/api/technician/profile` | categories, city, bio |

### Story 2: Add a property
*As a manager, I add the properties I look after.*

| Method | Route | Notes |
|---|---|---|
| POST | `/api/properties` | name, address, city |
| GET | `/api/properties` | own properties only |

### Story 3: Create a maintenance request
*As a manager, I report a problem at a property.*

| Method | Route | Notes |
|---|---|---|
| POST | `/api/requests` | propertyId, category, title, description, urgency, preferredDate. Status = `OPEN` |
| GET | `/api/requests` | manager sees own requests |
| GET | `/api/requests/:id` | details, status, selected quote, evidence, dispute |

### Story 4: Technician finds jobs and quotes
*As a technician, I see jobs that match my category and city and send a quote.*

| Method | Route | Notes |
|---|---|---|
| GET | `/api/requests/available` | `OPEN` requests where category is in my categories and city matches |
| POST | `/api/requests/:id/quotes` | price, scope, durationDays. One quote per technician per request |
| GET | `/api/requests/:id/quotes` | manager compares quotes; each includes the technician's badges |

### Story 5: Approve a quote
*As a manager, I choose one quote.*

| Method | Route | Notes |
|---|---|---|
| POST | `/api/quotes/:id/approve` | One DB transaction: set this quote `SELECTED`, others `NOT_SELECTED`, set `selectedQuoteId`, move request to `AWAITING_PAYMENT`. Reject if a quote is already selected |

### Story 6: Pay for the job
*As a manager, I pay the approved amount.*

| Method | Route | Notes |
|---|---|---|
| POST | `/api/requests/:id/pay` | Create `Payment` (`COLLECTION`, `PENDING`) with an `internalRef`; call `PaymentProvider.collect()` |
| POST | `/api/webhooks/paga` | Verify the signature, then confirm the transaction status with the provider before trusting it. Set payment `SUCCESS` and request `FUNDED`. **Idempotent by `providerRef`** |
| GET | `/api/requests/:id/payment` | current payment status for the UI |

A frontend success message is never proof of payment. Only the verified webhook or provider status check moves a request to `FUNDED`.

### Story 7: Do the work and submit proof
*As a technician, I start the job and upload evidence.*

| Method | Route | Notes |
|---|---|---|
| POST | `/api/requests/:id/start` | `FUNDED` → `IN_PROGRESS`; only the selected technician |
| POST | `/api/requests/:id/evidence` | kind (`BEFORE`/`AFTER`), image URL, note. Upload the file to storage first, then save the URL |
| POST | `/api/requests/:id/complete` | requires at least one `AFTER` evidence item; moves to `AWAITING_CONFIRMATION` |

### Story 8: Confirm or dispute
*As a manager, I accept the work or object to it.*

| Method | Route | Notes |
|---|---|---|
| POST | `/api/requests/:id/confirm` | → `COMPLETED`; calls `PaymentProvider.payout()`. Payout counts as done only after provider confirmation |
| POST | `/api/requests/:id/dispute` | reason (+ optional evidence); → `DISPUTED`. Blocks payout |
| POST | `/api/requests/:id/dispute/response` | technician adds their explanation |

### Story 9: Admin resolves disputes and manages trust
*As an admin, I decide disputes and verify technicians.*

| Method | Route | Notes |
|---|---|---|
| GET | `/api/admin/disputes` | queue of open disputes with evidence from both sides |
| POST | `/api/admin/disputes/:id/decide` | `{ decision: "PAYOUT" \| "REFUND", reason }`; triggers payout or refund; writes audit log |
| GET | `/api/admin/users` | users and verification status |
| POST | `/api/admin/users/:id/verify` | approve or reject professional evidence; suspend if needed |
| GET | `/api/admin/requests` | overview of requests and payments |
| GET | `/api/admin/audit` | audit log |

### Story 10: Notifications
*As a user, I see what needs my attention.*

| Method | Route | Notes |
|---|---|---|
| GET | `/api/notifications` | own notifications |
| POST | `/api/notifications/:id/read` | mark as read |

Create a notification row on: new matching request, new quote, quote approved, payment confirmed, evidence submitted, dispute opened, dispute decided.

---

## 6. Payment adapter

Keep all Paga calls behind one interface. Build the simulated version first and swap in the real Paga sandbox once access and the approved arrangement are confirmed.

```ts
interface PaymentProvider {
  collect(input: { internalRef: string; amount: number; payer: string }): Promise<{ providerRef: string; checkoutInfo?: unknown }>;
  getStatus(providerRef: string): Promise<'PENDING' | 'SUCCESS' | 'FAILED'>;
  payout(input: { internalRef: string; amount: number; recipient: string }): Promise<{ providerRef: string }>;
  refund(input: { internalRef: string; amount: number; originalRef: string }): Promise<{ providerRef: string }>;
}
```

Do not guess Paga endpoints or fields. Use the official Paga Engine documentation and confirm the settlement and refund arrangement with Paga in writing before describing it as escrow.

---

## 7. Rules to keep from the PRD

1. Only one quote can be selected per request (DB transaction).
2. Payout is blocked while a dispute is open. No auto-release on a timer.
3. Webhooks are idempotent and verified against the provider.
4. Status changes go through one transition function.
5. Every money action and admin decision writes an `AuditLog` row.
6. Failed or pending payments are never shown as successful.
7. Badges are derived from backend records; users cannot award themselves badges.
8. Simulated payment, verification and payout steps are labelled as simulated.

---

## 8. Suggested build order

1. Project setup: Next.js, TypeORM, Neon connection, migrations
2. Auth + roles, then properties
3. Requests → matching → quotes → approve
4. `PaymentProvider` (simulated), then pay and webhook routes
5. Start → evidence → complete → confirm
6. Dispute + admin decision + audit log
7. Notifications list
8. Swap the simulated provider for the Paga sandbox when access is confirmed

---

## 9. Demo path (one story)

1. Manager signs in and opens **Sample Office Complex**.
2. Manager creates an electrical request.
3. Technician sees it and submits a quote; a second technician quotes too.
4. Manager compares quotes (with badges) and approves one.
5. Manager pays (sandbox or clearly labelled simulation); webhook confirms.
6. Technician starts the job and uploads after-work evidence.
7. Manager confirms; settlement is shown (labelled if simulated).
8. Optional: second job where the manager disputes and the admin decides.
