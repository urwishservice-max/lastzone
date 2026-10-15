$htmlPath = "e:\naveen\refrence\report_fullstack_cit.html"
$docxPath = "e:\naveen\docs\LastZone_FullStack_Report_DHARNIDHARAN_V.docx"
$docxRefPath = "e:\naveen\refrence\LastZone_FullStack_Report_DHARNIDHARAN_V.docx"

Write-Host "Initializing Microsoft Word COM Object..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    Write-Host "Opening HTML in Word: $htmlPath"
    $doc = $word.Documents.Open($htmlPath)
    
    # 16 = wdFormatXMLDocument (.docx)
    Write-Host "Saving as DOCX: $docxPath"
    $doc.SaveAs2($docxPath, 16)
    $doc.SaveAs2($docxRefPath, 16)
    
    $doc.Close()
    Write-Host "Successfully generated Word Document (.docx)!"
} catch {
    Write-Host "Error during Word export: $_"
} finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

if (Test-Path $docxPath) {
    $size = (Get-Item $docxPath).Length
    Write-Host "File verified: $docxPath (Size: $size bytes)"
}
