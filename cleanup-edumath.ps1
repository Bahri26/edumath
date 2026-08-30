# Edumath repo temizliği — çalıştırmadan önce okuyun, isterseniz satır satır elle de yapabilirsiniz.
# Repo kökünden çalıştırın: cd C:\Projects\edumath-main

# 1) Eski PDF-OCR pipeline'ını arşivle (SİLMİYOR, taşıyor — DB'de hâlâ eski kayıtlar
#    varsa referans/inceleme amacıyla saklanır). Yeni import işi artık
#    backend/scripts/import/importExtractedPatternQuestions.js üzerinden yürüyor.
New-Item -ItemType Directory -Force -Path backend\scripts\import\_archive-ocr-pdf-pipeline | Out-Null
$oldPipeline = @(
  'importPatternPdfPack.js','pdfQuestionExtractor.js','pdfRenderPages.py',
  'applyPatternPdfAnswerKeys.js','auditPatternPdfAssets.js','cropPatternPdfDiagramOnly.js',
  'exportPatternPdfReviewList.js','extractPdfRegionText.py','finalizePatternPdfAnswers.js',
  'fixAllPatternPdfQuestions.js','fixCriticalPatternQuestions.js','fixOnePatternQuestion.js',
  'geminiQuestionFromImage.js','patchPatternPdfEnrich.js','patternPdfQuality.js',
  'patternPdfRegionResolver.js','polishPatternPdfQuestions.js','recropPatternPdfPages.js',
  'repairPatternPdfVisualQuestions.js','syncPatternPdfAssets.js',
  'applyGrade5PatternCurated.js','grade5PatternCurated.js'
)
foreach ($f in $oldPipeline) {
  $src = "backend\scripts\import\$f"
  if (Test-Path $src) {
    git mv $src "backend\scripts\import\_archive-ocr-pdf-pipeline\$f"
  }
}

# NOT ETMEDİĞİM / DOKUNMADIĞIM (bunlar hâlâ aktif olabilir):
#   backend/scripts/import/migrateQuestionImagesToDrive.js
#   backend/scripts/import/uploadPatternSvgsToCloud.js
#   backend/scripts/import/uploadPatternSvgsToDrive.js
#   backend/scripts/import/importExtractedPatternQuestions.js  (yeni script)

# 2) Tez dosyalarını repo dışına taşı (git history'de eski halleri kalır, bu normal)
$tezArsivi = Join-Path (Split-Path (Get-Location) -Parent) 'edumath-tez-arsivi'
New-Item -ItemType Directory -Force -Path $tezArsivi | Out-Null
if (Test-Path 'tez_taslak.md')  { git mv tez_taslak.md  (Join-Path $tezArsivi 'tez_taslak.md') }
if (Test-Path 'tez_taslak.pdf') { Move-Item tez_taslak.pdf (Join-Path $tezArsivi 'tez_taslak.pdf') -Force }  # zaten gitignore'da
if (Test-Path 'scripts\build_juri_sunum.py') { git mv scripts\build_juri_sunum.py (Join-Path $tezArsivi 'build_juri_sunum.py') }
if (Test-Path 'scripts\md_to_pdf.py')        { git mv scripts\md_to_pdf.py        (Join-Path $tezArsivi 'md_to_pdf.py') }

# 3) tmp/ klasöründeki eski debug artefaktlarını sil (zaten gitignore'da, git'e hiç girmedi)
$tmpJunk = @('jwt.txt','oauth-compare-report.txt','oauth-compare.py','question-upload-result.json','smart-parse-gemini.json','smart-parse-result.json','test-kurdele.png')
foreach ($f in $tmpJunk) {
  $p = "tmp\$f"
  if (Test-Path $p) { Remove-Item -Force $p }
}

# check-env.ps1 zararsız bir tanı scripti — silmek yerine kalıcı bir yere taşı
if (Test-Path 'tmp\check-env.ps1') {
  New-Item -ItemType Directory -Force -Path backend\scripts\tools | Out-Null
  git mv tmp\check-env.ps1 backend\scripts\tools\check-env.ps1 2>$null
  if (Test-Path 'tmp\check-env.ps1') { Move-Item tmp\check-env.ps1 backend\scripts\tools\check-env.ps1 -Force }
}

Write-Output "Bitti. 'git status' ile değişiklikleri gözden geçirip commit edin."
