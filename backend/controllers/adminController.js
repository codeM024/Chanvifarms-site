import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { adminSecret } from "../middleware/adminAuth.js";

// ADMIN_ACCOUNTS="email1:bcryptHash1,email2:bcryptHash2"
// Generate a hash with: npm run hash-admin-password -- "new password"
const loadAdminAccounts = () =>
    (process.env.ADMIN_ACCOUNTS || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const i = entry.indexOf(":");
            return { email: entry.slice(0, i).trim().toLowerCase(), hash: entry.slice(i + 1).trim() };
        })
        .filter((a) => a.email && a.hash.startsWith("$2"));

// Simple in-memory brute-force guard: 5 failed attempts per IP+email per 15 minutes
const failedAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const isLockedOut = (key) => {
    const entry = failedAttempts.get(key);
    if (!entry) return false;
    if (Date.now() - entry.first > WINDOW_MS) {
        failedAttempts.delete(key);
        return false;
    }
    return entry.count >= MAX_FAILURES;
};

const recordFailure = (key) => {
    const entry = failedAttempts.get(key);
    if (!entry || Date.now() - entry.first > WINDOW_MS) failedAttempts.set(key, { count: 1, first: Date.now() });
    else entry.count += 1;
};

// Compared against when the email is unknown, so response time doesn't reveal which emails exist
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("not-a-real-password", 12));

const adminLogin = async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const key = `${req.ip}|${email}`;
    if (isLockedOut(key)) {
        return res.status(429).json({ success: false, message: "Too many failed attempts. Try again in 15 minutes." });
    }

    const accounts = loadAdminAccounts();
    if (accounts.length === 0) {
        console.error("ADMIN_ACCOUNTS is not configured - admin login is disabled.");
        return res.status(503).json({ success: false, message: "Admin login is not configured on the server." });
    }

    const account = accounts.find((a) => a.email === email);
    const ok = await bcrypt.compare(password, account ? account.hash : await getDummyHash());

    if (!account || !ok) {
        recordFailure(key);
        return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    failedAttempts.delete(key);
    const expiresIn = 12 * 60 * 60; // 12 hours
    const token = jwt.sign({ role: "admin", email: account.email }, adminSecret(), { expiresIn });

    return res.json({ success: true, token, email: account.email, expiresAt: Date.now() + expiresIn * 1000 });
};

export { adminLogin };
