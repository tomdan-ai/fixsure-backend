import "reflect-metadata";
import express from "express";
import { createConnection, getManager, getRepository, In } from "typeorm";
import { User } from "./entities/User";
import { TechnicianProfile } from "./entities/TechnicianProfile";
import { Property } from "./entities/Property";
import { MaintenanceRequest } from "./entities/MaintenanceRequest";
import { Quote } from "./entities/Quote";
import { Payment } from "./entities/Payment";
import { Evidence } from "./entities/Evidence";
import { Dispute } from "./entities/Dispute";
import { Notification } from "./entities/Notification";
import { AuditLog } from "./entities/AuditLog";
import { json } from "body-parser";

const app = express();
app.use(json());

createConnection({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "fixsure_mvp",
  synchronize: true,
  logging: false,
  entities: [
    User,
    TechnicianProfile,
    Property,
    MaintenanceRequest,
    Quote,
    Payment,
    Evidence,
    Dispute,
    Notification,
    AuditLog,
  ],
}).then(async (connection) => {
  console.log("Database connected");

  const userRepo = connection.getRepository(User);
  const technicianRepo = connection.getRepository(TechnicianProfile);
  const propertyRepo = connection.getRepository(Property);
  const requestRepo = connection.getRepository(MaintenanceRequest);
  const quoteRepo = connection.getRepository(Quote);
  const paymentRepo = connection.getRepository(Payment);
  const evidenceRepo = connection.getRepository(Evidence);
  const disputeRepo = connection.getRepository(Dispute);
  const notificationRepo = connection.getRepository(Notification);
  const auditLogRepo = connection.getRepository(AuditLog);

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    const user = new User();
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.role = role;
    user.status = "ACTIVE";
    user.contactVerified = false;
    user.identityStatus = "NOT_STARTED";
    user.passwordHash = password;
    await userRepo.save(user);
    res.json({ id: user.id, name: user.name, role: user.role });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await userRepo.findOne({ where: { email }, select: ["id", "name", "email", "role", "passwordHash"] });
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  app.get("/api/me", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      contactVerified: user.contactVerified,
      identityStatus: user.identityStatus,
      badges: user.getBadges ? user.getBadges() : [],
    });
  });

  // Verification routes
  app.post("/api/verification/contact", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    user.contactVerified = true;
    await userRepo.save(user);
    res.json({ contactVerified: user.contactVerified });
  });

  app.post("/api/verification/identity", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { nin, providerRef } = req.body;
    user.identityStatus = "VERIFIED";
    await userRepo.save(user);
    res.json({ identityStatus: user.identityStatus });
  });

  app.put("/api/technician/profile", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["technicianProfile"] });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!user.technicianProfile) {
      user.technicianProfile = new TechnicianProfile();
      user.technicianProfile.userId = user.id;
    }
    const { categories, city, bio } = req.body;
    user.technicianProfile.categories = categories;
    user.technicianProfile.city = city;
    user.technicianProfile.bio = bio;
    await userRepo.save(user);
    res.json({
      categories: user.technicianProfile.categories,
      city: user.technicianProfile.city,
      bio: user.technicianProfile.bio,
    });
  });

  // Properties routes
  app.post("/api/properties", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["managedProperties"] });
    if (!user || user.role !== "MANAGER") return res.status(403).json({ error: "Forbidden" });
    const { name, address, city } = req.body;
    const property = new Property();
    property.name = name;
    property.address = address;
    property.city = city;
    property.managerId = user.id;
    property.manager = user;
    await propertyRepo.save(property);
    res.json(property);
  });

  app.get("/api/properties", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["managedProperties"] });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json(user.managedProperties);
  });

  // Requests routes
  app.post("/api/requests", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["managedProperties"] });
    if (!user || user.role !== "MANAGER") return res.status(403).json({ error: "Forbidden" });
    const { propertyId, category, title, description, urgency, preferredDate } = req.body;
    const request = new MaintenanceRequest();
    request.propertyId = propertyId;
    request.category = category;
    request.title = title;
    request.description = description;
    request.urgency = urgency;
    request.preferredDate = preferredDate;
    request.status = "OPEN";
    request.createdBy = user;
    await requestRepo.save(request);
    res.json(request);
  });

  app.get("/api/requests", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["managedProperties"] });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role === "MANAGER") {
      const properties = await propertyRepo.find({ where: { managerId: user.id } });
      const propertyIds = properties.map((p) => p.id);
      const requests = await requestRepo.find({ where: { propertyId: In(propertyIds) } });
      res.json(requests);
    } else {
      res.json([]);
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const request = await requestRepo.findOne({
      where: { id: Number(req.params.id) },
      relations: ["property", "quotes", "evidence", "disputes"],
    });
    if (!request) return res.status(404).json({ error: "Not found" });
    res.json(request);
  });

  // Available requests for technicians
  app.get("/api/requests/available", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["technicianProfile"] });
    if (!user || user.role !== "TECHNICIAN") return res.status(403).json({ error: "Forbidden" });
    const profile = user.technicianProfile;
    if (!profile) return res.status(404).json({ error: "Technician profile not found" });
    const { categories, city } = profile;
    const requests = await requestRepo.find({ where: { status: "OPEN" }, relations: ["property"] });
    const available = requests.filter((req) => {
      const reqCategory = req.category;
      const reqCity = req.property.city;
      const matchesCategory = categories.includes(reqCategory);
      const matchesCity = reqCity === city;
      return matchesCategory && matchesCity;
    });
    res.json(available);
  });

  // Quotes routes
  app.post("/api/requests/:id/quotes", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["technicianProfile"] });
    if (!user || user.role !== "TECHNICIAN") return res.status(403).json({ error: "Forbidden" });
    const { id: requestId } = req.params;
    const { price, scope, durationDays } = req.body;
    const request = await requestRepo.findOne({ where: { id: Number(requestId) } });
    if (!request || request.status !== "OPEN") return res.status(400).json({ error: "Request not available" });
    const quote = new Quote();
    quote.requestId = Number(requestId);
    quote.technician = user;
    quote.price = price;
    quote.scope = scope;
    quote.durationDays = durationDays;
    quote.status = "SUBMITTED";
    await quoteRepo.save(quote);
    res.json(quote);
  });

  app.get("/api/requests/:id/quotes", async (req, res) => {
    const request = await requestRepo.findOne({
      where: { id: Number(req.params.id) },
      relations: ["quotes", "quotes.technician"],
    });
    if (!request) return res.status(404).json({ error: "Not found" });
    res.json(request.quotes);
  });

  // Quote approve
  app.post("/api/quotes/:id/approve", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["managedProperties"] });
    if (!user || user.role !== "MANAGER") return res.status(403).json({ error: "Forbidden" });

    const quote = await quoteRepo.findOne({ where: { id: Number(req.params.id) }, relations: ["request"] });
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    // Transaction: set this quote SELECTED, others NOT_SELECTED
    const manager = connection.manager;
    await manager.transaction(async (tm) => {
      // Remove existing selected quotes
      await tm.update(Quote, { requestId: quote.requestId, status: "SELECTED" }, { status: "NOT_SELECTED" });
      // Set this quote as selected
      await tm.update(Quote, quote.id, { status: "SELECTED" });
      // Set selectedQuoteId on request
      await tm.update(MaintenanceRequest, quote.requestId, { selectedQuoteId: quote.id });
      // Move request to AWAITING_PAYMENT
      await tm.update(MaintenanceRequest, quote.requestId, { status: "AWAITING_PAYMENT" });
    });

    const updatedQuote = await quoteRepo.findOne({ where: { id: quote.id }, relations: ["request", "request.property", "technician"] });
    res.json(updatedQuote);
  });

  // Payment routes
  app.post("/api/requests/:id/pay", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["managedProperties"] });
    if (!user || user.role !== "MANAGER") return res.status(403).json({ error: "Forbidden" });

    const request = await requestRepo.findOne({ where: { id: Number(req.params.id) }, relations: ["property"] });
    if (!request || request.status !== "AWAITING_PAYMENT") return res.status(400).json({ error: "Request not in AWAITING_PAYMENT state" });
    if (request.selectedQuoteId === null) return res.status(400).json({ error: "No quote selected" });

    const amount = request.selectedQuoteId; // simplified - would use quote price
    const internalRef = `ref_${Date.now()}`;

    const payment = new Payment();
    payment.requestId = request.id;
    payment.type = "COLLECTION";
    payment.internalRef = internalRef;
    payment.amount = amount;
    payment.status = "PENDING";
    await paymentRepo.save(payment);

    // Simulated payment provider call
    payment.providerRef = `paga_${Date.now()}`;
    payment.status = "SUCCESS";
    await paymentRepo.save(payment);

    // Move request to FUNDED
    await requestRepo.update(request.id, { status: "FUNDED" });

    res.json({ payment, requestStatus: "FUNDED" });
  });

  app.get("/api/requests/:id/payment", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const payment = await paymentRepo.findOne({ where: { requestId: Number(req.params.id) } });
    if (!payment) return res.status(404).json({ error: "No payment found" });
    res.json(payment);
  });

  // Start work
  app.post("/api/requests/:id/start", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["technicianProfile"] });
    if (!user || user.role !== "TECHNICIAN") return res.status(403).json({ error: "Forbidden" });

    const request = await requestRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!request || request.status !== "FUNDED") return res.status(400).json({ error: "Request not funded" });

    // Check if user is the selected technician
    if (request.selectedQuoteId) {
      const quote = await quoteRepo.findOne({ where: { id: request.selectedQuoteId }, relations: ["technician"] });
      if (!quote) return res.status(404).json({ error: "Quote not found" });
      if (quote.technician.id !== user.id) return res.status(403).json({ error: "Not your job" });
    }

    await requestRepo.update(request.id, { status: "IN_PROGRESS" });
    res.json({ status: "IN_PROGRESS" });
  });

  // Evidence
  app.post("/api/requests/:id/evidence", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["technicianProfile"] });
    if (!user || user.role !== "TECHNICIAN") return res.status(403).json({ error: "Forbidden" });

    const request = await requestRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!request || request.status !== "IN_PROGRESS") return res.status(400).json({ error: "Request not in progress" });

    const { kind, url, note } = req.body;
    const evidence = new Evidence();
    evidence.requestId = request.id;
    evidence.kind = kind;
    evidence.url = url;
    evidence.note = note;
    evidence.uploadedBy = user;
    await evidenceRepo.save(evidence);
    res.json(evidence);
  });

  // Complete
  app.post("/api/requests/:id/complete", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["technicianProfile"] });
    if (!user || user.role !== "TECHNICIAN") return res.status(403).json({ error: "Forbidden" });

    const request = await requestRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!request || request.status !== "IN_PROGRESS") return res.status(400).json({ error: "Request not in progress" });

    // Check for at least one AFTER evidence
    const afterEvidence = await evidenceRepo.find({ where: { requestId: request.id, kind: "AFTER" } });
    if (afterEvidence.length === 0) return res.status(400).json({ error: "No after evidence submitted" });

    await requestRepo.update(request.id, { status: "AWAITING_CONFIRMATION" });
    res.json({ status: "AWAITING_CONFIRMATION" });
  });

  // Confirm
  app.post("/api/requests/:id/confirm", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["managedProperties"] });
    if (!user || user.role !== "MANAGER") return res.status(403).json({ error: "Forbidden" });

    const request = await requestRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!request || request.status !== "AWAITING_CONFIRMATION") return res.status(400).json({ error: "Request not awaiting confirmation" });

    // Call payment provider payout
    const payment = await paymentRepo.findOne({ where: { requestId: request.id, type: "PAYOUT" } });
    if (!payment) return res.status(404).json({ error: "No payout payment found" });

    // Simulated payout
    payment.providerRef = `payout_${Date.now()}`;
    payment.status = "SUCCESS";
    await paymentRepo.save(payment);

    await requestRepo.update(request.id, { status: "COMPLETED" });
    res.json({ status: "COMPLETED", payment });
  });

  // Dispute
  app.post("/api/requests/:id/dispute", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const request = await requestRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!request) return res.status(404).json({ error: "Request not found" });

    const { reason } = req.body;
    const dispute = new Dispute();
    dispute.requestId = request.id;
    dispute.raisedBy = user;
    dispute.reason = reason;
    dispute.status = "OPEN";
    await disputeRepo.save(dispute);

    // Move request to DISPUTED
    await requestRepo.update(request.id, { status: "DISPUTED" });

    res.json(dispute);
  });

  // Dispute response
  app.post("/api/requests/:id/dispute/response", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token }, relations: ["technicianProfile"] });
    if (!user || user.role !== "TECHNICIAN") return res.status(403).json({ error: "Forbidden" });

    const { reason } = req.body;
    res.json({ message: "Dispute response recorded" });
  });

  // Admin routes
  app.get("/api/admin/disputes", async (req, res) => {
    const disputes = await disputeRepo.find({ where: { status: "OPEN" }, relations: ["request", "raisedBy"] });
    res.json(disputes);
  });

  app.post("/api/admin/disputes/:id/decide", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

    const dispute = await disputeRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!dispute) return res.status(404).json({ error: "Dispute not found" });

    const { decision, reason } = req.body;
    dispute.status = decision === "PAYOUT" ? "RESOLVED_PAYOUT" : "RESOLVED_REFUND";
    dispute.decision = decision;
    dispute.decisionReason = reason;
    await disputeRepo.save(dispute);

    const request = await requestRepo.findOne({ where: { id: dispute.requestId } });
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (decision === "PAYOUT") {
      // Trigger payout
      const payment = new Payment();
      payment.requestId = request.id;
      payment.type = "PAYOUT";
      payment.internalRef = `payout_${Date.now()}`;
      payment.amount = 100; // simplified
      payment.status = "SUCCESS";
      await paymentRepo.save(payment);
      await requestRepo.update(request.id, { status: "COMPLETED" });
    } else {
      // Refund
      await requestRepo.update(request.id, { status: "COMPLETED" });
    }

    res.json(dispute);
  });

  app.get("/api/admin/users", async (req, res) => {
    const users = await userRepo.find({ relations: ["technicianProfile"] });
    res.json(users);
  });

  app.post("/api/admin/users/:id/verify", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const admin = await userRepo.findOne({ where: { id: token } });
    if (!admin || admin.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

    const targetUser = await userRepo.findOne({ where: { id: req.params.id } });
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    targetUser.identityStatus = "VERIFIED";
    await userRepo.save(targetUser);
    res.json({ identityStatus: targetUser.identityStatus });
  });

  app.get("/api/admin/requests", async (req, res) => {
    const requests = await requestRepo.find({ relations: ["property", "quotes", "payments"] });
    res.json(requests);
  });

  app.get("/api/admin/audit", async (req, res) => {
    const logs = await auditLogRepo.find({ relations: ["actor"] }).then((results) => results.slice(0, 100));
    res.json(logs);
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = await userRepo.findOne({ where: { id: token } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await notificationRepo.find({ where: { userId: user.id } });
    res.json(notifications);
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    const notification = await notificationRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!notification) return res.status(404).json({ error: "Not found" });
    notification.read = true;
    await notificationRepo.save(notification);
    res.json(notification);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Database connection error:", err);
});