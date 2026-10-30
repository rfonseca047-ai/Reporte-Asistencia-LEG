const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
  const dataBuffer = fs.readFileSync('public/assets/aistudio/REPORTE_ASISTENCIA_GRANT_9fad2132.pdf');
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  console.log('Result text length:', result?.text?.length || (typeof result === 'string' ? result.length : 'unknown'));
  fs.writeFileSync('extracted_pdf_text.txt', typeof result === 'string' ? result : JSON.stringify(result, null, 2));
}
main().catch(err => {
  console.error(err);
  // fallback check methods
  console.log(Object.getOwnPropertyNames(PDFParse.prototype));
});
