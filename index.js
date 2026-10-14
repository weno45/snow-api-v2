const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Łączymy się z bazą danych
// Upewnij się, że na Renderze nazwy kluczy są IDENTYCZNE jak te poniżej
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

app.get('/search', async (req, res) => {
    const { nick } = req.query;
    if (!nick) return res.status(400).json({ error: 'Brak nicku' });
    
    // Sprawdzamy, czy połączenie istnieje
    if (!db) {
        return res.status(500).send('Błąd: Serwer nie mógł połączyć się z bazą danych (brak obiektu db)');
    }

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
        console.error("Błąd podczas szukania:", error);
        // Jeśli tu trafimy, sprawdzamy czy tabela w ogóle istnieje
        if (error.message.includes("no such table")) {
            return res.status(500).send("Błąd: Tabela 'leaks' nie istnieje w bazie danych. Uruchom wgraj.js na komputerze.");
        }
        res.status(500).send('Błąd bazy danych: ' + error.message);
    }
});

app.get('/', (req, res) => res.json({ status: 'online' }));

app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
