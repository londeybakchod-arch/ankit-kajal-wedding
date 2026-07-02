// Force the server to serve index.html for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const WISHES_FILE = path.join(DATA_DIR, 'wishes.json');
const RSVP_FILE = path.join(DATA_DIR, 'rsvp.json');

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Read error:', e);
    return [];
  }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

if (!fs.existsSync(WISHES_FILE)) {
  writeJSON(WISHES_FILE, [
    {
      id: 1,
      name: "Brij Mohan Singh & Maheswari Devi",
      text: "Our hearts are full of joy! May you both be blessed with a lifetime of love and happiness. 🙏",
      date: new Date().toISOString()
    },
    {
      id: 2,
      name: "Gajendra Singh & Heema Devi",
      text: "Kajal beti, may your new journey be filled with love, laughter and the blessings of the mountains.",
      date: new Date().toISOString()
    },
    {
      id: 3,
      name: "Family & Friends",
      text: "Wishing Ankit & Kajal a beautiful married life ahead! Can't wait to dance to the Dhol-Damau 🥁💃",
      date: new Date().toISOString()
    }
  ]);
}

/* ================= WISHES API ================= */
app.get('/api/wishes', (req, res) => {
  const wishes = readJSON(WISHES_FILE);
  res.json(wishes.slice().reverse());
});

app.post('/api/wishes', (req, res) => {
  const { name, text } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and message are required' });

  const wishes = readJSON(WISHES_FILE);
  const newWish = {
    id: Date.now(),
    name: String(name).trim().slice(0, 80),
    text: String(text).trim().slice(0, 400),
    date: new Date().toISOString()
  };
  wishes.push(newWish);
  writeJSON(WISHES_FILE, wishes);
  res.json({ success: true, wish: newWish });
});

/* ================= RSVP API ================= */
app.post('/api/rsvp', (req, res) => {
  const { name, phone, guests, functions, message } = req.body;

  if (!name || !phone || !guests || !Array.isArray(functions) || functions.length === 0) {
    return res.status(400).json({ error: 'Please fill all required fields and select at least one function.' });
  }

  const rsvps = readJSON(RSVP_FILE);
  const newRsvp = {
    id: Date.now(),
    name: String(name).trim().slice(0, 80),
    phone: String(phone).trim().slice(0, 20),
    guests: Number(guests) || 1,
    functions,
    message: message ? String(message).trim().slice(0, 300) : '',
    date: new Date().toISOString()
  };
  rsvps.push(newRsvp);
  writeJSON(RSVP_FILE, rsvps);
  res.json({ success: true, rsvp: newRsvp });
});

app.get('/api/rsvp', (req, res) => {
  res.json(readJSON(RSVP_FILE));
});

app.get('/api/rsvp/summary', (req, res) => {
  const rsvps = readJSON(RSVP_FILE);
  const totalGuests = rsvps.reduce((sum, r) => sum + Number(r.guests || 0), 0);
  const perFunction = {};
  rsvps.forEach(r => {
    (r.functions || []).forEach(f => {
      perFunction[f] = (perFunction[f] || 0) + Number(r.guests || 0);
    });
  });
  res.json({ totalResponses: rsvps.length, totalGuests, perFunction, list: rsvps });
});

app.listen(PORT, () => {
  console.log(`🏔️  Ankit & Kajal's Wedding Site running at http://localhost:${PORT}`);
});