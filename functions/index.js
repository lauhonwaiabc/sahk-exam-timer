'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin privileges required' });
    }
    req.user = decoded;
    next();
  } catch (e) {
    console.error('Token verification failed:', e);
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Submit score (single or batch)
app.post('/scores', async (req, res) => {
  try {
    const body = req.body;
    if (Array.isArray(body)) {
      if (!body.every(function(s) { return s.exam && s.candidate && s.station != null && s.identifier; })) {
        return res.status(400).json({ error: 'Missing required fields in one or more entries' });
      }
      const batch = db.batch();
      const records = [];
      body.forEach(function(entry) {
        const ref = db.collection('scores').doc();
        const record = {
          exam: entry.exam,
          timestamp: new Date().toISOString(),
          identifier: entry.identifier,
          candidate: String(entry.candidate),
          station: Number(entry.station),
          score: entry.score === '-' ? '-' : Number(entry.score)
        };
        batch.set(ref, record);
        records.push({ id: ref.id, ...record });
      });
      await batch.commit();
      return res.json({ success: true, count: body.length, records });
    }

    const { exam, candidate, station, score, identifier } = body;

    if (!exam || !candidate || station === undefined || station === null || !identifier) {
      return res.status(400).json({ error: 'Missing required fields: exam, candidate, station, identifier' });
    }

    const validScores = [2, 3, 4, 5, 6, 7, 8];
    if (score !== '-' && !validScores.includes(Number(score))) {
      return res.status(400).json({ error: 'Invalid score. Must be -, 2, 3, 4, 5, 6, 7, or 8' });
    }

    const ref = db.collection('scores').doc();
    const record = {
      exam,
      timestamp: new Date().toISOString(),
      identifier,
      candidate: String(candidate),
      station: Number(station),
      score: score === '-' ? '-' : Number(score)
    };
    await ref.set(record);

    res.json({ success: true, record: { id: ref.id, ...record } });
  } catch (e) {
    console.error('Error submitting score:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all scores for an exam
app.get('/scores/:exam', async (req, res) => {
  try {
    const snapshot = await db.collection('scores')
      .where('exam', '==', req.params.exam)
      .get();
    const scores = [];
    snapshot.forEach(doc => {
      scores.push({ id: doc.id, ...doc.data() });
    });
    scores.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    res.json(scores);
  } catch (e) {
    console.error('Error getting scores:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest scores for a specific station
app.get('/scores/:exam/station/:station', async (req, res) => {
  try {
    const snapshot = await db.collection('scores')
      .where('exam', '==', req.params.exam)
      .where('station', '==', Number(req.params.station))
      .get();

    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const latestMap = {};
    items.forEach(s => {
      latestMap[s.candidate] = s;
    });

    res.json(Object.values(latestMap));
  } catch (e) {
    console.error('Error getting station scores:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest score for a candidate at a station
app.get('/scores/:exam/:candidate/:station', async (req, res) => {
  try {
    const snapshot = await db.collection('scores')
      .where('exam', '==', req.params.exam)
      .where('candidate', '==', String(req.params.candidate))
      .where('station', '==', Number(req.params.station))
      .get();

    if (snapshot.empty) {
      return res.json(null);
    }

    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    res.json(items[0]);
  } catch (e) {
    console.error('Error getting candidate score:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function deleteQuerySnapshot(snapshot) {
  const batchSize = 500;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

// Clear all scores for a specific exam (admin only)
app.delete('/scores/:exam', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('scores')
      .where('exam', '==', req.params.exam)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, message: `Cleared scores for ${req.params.exam}`, count: 0 });
    }

    await deleteQuerySnapshot(snapshot);
    res.json({ success: true, message: `Cleared scores for ${req.params.exam}`, count: snapshot.size });
  } catch (e) {
    console.error('Error clearing exam scores:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Factory reset - clear all scores (admin only)
app.delete('/scores', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('scores').get();

    if (snapshot.empty) {
      return res.json({ success: true, message: 'All scores cleared (factory reset)', count: 0 });
    }

    await deleteQuerySnapshot(snapshot);
    res.json({ success: true, message: 'All scores cleared (factory reset)', count: snapshot.size });
  } catch (e) {
    console.error('Error clearing all scores:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export scores as CSV (admin only)
app.get('/export/:exam', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('scores')
      .where('exam', '==', req.params.exam)
      .get();

    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const headers = ['Exam', 'Timestamp', 'Identifier', 'Candidate', 'Station', 'Score'];
    const rows = items.map(s => [s.exam, s.timestamp, s.identifier, s.candidate, s.station, s.score]);

    const csv = [headers.join(',')]
      .concat(rows.map(r => r.map(v => `"${v}"`).join(',')))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.exam}_scores.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('Error exporting scores:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

exports.app = functions.https.onRequest(app);
