    import express from "express";
    import {
    getPartnerTotalRevenue,
    getPartnerMonthlyRevenue,
    getPartnerDailyRevenue,
    getPartnerSoldTickets,
    getPartnerDashboard
    } from "../controllers/statsController.js";

    const router = express.Router();

    router.get("/dashboard/:partnerId", getPartnerDashboard);

    router.get("/total/:partnerId", getPartnerTotalRevenue);
    router.get("/monthly/:partnerId", getPartnerMonthlyRevenue);
    router.get("/daily/:partnerId", getPartnerDailyRevenue);
    router.get("/tickets/:partnerId", getPartnerSoldTickets);

    export default router;
