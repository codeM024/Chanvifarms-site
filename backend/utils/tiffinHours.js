import { DEFAULT_WINDOWS } from "../models/tiffinSettingsModel.js";

// All ordering windows are in India time, regardless of where the server runs
const IST_OFFSET_MIN = 330;

const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

const formatTime = (hhmm) => {
    let [h, m] = hhmm.split(":").map(Number);
    if (h === 24) h = 0;
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const describeWindow = (w) =>
    `${formatTime(w.start)} - ${w.end === "24:00" ? "12:00 AM (midnight)" : formatTime(w.end)}`;

const istMinutesOfDay = (date = new Date()) => {
    const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes();
    return (utcMin + IST_OFFSET_MIN) % (24 * 60);
};

/**
 * Works out whether tiffin ordering is open right now.
 * Windows are [start, end) in IST; end "24:00" means midnight.
 */
export const getOrderingStatus = (settings, date = new Date()) => {
    const windows = settings?.orderingWindows?.length ? settings.orderingWindows : DEFAULT_WINDOWS;
    const now = istMinutesOfDay(date);
    const sorted = [...windows].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    const current = sorted.find((w) => now >= toMinutes(w.start) && now < toMinutes(w.end));
    const manualOff = settings && settings.acceptingOrders === false;

    let next = sorted.find((w) => toMinutes(w.start) > now) || sorted[0];
    const nextIsTomorrow = !sorted.some((w) => toMinutes(w.start) > now);

    const windowsOut = sorted.map((w) => ({ label: w.label, start: w.start, end: w.end, text: describeWindow(w) }));

    if (current && !manualOff) {
        return {
            isOpen: true,
            currentWindow: current.label,
            closesAt: current.end,
            message: `Now taking ${current.label.toLowerCase()} orders until ${current.end === "24:00" ? "midnight" : formatTime(current.end)}`,
            windows: windowsOut,
        };
    }

    return {
        isOpen: false,
        currentWindow: null,
        nextWindow: next ? next.label : null,
        opensAt: next ? next.start : null,
        message: manualOff
            ? "Tiffin ordering is paused right now. Please check back soon."
            : `Ordering opens ${nextIsTomorrow ? "tomorrow " : ""}at ${formatTime(next.start)} for ${next.label.toLowerCase()}`,
        windows: windowsOut,
    };
};
