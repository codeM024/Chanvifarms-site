import jwt from "jsonwebtoken";

const adminSecret = () => process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

// Requires "Authorization: Bearer <token>" issued by POST /api/admin/login
const adminAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: "Admin login required." });
    }

    try {
        const payload = jwt.verify(token, adminSecret());
        if (payload.role !== "admin") throw new Error("not an admin token");
        req.admin = { email: payload.email };
        next();
    } catch (err) {
        const expired = err.name === "TokenExpiredError";
        return res.status(401).json({
            success: false,
            tokenExpired: expired,
            message: expired ? "Admin session expired. Please log in again." : "Invalid admin session.",
        });
    }
};

export { adminSecret };
export default adminAuth;
