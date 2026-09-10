/**
 * Fieldora Unit Conversion & Normalization Utility
 * Standard base unit: kg (Kilograms)
 */
export const SUPPORTED_UNITS = ['kg', 'quintal', 'ton', 'tonne', 'crate', 'piece'];
// Conversion factors to kilograms
export const UNIT_TO_KG_MAP = {
    kg: 1,
    kilogram: 1,
    quintal: 100,
    qtl: 100,
    q: 100,
    ton: 1000,
    tonne: 1000,
    mt: 1000,
    crate: 25, // Standard wholesale agricultural crate (~25 kg)
    piece: 1,
    pc: 1
};
/**
 * Normalizes any supported unit to kilograms (kg).
 */
export function toKg(quantity, unit = 'kg') {
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) {
        return 0;
    }
    const cleanUnit = (unit || 'kg').toLowerCase().trim();
    const factor = UNIT_TO_KG_MAP[cleanUnit] || 1;
    return quantity * factor;
}
/**
 * Calculates a 0-100 quantity coverage score.
 * Example:
 * Buyer requires 1000 kg.
 * Farmer has 800 kg.
 * Score = (800 / 1000) * 100 = 80.
 * If farmer has >= 1000 kg, score is capped at 100.
 */
export function calculateQuantityScore(rfqQty, rfqUnit, listingQty, listingUnit) {
    const rfqInKg = toKg(rfqQty, rfqUnit);
    const listingInKg = toKg(listingQty, listingUnit);
    if (rfqInKg <= 0)
        return 0;
    if (listingInKg <= 0)
        return 0;
    const score = (listingInKg / rfqInKg) * 100;
    return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}
