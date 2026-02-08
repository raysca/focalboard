import { Hono } from "hono";
import system from "./system.ts";
import authRoutes from "./auth.ts";
import userRoutes from "./users.ts";
import teamRoutes from "./teams.ts";
import boardRoutes from "./boards.ts";
import blockRoutes from "./blocks.ts";
import cardRoutes from "./cards.ts";
import contentBlockRoutes from "./content-blocks.ts";
import boardsAndBlocksRoutes from "./boards-and-blocks.ts";
import memberRoutes from "./members.ts";
import sharingRoutes from "./sharing.ts";
import categoryRoutes from "./categories.ts";
import searchRoutes from "./search.ts";
import subscriptionRoutes from "./subscriptions.ts";
import fileRoutes from "./files.ts";
import templateRoutes from "./templates.ts";
import onboardingRoutes from "./onboarding.ts";
import statisticsRoutes from "./statistics.ts";
import complianceRoutes from "./compliance.ts";
import archiveRoutes from "./archives.ts";
import dependencyRoutes from "./dependencies.ts";

const api = new Hono();

// System routes (hello, ping, clientConfig)
api.route("/", system);

// Auth routes (login, logout, register, changepassword)
api.route("/", authRoutes);

// Core entity routes
api.route("/", userRoutes);
api.route("/", teamRoutes);

// Search must be registered before boards to avoid /boards/search matching /boards/:boardID
api.route("/", searchRoutes);
api.route("/", boardRoutes);

// Block & card routes
api.route("/", blockRoutes);
api.route("/", cardRoutes);
api.route("/", contentBlockRoutes);
api.route("/", boardsAndBlocksRoutes);
api.route("/", dependencyRoutes);

// Membership & sharing
api.route("/", memberRoutes);
api.route("/", sharingRoutes);

// Categories, subscriptions
api.route("/", categoryRoutes);
api.route("/", subscriptionRoutes);

// Files, templates, onboarding
api.route("/", fileRoutes);
api.route("/", templateRoutes);
api.route("/", onboardingRoutes);

// Admin & stats
api.route("/", statisticsRoutes);
api.route("/", complianceRoutes);
api.route("/", archiveRoutes);

export default api;
