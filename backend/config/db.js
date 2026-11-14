import mongoose from "mongoose";
import dns from "dns";

// mongodb+srv:// URIs need a DNS SRV lookup. Some machines (VPNs, local DNS
// proxies on 127.0.0.1) refuse SRV queries, which crashes startup with
// "querySrv ECONNREFUSED". If that happens, retry the lookup via public DNS.
const ensureSrvResolvable = async (uri) => {
    if (!uri?.startsWith("mongodb+srv://")) return;
    const host = new URL(uri).hostname;
    try {
        await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    } catch (err) {
        if (!["ECONNREFUSED", "ETIMEOUT", "ESERVFAIL"].includes(err.code)) return;
        const fallback = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1").split(",").map(s => s.trim());
        console.warn(`System DNS could not resolve MongoDB SRV record (${err.code}); using ${fallback.join(", ")}`);
        dns.setServers(fallback);
    }
};

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    await ensureSrvResolvable(uri);
    await mongoose.connect(uri);
    console.log("DataBase Connected");
};
