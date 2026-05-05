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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(url, mode || 'full', lang || 'id') }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini error');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Tidak ada respons dari Gemini');
    res.json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

function buildPrompt(url, mode, lang) {
  const L = lang === 'id' ? 'Jawab SELURUHNYA dalam Bahasa Indonesia.' : 'Answer entirely in English.';
  const p = {
    full: `${L}\n\nKamu analis YouTube profesional. Tonton & analisa video ini:\n${url}\n\n**1. RINGKASAN VIDEO**\nTopik, format, target audiens.\n\n**2. ANALISA HOOK**\nKekuatan, teknik, skor 1-10.\n\n**3. STRUKTUR KONTEN**\nBreakdown segmen awal sampai akhir.\n\n**4. KEKUATAN**\n3-5 hal yang dilakukan baik.\n\n**5. KELEMAHAN & PELUANG**\n3-5 hal yang bisa ditingkatkan.\n\n**6. ANALISA SEO**\nJudul, thumbnail, deskripsi, tags.\n\n**7. STRATEGI RETENSI**\nTeknik menjaga penonton tetap nonton.\n\n**8. SKOR & REKOMENDASI**\nSkor 1-10 tiap aspek + top 3 action item.`,
    hook: `${L}\n\nAnalisa hook & opening video:\n${url}\n\n**1. TIPE & EFEKTIVITAS HOOK**\nJenis, skor 1-10, alasan.\n\n**2. BREAKDOWN 30 DETIK PERTAMA**\nDetik per detik visual & audio.\n\n**3. PSIKOLOGI HOOK**\nMengapa bekerja atau tidak.\n\n**4. 3 ALTERNATIF HOOK LEBIH KUAT**\nVersi yang lebih powerful.\n\n**5. FORMULA HOOK**\nRumuskan agar bisa direplikasi.`,
    script: `${L}\n\nScript breakdown video:\n${url}\n\n**1. STRUKTUR NARASI**\nTimeline per segmen dengan estimasi timestamp.\n\n**2. GAYA BAHASA**\nTone, kecepatan, storytelling.\n\n**3. TRANSISI**\nEvaluasi perpindahan segmen.\n\n**4. PATTERN INTERRUPTS**\nMomen perubahan konten.\n\n**5. CTA ANALYSIS**\nEvaluasi call to action.\n\n**6. TEMPLATE SCRIPT**\nOutline untuk video serupa.`,
    seo: `${L}\n\nAnalisa SEO mendalam:\n${url}\n\n**1. ANALISA JUDUL**\nJudul asli + 5 alternatif lebih kuat.\n\n**2. THUMBNAIL**\nEvaluasi + potensi CTR.\n\n**3. KEYWORDS**\nPrimary, 8 secondary, long-tail.\n\n**4. 20 TAGS OPTIMAL**\nDaftar tags terbaik.\n\n**5. DESKRIPSI BARU**\nTulis ulang 300 kata dioptimasi.\n\n**6. SEO SCORE**\nSkor 1-10 per komponen.`,
    retention: `${L}\n\nAnalisa retensi penonton:\n${url}\n\n**1. PREDIKSI DROP-OFF**\nDi mana & mengapa penonton keluar.\n\n**2. TEKNIK RETENSI**\nYang digunakan creator.\n\n**3. MOMEN KRITIS**\nTitik paling berisiko.\n\n**4. STRATEGI PERBAIKAN**\nPer segmen cara meningkatkan retensi.\n\n**5. END SCREEN**\nEvaluasi 20 detik terakhir.\n\n**6. RETENTION SCORE**\nSkor prediksi 1-10.`,
    competitor: `${L}\n\nStrategi konten berdasarkan video:\n${url}\n\n**1. NICHE & POSITIONING**\nPosisi creator di pasar.\n\n**2. FORMAT KONTEN**\nMengapa formatnya berhasil.\n\n**3. 10 IDE VIDEO SERUPA**\nDengan judul lengkap.\n\n**4. CONTENT GAPS**\nTopik belum dicovered tapi relevan.\n\n**5. DIFFERENTIATOR**\nCara membuat lebih unik & lebih baik.\n\n**6. CONTENT CALENDAR**\nJadwal konten 4 minggu.`
  };
  return p[mode] || p.full;
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
