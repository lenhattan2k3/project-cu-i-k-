import express from "express";
    import {
    getPartnerTotalRevenue,
    getPartnerMonthlyRevenue,
    getPartnerDailyRevenue,
    getPartnerSoldTickets,
    getPartnerDashboard,
    getPartnerReport
    } from "../controllers/statsController.js";

    const router = express.Router();

    router.get("/dashboard/:partnerId", getPartnerDashboard);
    router.get("/report", getPartnerReport);
    router.get("/report/:partnerId", getPartnerReport);

    router.get("/total/:partnerId", getPartnerTotalRevenue);
    router.get("/monthly/:partnerId", getPartnerMonthlyRevenue);
    router.get("/daily/:partnerId", getPartnerDailyRevenue);
    router.get("/tickets/:partnerId", getPartnerSoldTickets);

    export default router;
