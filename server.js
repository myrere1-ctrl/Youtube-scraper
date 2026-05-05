require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/analyze', async (req, res) => {
  const { url, mode, lang } = req.body;
  if (!url) return res.status(400).json({ error: 'URL diperlukan' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum diset' });

  try {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(url, mode || 'full', lang || 'id') }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error ? data.error.message : 'Gemini error');
    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : null;
    if (!text) throw new Error('Tidak ada respons dari Gemini');
    res.json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', function(req, res) {
  res.json({ ok: true });
});

function buildPrompt(url, mode, lang) {
  var L = lang === 'id' ? 'Jawab SELURUHNYA dalam Bahasa Indonesia.' : 'Answer entirely in English.';
  var p = {
    full: L + '\n\nKamu analis YouTube profesional. Tonton & analisa video ini:\n' + url + '\n\n**1. RINGKASAN VIDEO**\nTopik, format, target audiens.\n\n**2. ANALISA HOOK**\nKekuatan, teknik, skor 1-10.\n\n**3. STRUKTUR KONTEN**\nBreakdown segmen.\n\n**4. KEKUATAN**\n3-5 hal yang dilakukan baik.\n\n**5. KELEMAHAN & PELUANG**\n3-5 hal yang bisa ditingkatkan.\n\n**6. ANALISA SEO**\nJudul, thumbnail, deskripsi, tags.\n\n**7. SKOR & REKOMENDASI**\nSkor 1-10 tiap aspek + top 3 action item.',
    hook: L + '\n\nAnalisa hook & opening:\n' + url + '\n\n**1. TIPE & EFEKTIVITAS HOOK**\nJenis, skor 1-10.\n\n**2. BREAKDOWN 30 DETIK PERTAMA**\nDetik per detik.\n\n**3. PSIKOLOGI HOOK**\nMengapa bekerja atau tidak.\n\n**4. 3 ALTERNATIF HOOK**\nVersi lebih powerful.\n\n**5. FORMULA HOOK**\nRumuskan agar bisa direplikasi.',
    script: L + '\n\nScript breakdown:\n' + url + '\n\n**1. STRUKTUR NARASI**\nTimeline per segmen.\n\n**2. GAYA BAHASA**\nTone, kecepatan, storytelling.\n\n**3. TRANSISI**\nEvaluasi perpindahan segmen.\n\n**4. PATTERN INTERRUPTS**\nMomen perubahan konten.\n\n**5. CTA**\nEvaluasi call to action.\n\n**6. TEMPLATE SCRIPT**\nOutline untuk video serupa.',
    seo: L + '\n\nAnalisa SEO:\n' + url + '\n\n**1. ANALISA JUDUL**\n5 alternatif lebih kuat.\n\n**2. THUMBNAIL**\nEvaluasi + CTR potential.\n\n**3. KEYWORDS**\nPrimary, secondary, long-tail.\n\n**4. TAGS**\n20 tags optimal.\n\n**5. DESKRIPSI BARU**\n300 kata dioptimasi.\n\n**6. SEO SCORE**\nSkor 1-10.',
    retention: L + '\n\nAnalisa retensi:\n' + url + '\n\n**1. PREDIKSI DROP-OFF**\nDi mana penonton keluar.\n\n**2. TEKNIK RETENSI**\nYang digunakan creator.\n\n**3. MOMEN KRITIS**\nTitik paling berisiko.\n\n**4. STRATEGI PERBAIKAN**\nPer segmen.\n\n**5. END SCREEN**\n20 detik terakhir.\n\n**6. RETENTION SCORE**\nSkor 1-10.',
    competitor: L + '\n\nStrategi konten:\n' + url + '\n\n**1. NICHE & POSITIONING**\nPosisi di pasar.\n\n**2. FORMAT KONTEN**\nMengapa berhasil.\n\n**3. 10 IDE VIDEO**\nDengan judul lengkap.\n\n**4. CONTENT GAPS**\nTopik belum dicovered.\n\n**5. DIFFERENTIATOR**\nCara lebih unik.\n\n**6. CONTENT CALENDAR**\nJadwal 4 minggu.'
  };
  return p[mode] || p.full;
}

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
