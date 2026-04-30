export const getCategoryByAge = (birthDateString) => {
    if (!birthDateString) return 'sub10'; // Fallback
    const age = new Date().getFullYear() - new Date(birthDateString).getFullYear();
    
    if (age <= 6) return 'sub6';
    if (age <= 8) return 'sub8';
    if (age <= 10) return 'sub10';
    if (age <= 12) return 'sub12';
    if (age <= 14) return 'sub14';
    if (age <= 16) return 'sub16';
    return 'adultos';
};
