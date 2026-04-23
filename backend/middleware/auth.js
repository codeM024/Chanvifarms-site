import jwt from "jsonwebtoken"

const authMiddleware = async (req, res, next) => {
    const { token } = req.headers;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not Authorized. Please login again.",
            tokenExpired: true
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token is about to expire (within 1 hour)
        const tokenExp = new Date(decoded.exp * 1000);
        const now = new Date();
        const hourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
        
        if (tokenExp < now) {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please login again.",
                tokenExpired: true
            });
        }
        
        // Optionally refresh token if it's about to expire
        if (tokenExp < hourFromNow) {
            const newToken = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.set('New-Token', newToken);
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again.",
            tokenExpired: true
        });
    }
}

export default authMiddleware;