const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('extracted_pdf_text.txt', 'utf8'));

// Concatenate text from all pages
let fullText = '';
for (const p of raw.pages) {
  fullText += '\n' + p.text;
}

const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

const records = [];
let idCounter = 1;

for (const line of lines) {
  if (line.startsWith('SEMANA') || line.includes('-- ') || line.length < 10) {
    continue;
  }

  // Regex to match:
  // SEMANA: (\d+)
  // DIA: (\w+)
  // INGRESO: (\d{1,2}/\d{1,2}/\d{4} \d{2}:\d{2})
  // SALIDA: (\d{1,2}/\d{1,2}/\d{4} \d{2}:\d{2})
  // REST: contains NOMBRE, HORAS, and OBSERVACIONES
  const match = line.match(/^(\d+)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{2}:\d{2})\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{2}:\d{2})\s+(.+)$/);
  
  if (!match) {
    console.log('Unmatched line:', line);
    continue;
  }

  const week = parseInt(match[1], 10);
  const dayOfWeek = match[2].toLowerCase();
  const entryDate = match[3];
  const exitDate = match[4];
  const rest = match[5].trim();

  // Find employee name: ENRIQUE GRANT, LUIS E. GRANT (HIJO), or LUIS E. GRANT
  let employeeName = '';
  let restAfterName = '';

  if (rest.includes('LUIS E. GRANT (HIJO)')) {
    employeeName = 'LUIS E. GRANT'; // standard employee name for filtering / display
    restAfterName = rest.substring(rest.indexOf('LUIS E. GRANT (HIJO)') + 'LUIS E. GRANT (HIJO)'.length).trim();
  } else if (rest.includes('LUIS E. GRANT')) {
    employeeName = 'LUIS E. GRANT';
    restAfterName = rest.substring(rest.indexOf('LUIS E. GRANT') + 'LUIS E. GRANT'.length).trim();
  } else if (rest.includes('ENRIQUE GRANT')) {
    employeeName = 'ENRIQUE GRANT';
    restAfterName = rest.substring(rest.indexOf('ENRIQUE GRANT') + 'ENRIQUE GRANT'.length).trim();
  } else {
    console.log('Unknown employee in:', rest);
    continue;
  }

  // restAfterName contains HORAS and optional OBSERVACIONES
  // e.g. "3,87 PREDIO 2" or "0,00 NO HAY DATOS" or "0,21" or "3,00"
  const hoursMatch = restAfterName.match(/^([\d]+[.,][\d]{2})(.*)$/);
  let totalHours = 0;
  let observations = '';

  if (hoursMatch) {
    totalHours = parseFloat(hoursMatch[1].replace(',', '.'));
    observations = hoursMatch[2].trim();
  } else {
    observations = restAfterName;
  }

  let predio = 'Predio 3';
  if (observations.toUpperCase().includes('PREDIO 2')) {
    predio = 'Predio 2';
  } else if (observations.toUpperCase().includes('PREDIO 1')) {
    predio = 'Predio 1';
  } else if (observations.toUpperCase().includes('PREDIO 3')) {
    predio = 'Predio 3';
  }

  // Determine status
  let status = 'COMPLETADO';
  if (observations.includes('NO HAY DATOS') || observations.includes('NO HAY REGISTROS')) {
    status = 'PENDIENTE';
  } else if (observations.includes('LIBRE') || observations.includes('FERIADO') || observations.includes('TRABAJO EN CARTAGO')) {
    status = 'COMPLETADO';
  }

  records.push({
    id: `rec-pdf-${String(idCounter++).padStart(4, '0')}`,
    week,
    dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
    entryDate,
    exitDate,
    employeeName,
    predio,
    totalHours,
    observations,
    status
  });
}

console.log(`Successfully parsed ${records.length} records!`);
const weeks = [...new Set(records.map(r => r.week))].sort((a,b)=>a-b);
console.log('Weeks present:', weeks.join(', '));
const employees = [...new Set(records.map(r => r.employeeName))];
console.log('Employees:', employees);
const predios = [...new Set(records.map(r => r.predio))];
console.log('Predios:', predios);
const observationsList = [...new Set(records.map(r => r.observations))];
console.log('Observations sample:', observationsList);

fs.writeFileSync('parsed_pdf_records.json', JSON.stringify(records, null, 2));
