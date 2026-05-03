// ARCH-04 FIX: Full date comparison instead of year-only
export const getCategoryByAge = (birthDateString) => {
    if (!birthDateString) return 'sub10'; // Fallback

    const birth = new Date(birthDateString + 'T00:00:00'); // Local timezone safe
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();

    // Adjust if birthday hasn't occurred yet this year
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age <= 6) return 'sub6';
    if (age <= 8) return 'sub8';
    if (age <= 10) return 'sub10';
    if (age <= 12) return 'sub12';
    if (age <= 14) return 'sub14';
    if (age <= 16) return 'sub16';
    return 'adultos';
};
