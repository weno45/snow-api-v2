const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// POBIERANIE DANYCH Z RENDER
const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

// DEBUGOWANIE (zobaczymy to w logach Rendera)
if (!dbUrl) {
    console.error("BŁĄD: Zmienna TURSO_DATABASE_URL jest PUSTA!");
} else {
    console.log("URL bazy danych został wczytany (zaczyna się od: " + dbUrl.substring(0, 10) + "...)");
}

let db;
try {
    db = createClient({
        url: dbUrl || "",
        authToken: dbToken || ""
    });
} catch (e) {
    console.error("Błąd podczas tworzenia klienta Turso:", e.message);
}

app.get('/search', async (req, res) => {
    const { nick } = req.query;
    if (!nick) return res.status(400).json({ error: 'Brak nicku' });
    
    try {
        const result = await db.execute({
            sql: "SELECT nickname, ip FROM leaks WHERE LOWER(nickname) = LOWER(?)",
            args: [nick]
        });
        
        if (result.rows.length > 0) {
            const responseText = result.rows.map(row => `${row.nickname} ${row.ip}`).join('\n');
            res.set('Content-Type', 'text/plain; charset=utf-8');
            return res.send(responseText);
        } else {
            res.set('Content-Type', 'text/plain; charset=utf-8');
            return res.send('nie znaleziono gracza');
        }
    } catch (error) {
        console.error("Błąd zapytania:", error.message);
        res.status(500).send('Błąd bazy danych');
    }
});

app.get('/', (req, res) => res.json({ status: 'online' }));

app.listen(PORT, () => console.log(`Serwer na porcie ${PORT}`));
