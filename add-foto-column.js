// Script untuk menambahkan kolom foto ke tabel siswa
const db = require('./src/database/database.js');

const addFotoColumn = `
ALTER TABLE siswa ADD COLUMN foto TEXT;
`;

db.run(addFotoColumn, (err) => {
    if (err) {
        // Kolom mungkin sudah ada, jadi ini tidak selalu error
        console.log("Info: Kolom 'foto' mungkin sudah ada atau error:", err.message);
    } else {
        console.log("Kolom 'foto' berhasil ditambahkan ke tabel siswa.");
    }
    
    db.close((err) => {
        if (err) console.error("Error closing database:", err.message);
        else console.log("Database connection closed.");
    });
});