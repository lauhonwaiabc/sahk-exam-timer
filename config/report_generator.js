'use strict';
Sahk.register('ReportGenerator', function() {
  var REPORT_YEAR = 2026;
  var _mappingData = null;

  function loadMapping() {
    if (_mappingData) return _mappingData;
    _mappingData = {
      full_id_to_name: {}, full_id_to_fullname: {}, full_id_to_short: {},
      abbr_id_to_full: {}, abbr_id_to_name: {}, abbr_id_to_fullname: {},
      suffix_to_full: {}
    };
    if (typeof CANDIDATE_MAPPING !== 'undefined') {
      for (var fullId in CANDIDATE_MAPPING) {
        if (!CANDIDATE_MAPPING.hasOwnProperty(fullId)) continue;
        var info = CANDIDATE_MAPPING[fullId];
        _mappingData.full_id_to_name[fullId] = info.name;
        _mappingData.full_id_to_fullname[fullId] = info.fullName;
        _mappingData.full_id_to_short[fullId] = info.abbrId;
        var short = info.abbrId;
        _mappingData.abbr_id_to_full[short] = fullId;
        _mappingData.abbr_id_to_name[short] = info.name;
        _mappingData.abbr_id_to_fullname[short] = info.fullName;
        // Also register without leading zero for legacy data compatibility
        _mappingData.abbr_id_to_full[String(parseInt(short,10))] = fullId;
        _mappingData.abbr_id_to_name[String(parseInt(short,10))] = info.name;
        _mappingData.abbr_id_to_fullname[String(parseInt(short,10))] = info.fullName;
        _mappingData.suffix_to_full[fullId.slice(-2)] = fullId;
        _mappingData.suffix_to_full[fullId.slice(-3)] = fullId;
      }
    }
    return _mappingData;
  }

  function lookupName(cid) {
    var m = loadMapping(); cid = String(cid).trim();
    if (m.full_id_to_name[cid]) return { name: m.full_id_to_name[cid], fullName: m.full_id_to_fullname[cid], fullId: cid };
    for (var sl = 2; sl <= 4; sl++) {
      var suf = cid.slice(-sl);
      if (m.suffix_to_full[suf]) {
        var mapped = m.suffix_to_full[suf];
        return { name: m.full_id_to_name[mapped], fullName: m.full_id_to_fullname[mapped], fullId: mapped };
      }
    }
    return { name: cid, fullName: '', fullId: cid };
  }

  function lookupAbbr(abbr) {
    var m = loadMapping(); abbr = String(abbr).trim();
    if (m.abbr_id_to_name[abbr]) {
      return { name: m.abbr_id_to_name[abbr], fullName: m.abbr_id_to_fullname[abbr] || '', fullId: m.abbr_id_to_full[abbr] || abbr };
    }
    return { name: abbr, fullName: '', fullId: abbr };
  }

  function resolveCandidate(cid, examType) {
    if (examType === 'viva' || examType === 'osce') {
      var abbr = lookupAbbr(cid);
      if (abbr.fullName) return abbr;
      var name = lookupName(cid);
      if (name.fullName) return name;
      return { name: cid, fullName: '', fullId: cid };
    }
    var name = lookupName(cid);
    if (name.fullName) return name;
    var abbr = lookupAbbr(cid);
    if (abbr.fullName) return abbr;
    return { name: cid, fullName: '', fullId: cid };
  }

  // ── Statistics ──
  function mean(arr) { if (!arr.length) return 0; var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s / arr.length; }
  function stdDev(arr, m) {
    if (arr.length < 2) return 0; if (m === undefined) m = mean(arr);
    var sq = 0; for (var i = 0; i < arr.length; i++) sq += Math.pow(arr[i] - m, 2); return Math.sqrt(sq / (arr.length - 1));
  }
  function percentile(arr, p) {
    if (!arr.length) return 0; var sorted = arr.slice().sort(function(a, b) { return a - b; });
    var idx = (p / 100) * (sorted.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
  }
  function pearsonR(xArr, yArr) {
    var n = xArr.length; if (n < 3) return NaN;
    var mx = mean(xArr), my = mean(yArr), num = 0, dx2 = 0, dy2 = 0;
    for (var i = 0; i < n; i++) { var dx = xArr[i] - mx, dy = yArr[i] - my; num += dx * dy; dx2 += dx * dx; dy2 += dy * dy; }
    var den = Math.sqrt(dx2 * dy2); return den === 0 ? 0 : num / den;
  }

  // ── Score processing ──
  function processScores(scores) {
    var deduped = [], seen = {};
    for (var i = scores.length - 1; i >= 0; i--) {
      var s = scores[i], key = String(s.candidate).trim() + '|' + Number(s.station);
      if (!seen[key]) { seen[key] = true; deduped.unshift(s); }
    }
    return deduped;
  }
  function buildCandidateResults(scores) {
    var deduped = processScores(scores), candidates = {};
    for (var i = 0; i < deduped.length; i++) {
      var s = deduped[i], cid = String(s.candidate).trim(), st = Number(s.station);
      var sc = s.score === '-' ? null : Number(s.score); if (isNaN(sc)) sc = null;
      if (!candidates[cid]) candidates[cid] = { scores: {} };
      candidates[cid].scores[st] = sc;
    }
    return candidates;
  }
  function computeAdjustedTotal(candidate, expectedN) {
    var scores = candidate.scores, present = {};
    for (var st in scores) { if (scores.hasOwnProperty(st) && scores[st] !== null) present[st] = scores[st]; }
    var nPresent = Object.keys(present).length;
    if (nPresent === 0) return { adjusted: null, nPresent: 0, rawTotal: 0 };
    var rawTotal = 0; for (var k in present) { if (present.hasOwnProperty(k)) rawTotal += present[k]; }
    return { adjusted: Math.round(rawTotal / nPresent * expectedN), nPresent: nPresent, rawTotal: rawTotal };
  }
  function buildQStats(candidateResults, passThresh) {
    var qScores = {}, candidates = Object.keys(candidateResults);
    for (var i = 0; i < candidates.length; i++) {
      var cid = candidates[i], scores = candidateResults[cid].scores;
      for (var st in scores) { if (scores.hasOwnProperty(st) && scores[st] !== null) { if (!qScores[st]) qScores[st] = []; qScores[st].push(scores[st]); } }
    }
    var qStats = {};
    for (var s in qScores) {
      if (!qScores.hasOwnProperty(s)) continue;
      var scs = qScores[s], m = mean(scs), sd = stdDev(scs, m);
      var pr = scs.filter(function(x) { return x >= passThresh; }).length / scs.length * 100;
      var minS = Math.min.apply(null, scs), maxS = Math.max.apply(null, scs);
      var fp = scs.filter(function(x) { return x === minS; }).length / scs.length * 100;
      var cp = scs.filter(function(x) { return x === maxS; }).length / scs.length * 100;
      var itemScores = [], totalScores = [];
      for (var j = 0; j < candidates.length; j++) {
        var cid2 = candidates[j], d = candidateResults[cid2].scores;
        if (d[s] !== undefined && d[s] !== null) {
          itemScores.push(d[s]); var total = 0;
          for (var s2 in d) { if (d.hasOwnProperty(s2) && s2 !== s && d[s2] !== null) total += d[s2]; }
          totalScores.push(total);
        }
      }
      qStats[s] = { mean:m, std:sd, passRate:pr, min:minS, max:maxS, floorPct:fp, ceilingPct:cp, itemTotalR:pearsonR(itemScores, totalScores), n:scs.length };
    }
    return qStats;
  }
  function getAllStations(candidateResults) {
    var all = {}, cands = Object.keys(candidateResults);
    for (var i = 0; i < cands.length; i++) {
      var scores = candidateResults[cands[i]].scores;
      for (var st in scores) { if (scores.hasOwnProperty(st)) all[st] = true; }
    }
    return Object.keys(all).map(Number).sort(function(a, b) { return a - b; });
  }
  function getExamConfig(examId) {
    if (examId === 'written') return { title:'Paper I', itemName:'Question', expected:12, passPer:5, totalPass:60, maxScore:96, minScore:24, type:'written' };
    if (examId === 'viva_am' || examId === 'viva_pm') return { title:'Viva Examination', itemName:'Table', expected:6, passPer:5, totalPass:30, maxScore:48, minScore:12, type:'viva', batch:examId.replace('viva_','').toUpperCase() };
    if (examId === 'osce_am' || examId === 'osce_pm') return { title:'OSCE', itemName:'Station', expected:10, passPer:5, totalPass:50, maxScore:80, minScore:20, type:'osce', batch:examId.replace('osce_','').toUpperCase() };
    return { title:examId, itemName:'Station', expected:10, passPer:5, totalPass:50, maxScore:80, minScore:20, type:examId };
  }

  // ── Histogram → PNG base64 ──
  function drawHistogramCanvas(scores, candidateScore, passVal, width, height) {
    var c = document.createElement('canvas'); c.width = width * 2; c.height = height * 2;
    c.style.width = width + 'px'; c.style.height = height + 'px';
    var ctx = c.getContext('2d'); ctx.scale(2, 2);
    var m = { top: 25, right: 15, bottom: 30, left: 45 }, pw = width - m.left - m.right, ph = height - m.top - m.bottom;

    var uniq = [], freq = {};
    var minS = Math.min.apply(null, scores), maxS = Math.max.apply(null, scores);
    for (var v = minS; v <= maxS; v++) { uniq.push(v); freq[v] = 0; }
    for (var i = 0; i < scores.length; i++) { freq[scores[i]]++; }
    var nBars = uniq.length;
    if (nBars === 0) return c;
    var maxCount = Math.max.apply(null, Object.values(freq));
    var barW = Math.min(Math.floor(pw / nBars) - 2, 40);

    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(m.left, m.top); ctx.lineTo(m.left, m.top + ph); ctx.lineTo(m.left + pw, m.top + ph); ctx.stroke();

    for (var b = 0; b < nBars; b++) {
      var score = uniq[b], count = freq[score];
      var bh = (count / Math.max(maxCount, 1)) * ph;
      var bx = m.left + b * (pw / nBars) + (pw / nBars - barW) / 2;
      var by = m.top + ph - bh;
      ctx.fillStyle = '#4682B4'; ctx.globalAlpha = 0.7; ctx.fillRect(bx, by, barW, bh); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#333'; ctx.strokeRect(bx, by, barW, bh);
      if (count > 0) { ctx.fillStyle = '#333'; ctx.font = '10px Courier New'; ctx.textAlign = 'center'; ctx.fillText(count, bx + barW / 2, by - 4); }
      ctx.fillStyle = '#333'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
      ctx.fillText(score, bx + barW / 2, m.top + ph + 16);
    }
    if (passVal !== null) {
      var passIdx = -1, bestDist = Infinity;
      for (var bi = 0; bi < nBars; bi++) { var d = Math.abs(uniq[bi] - passVal); if (d < bestDist) { bestDist = d; passIdx = bi; } }
      if (passIdx >= 0) {
        var px = m.left + passIdx * (pw / nBars) + (pw / nBars) / 2;
        ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(px, m.top); ctx.lineTo(px, m.top + ph); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#2e7d32'; ctx.font = '9px Arial'; ctx.textAlign = 'center'; ctx.fillText('Pass(' + passVal + ')', px, m.top - 4);
      }
    }
    if (candidateScore !== null) {
      var candIdx = -1, bestDist2 = Infinity;
      for (var bi2 = 0; bi2 < nBars; bi2++) { var d2 = Math.abs(uniq[bi2] - candidateScore); if (d2 < bestDist2) { bestDist2 = d2; candIdx = bi2; } }
      if (candIdx >= 0) {
        var cx = m.left + candIdx * (pw / nBars) + (pw / nBars) / 2;
        ctx.strokeStyle = '#c62828'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, m.top); ctx.lineTo(cx, m.top + ph); ctx.stroke();
        ctx.fillStyle = '#c62828'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText(candidateScore, cx, m.top - 4);
      }
    }
    ctx.fillStyle = '#333'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('Score Distribution', width / 2, m.top - 6);
    ctx.save(); ctx.translate(12, m.top + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#333'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText('Count', 0, 0); ctx.restore();
    return c;
  }

  // ═════════════════════════════════════════════════════════════
  //  DOCX BUILDER (OOXML + JSZip)
  // ═════════════════════════════════════════════════════════════

  function cleanText(s) { return String(s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); }

  function escXml(s) { return cleanText(String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function p(text, opts) {
    opts = opts || {};
    var attrs = {};
    if (opts.align) attrs['w:jc'] = 'w:val="' + opts.align + '"';
    var pp = '<w:p><w:pPr>' + (attrs['w:jc'] ? '<w:jc ' + attrs['w:jc'] + '/>' : '') + '<w:spacing w:after="120"/>' + '</w:pPr>';
    var runs = [];
    if (opts.bold) { runs.push('<w:r><w:rPr><w:b/><w:sz w:val="' + ((opts.size || 11) * 2) + '"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/></w:rPr><w:t xml:space="preserve">' + escXml(String(text)) + '</w:t></w:r>'); }
    else { runs.push('<w:r><w:rPr><w:sz w:val="' + ((opts.size || 11) * 2) + '"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/></w:rPr><w:t xml:space="preserve">' + escXml(String(text)) + '</w:t></w:r>'); }
    return pp + runs.join('') + '</w:p>';
  }

  function emptyP() { return '<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>'; }

  function pageBreak() { return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'; }

  function boldP(text, size, align) { return p(text, { bold: true, size: size || 11, align: align }); }

  function makeTable(headers, rows, colWidths) {
    var xml = '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:left w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:right w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="999999"/></w:tblBorders></w:tblPr><w:tblGrid>';
    var colCount = headers && headers.length > 0 ? headers.length : (rows.length > 0 ? rows[0].length : 2);
    for (var hi = 0; hi < colCount; hi++) { xml += '<w:gridCol w:w="' + Math.round(9000 / colCount) + '"/>'; }
    xml += '</w:tblGrid>';

    if (headers && headers.length > 0 && headers.some(function(h) { return h !== ''; })) {
      xml += '<w:tr>';
      for (var h = 0; h < headers.length; h++) {
        xml += '<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1b5e20"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="18"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">' + escXml(String(headers[h])) + '</w:t></w:r></w:p></w:tc>';
      }
      xml += '</w:tr>';
    }

    for (var ri = 0; ri < rows.length; ri++) {
      xml += '<w:tr>';
      for (var ci = 0; ci < rows[ri].length; ci++) {
        var cell = rows[ri][ci];
        var cellVal = cell.text || '', cellBold = cell.bold || false;
        var cellColor = cell.color || '000000', cellBg = cell.bg || 'auto', cellSize = cell.size || 18;
        xml += '<w:tc><w:tcPr>' + (cellBg !== 'auto' ? '<w:shd w:val="clear" w:color="auto" w:fill="' + cellBg + '"/>' : '') + '<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr>' + (cellBold ? '<w:b/>' : '') + '<w:color w:val="' + cellColor + '"/><w:sz w:val="' + cellSize + '"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">' + escXml(String(cellVal)) + '</w:t></w:r></w:p></w:tc>';
      }
      xml += '</w:tr>';
    }
    xml += '</w:tbl>';
    return xml;
  }

  // ── Build DOCX zip ──
  function buildDocx(xmlBody, images) {
    // images: array of { id, base64, widthEmu, heightEmu }
    var zip = new JSZip();

    var ctXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>';
    if (images.length > 0) ctXml += '<Default Extension="png" ContentType="image/png"/>';
    ctXml += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
    zip.file('[Content_Types].xml', ctXml);

    zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>');

    // Build document rels
    var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    for (var j = 0; j < images.length; j++) {
      docRels += '<Relationship Id="rId' + (j + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image' + (j + 1) + '.png"/>';
    }
    docRels += '</Relationships>';
    var wf = zip.folder('word');
    wf.folder('_rels').file('document.xml.rels', docRels);

    // Add images
    if (images.length > 0) {
      var mediaFolder = wf.folder('media');
      for (var k = 0; k < images.length; k++) {
        var base64 = images[k].base64;
        if (base64.indexOf(',') !== -1) base64 = base64.split(',')[1];
        mediaFolder.file('image' + (k + 1) + '.png', base64, { base64: true });
      }
    }

    // Document XML
    var docX = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" ' +
      'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
      'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ' +
      'xmlns:v="urn:schemas-microsoft-com:vml" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      'xmlns:w10="urn:schemas-microsoft-com:office:word" ' +
      'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<w:body>' + xmlBody + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="0" w:footer="0"/></w:sectPr>' +
      '</w:body></w:document>';
    wf.file('document.xml', docX);

    return zip;
  }

  // ── Image embedding helper ──
  function canvasToImageEl(canvas, imgId, widthEmu, heightEmu) {
    var dataUrl = canvas.toDataURL('image/png');
    return {
      id: imgId,
      base64: dataUrl,
      widthEmu: widthEmu,
      heightEmu: heightEmu,
      xml: '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
        '<wp:extent cx="' + widthEmu + '" cy="' + heightEmu + '"/>' +
        '<wp:docPr id="' + imgId + '" name="chart' + imgId + '.png"/>' +
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic><pic:nvPicPr><pic:cNvPr id="' + imgId + '" name="chart' + imgId + '.png"/>' +
        '<pic:cNvPicPr/></pic:nvPicPr><pic:blipFill>' +
        '<a:blip r:embed="rId' + imgId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + widthEmu + '" cy="' + heightEmu + '"/></a:xfrm>' +
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
    };
  }

  // ═════════════════════════════════════════════════════════════
  //  CANDIDATE REPORT
  // ═════════════════════════════════════════════════════════════
  function buildCandidateReportXml(examId, scores) {
    var cfg = getExamConfig(examId);
    cfg.batch = cfg.batch || undefined;
    return buildCandidateReportXmlRaw(cfg, scores);
  }

  function buildCandidateReportXmlRaw(cfg, scores) {
    var candidateResults = buildCandidateResults(scores);
    var candidates = Object.keys(candidateResults);
    if (!candidates.length) return { xml: '<w:p><w:r><w:t>No scores available.</w:t></w:r></w:p>', images: [] };

    var summary = {};
    for (var c = 0; c < candidates.length; c++) {
      var cid = candidates[c];
      var adjR = computeAdjustedTotal(candidateResults[cid], cfg.expected);
      summary[cid] = { adjusted: adjR.adjusted, nPresent: adjR.nPresent, details: candidateResults[cid] };
    }
    var allAdj = [];
    for (var cid2 in summary) { if (summary.hasOwnProperty(cid2) && summary[cid2].adjusted !== null) allAdj.push(summary[cid2].adjusted); }
    var overallMean = mean(allAdj), overallStd = stdDev(allAdj, overallMean);
    var qStats = buildQStats(candidateResults, cfg.passPer);
    var allStations = getAllStations(candidateResults);
    var sorted = candidates.slice();
    if (cfg.type === 'viva' || cfg.type === 'osce') { sorted.sort(function(a, b) { return (parseInt(a) || 0) - (parseInt(b) || 0); }); }
    else { sorted.sort(); }
    var images = [], imgId = 0;
    var xml = '';

    for (var idx = 0; idx < sorted.length; idx++) {
      if (idx > 0) xml += pageBreak();
      xml += boldP('SAHK Final Examination Preparation Course ' + REPORT_YEAR + ' - ' + cfg.title, 14, 'center');
      xml += boldP('Candidate Report' + (cfg.batch ? ' (' + cfg.batch + ')' : ''), 12, 'center');
      xml += emptyP();
      var cid3 = sorted[idx], v = summary[cid3];
      var np = resolveCandidate(cid3, cfg.type);

      // Candidate info table
      xml += makeTable(['', ''], [
        [{text:'Candidate ID',bold:true},{text:np.fullId}],
        [{text:'Name',bold:true},{text:np.name}],
        [{text:'Full Name',bold:true},{text:np.fullName}]
      ]);
      xml += emptyP();

      // Score summary
      var passed = v.adjusted !== null && v.adjusted >= cfg.totalPass;
      var pctStr = '- / - / - / - / -';
      if (allAdj.length > 0) {
        var p25 = percentile(allAdj, 25), p50 = percentile(allAdj, 50), p75 = percentile(allAdj, 75);
        var pmin = Math.min.apply(null, allAdj), pmax = Math.max.apply(null, allAdj);
        pctStr = pmin.toFixed(0) + ' / ' + p25.toFixed(1) + ' / ' + p50.toFixed(1) + ' / ' + p75.toFixed(1) + ' / ' + pmax.toFixed(0);
      }
      var passColor = passed ? '2e7d32' : 'c62828';
      xml += makeTable(['', ''], [
        [{text:'Overall Result',bold:true},{text:passed?'PASS':'FAIL',bold:true,color:passColor,size:24}],
        [{text:'Total Score',bold:true},{text:v.adjusted!==null?String(v.adjusted):'N/A',bold:true,size:24}],
        [{text:'Passing Score (Range)',bold:true},{text:cfg.totalPass+' ('+cfg.minScore+'-'+cfg.maxScore+')'}],
        [{text:'Mean (\u00b1SD)',bold:true},{text:overallMean.toFixed(2)+' (\u00b1 '+overallStd.toFixed(2)+')'}],
        [{text:'Min/25%/Med/75%/Max',bold:true},{text:pctStr}]
      ]);
      xml += emptyP();

      // Item scores
      var itemHeaders = [cfg.itemName, 'Score', 'Pass/Fail', 'Mean (\u00b1SD)', 'Pass Rate'];
      var itemRows = [];
      for (var si = 0; si < allStations.length; si++) {
        var st = allStations[si], sc = candidateResults[cid3].scores[st];
        var qs = qStats[st] || { mean:0, std:0, passRate:0 };
        var scoreDisp = sc !== null && sc !== undefined ? String(sc) : '-';
        var pfText = '-', pfColor = '000000';
        if (sc !== null && sc !== undefined) { pfText = sc >= cfg.passPer ? 'PASS' : 'FAIL'; pfColor = sc >= cfg.passPer ? '2e7d32' : 'c62828'; }
        itemRows.push([
          {text:cfg.itemName+' '+st},{text:scoreDisp},
          {text:pfText,bold:true,color:pfColor},
          {text:qs.mean.toFixed(2)+' (\u00b1 '+qs.std.toFixed(2)+')'},
          {text:qs.passRate.toFixed(1)+'%'}
        ]);
      }
      xml += makeTable(itemHeaders, itemRows);
      xml += emptyP();

      // Histogram
      imgId++;
      var canvas = drawHistogramCanvas(allAdj, v.adjusted, cfg.totalPass, 500, 180);
      var img = canvasToImageEl(canvas, imgId, 5040000, 1814400);
      images.push(img);
      xml += img.xml;
    }
    return { xml: xml, images: images };
  }

  // ═════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═════════════════════════════════════════════════════════════
  function triggerDownload(zip, filename) {
    zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }).then(function(blob) {
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  async function generateReport(examId) {
    try {
      var scoresModule = Sahk.get('Scoring');
      if (!scoresModule) { alert('Scoring module not loaded.'); return; }
      if (scoresModule.examId !== examId) { alert('Exam mismatch. Please reload.'); return; }

      await scoresModule.fetchAllScores();
      var scores = scoresModule.allScoresCache;
      if (!scores || !scores.length) { alert('No scores available.'); return; }

      var result = buildCandidateReportXml(examId, scores);
      var zip = buildDocx(result.xml, result.images);
      triggerDownload(zip, examId + '_candidate_report.docx');

      var s = document.getElementById('adminStatus');
      if (s) { s.textContent = 'Report downloaded.'; s.style.color = '#2e7d32'; }
    } catch (e) {
      console.error(e);
      var s2 = document.getElementById('adminStatus');
      if (s2) { s2.textContent = 'Failed: ' + e.message; s2.style.color = '#c62828'; }
    }
  }

  // ═════════════════════════════════════════════════════════════
  //  COMBINED ALL-SESSIONS REPORT (viva / osce only)
  // ═════════════════════════════════════════════════════════════
  function buildCombinedReportXml(cfg, mergedScores) {
    // mergedScores: simply concat scores1 + scores2, dedup by candidate+station (latest wins)
    return buildCandidateReportXmlRaw(cfg, mergedScores);
  }

  function buildCandidateReportXmlRaw(cfg, scores) {
    var candidateResults = buildCandidateResults(scores);
    var candidates = Object.keys(candidateResults);
    if (!candidates.length) return { xml: '<w:p><w:r><w:t>No scores available.</w:t></w:r></w:p>', images: [] };

    var summary = {};
    for (var c = 0; c < candidates.length; c++) {
      var cid = candidates[c];
      var adjR = computeAdjustedTotal(candidateResults[cid], cfg.expected);
      summary[cid] = { adjusted: adjR.adjusted, nPresent: adjR.nPresent, details: candidateResults[cid] };
    }
    var allAdj = [];
    for (var cid2 in summary) { if (summary.hasOwnProperty(cid2) && summary[cid2].adjusted !== null) allAdj.push(summary[cid2].adjusted); }
    var overallMean = mean(allAdj), overallStd = stdDev(allAdj, overallMean);
    var qStats = buildQStats(candidateResults, cfg.passPer);
    var allStations = getAllStations(candidateResults);
    var sorted = candidates.slice();
    if (cfg.type === 'viva' || cfg.type === 'osce') { sorted.sort(function(a, b) { return (parseInt(a) || 0) - (parseInt(b) || 0); }); }
    else { sorted.sort(); }
    var images = [], imgId = 0;
    var xml = '';

    for (var idx = 0; idx < sorted.length; idx++) {
      if (idx > 0) xml += pageBreak();
      xml += boldP('SAHK Final Examination Preparation Course ' + REPORT_YEAR + ' - ' + cfg.title, 14, 'center');
      xml += boldP('Candidate Report' + (cfg.batch ? ' (' + cfg.batch + ')' : ''), 12, 'center');
      xml += emptyP();
      var cid3 = sorted[idx], v = summary[cid3];
      var np = resolveCandidate(cid3, cfg.type);
      xml += makeTable(['', ''], [
        [{text:'Candidate ID',bold:true},{text:np.fullId}],
        [{text:'Name',bold:true},{text:np.name}],
        [{text:'Full Name',bold:true},{text:np.fullName}]
      ]);
      xml += emptyP();
      var passed = v.adjusted !== null && v.adjusted >= cfg.totalPass;
      var pctStr = '- / - / - / - / -';
      if (allAdj.length > 0) {
        var p25 = percentile(allAdj, 25), p50 = percentile(allAdj, 50), p75 = percentile(allAdj, 75);
        var pmin = Math.min.apply(null, allAdj), pmax = Math.max.apply(null, allAdj);
        pctStr = pmin.toFixed(0) + ' / ' + p25.toFixed(1) + ' / ' + p50.toFixed(1) + ' / ' + p75.toFixed(1) + ' / ' + pmax.toFixed(0);
      }
      var passColor = passed ? '2e7d32' : 'c62828';
      xml += makeTable(['', ''], [
        [{text:'Overall Result',bold:true},{text:passed?'PASS':'FAIL',bold:true,color:passColor,size:24}],
        [{text:'Total Score',bold:true},{text:v.adjusted!==null?String(v.adjusted):'N/A',bold:true,size:24}],
        [{text:'Passing Score (Range)',bold:true},{text:cfg.totalPass+' ('+cfg.minScore+'-'+cfg.maxScore+')'}],
        [{text:'Mean (\u00b1SD)',bold:true},{text:overallMean.toFixed(2)+' (\u00b1 '+overallStd.toFixed(2)+')'}],
        [{text:'Min/25%/Med/75%/Max',bold:true},{text:pctStr}]
      ]);
      xml += emptyP();
      var itemHeaders = [cfg.itemName, 'Score', 'Pass/Fail', 'Mean (\u00b1SD)', 'Pass Rate'];
      var itemRows = [];
      for (var si = 0; si < allStations.length; si++) {
        var st = allStations[si], sc = candidateResults[cid3].scores[st];
        var qs = qStats[st] || { mean:0, std:0, passRate:0 };
        var scoreDisp = sc !== null && sc !== undefined ? String(sc) : '-';
        var pfText = '-', pfColor = '000000';
        if (sc !== null && sc !== undefined) { pfText = sc >= cfg.passPer ? 'PASS' : 'FAIL'; pfColor = sc >= cfg.passPer ? '2e7d32' : 'c62828'; }
        itemRows.push([
          {text:cfg.itemName+' '+st},{text:scoreDisp},
          {text:pfText,bold:true,color:pfColor},
          {text:qs.mean.toFixed(2)+' (\u00b1 '+qs.std.toFixed(2)+')'},
          {text:qs.passRate.toFixed(1)+'%'}
        ]);
      }
      xml += makeTable(itemHeaders, itemRows);
      xml += emptyP();
      imgId++;
      var canvas = drawHistogramCanvas(allAdj, v.adjusted, cfg.totalPass, 500, 180);
      var img = canvasToImageEl(canvas, imgId, 5040000, 1814400);
      images.push(img);
      xml += img.xml;
    }
    return { xml: xml, images: images };
  }

  async function fetchScoresForExam(exam) {
    var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'https://us-central1-sahk-timer.cloudfunctions.net/app';
    try {
      var r = await fetch(API_BASE + '/scores/' + exam);
      if (r.ok) {
        var data = await r.json();
        console.log('Fetched ' + data.length + ' scores for ' + exam);
        return data;
      }
      console.warn('Fetch failed for ' + exam + ': HTTP ' + r.status);
    } catch (err) {
      console.error('Fetch error for ' + exam + ': ' + err.message);
    }
    return [];
  }

  async function generateCombinedReport(exam1, exam2) {
    try {
      var scores1 = await fetchScoresForExam(exam1);
      var scores2 = await fetchScoresForExam(exam2);
      console.log('Combined report: ' + exam1 + ' = ' + scores1.length + ' scores, ' + exam2 + ' = ' + scores2.length + ' scores');
      if (!scores1.length && !scores2.length) { alert('No scores available for either session.'); return; }
      if (!scores2.length) console.warn('No scores found for ' + exam2 + '. Only ' + exam1 + ' data used.');
      if (!scores1.length) console.warn('No scores found for ' + exam1 + '. Only ' + exam2 + ' data used.');

      var all = scores1.concat(scores2);
      all.sort(function(a, b) { return (a.timestamp||'').localeCompare(b.timestamp||''); });
      var deduped = [], seen = {};
      for (var i = all.length - 1; i >= 0; i--) {
        var s = all[i], key = String(s.candidate).trim() + '|' + Number(s.station);
        if (!seen[key]) { seen[key] = true; deduped.unshift(s); }
      }
      console.log('Combined deduped: ' + deduped.length + ' scores, unique candidates: ' + Object.keys(buildCandidateResults(deduped)).length);

      var cfg = getExamConfig(exam1);
      cfg.batch = 'All Sessions';
      var result = buildCombinedReportXml(cfg, deduped);
      var zip = buildDocx(result.xml, result.images);
      var prefix = exam1.replace('_am','').replace('_pm','');
      triggerDownload(zip, prefix + '_all_sessions_report.docx');

      var s = document.getElementById('adminStatus');
      var s1n = exam1.replace('osce_','OSCE ').replace('viva_','Viva ');
      var s2n = exam2.replace('osce_','OSCE ').replace('viva_','Viva ');
      if (s) { s.textContent = 'All Sessions: ' + scores1.length + ' (' + s1n + ') + ' + scores2.length + ' (' + s2n + ') scores'; s.style.color = '#2e7d32'; }
    } catch (e) {
      console.error(e);
      var s2 = document.getElementById('adminStatus');
      if (s2) { s2.textContent = 'Failed: ' + e.message; s2.style.color = '#c62828'; }
    }
  }

  return { generateReport: generateReport, generateCombinedReport: generateCombinedReport };
});
window.SahkReportGenerator = Sahk.get('ReportGenerator');
