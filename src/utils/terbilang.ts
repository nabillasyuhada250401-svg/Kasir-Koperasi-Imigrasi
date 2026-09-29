/**
 * Helper to convert numbers to formal Indonesian words (Terbilang)
 * e.g. 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

function angkaKeKata(n: number): string {
  if (n < 12) {
    return SATUAN[n];
  } else if (n < 20) {
    return angkaKeKata(n - 10) + ' Belas';
  } else if (n < 100) {
    const sisa = n % 10;
    return angkaKeKata(Math.floor(n / 10)) + ' Puluh ' + (sisa > 0 ? SATUAN[sisa] : '');
  } else if (n < 200) {
    return 'Seratus ' + angkaKeKata(n - 100);
  } else if (n < 1000) {
    return angkaKeKata(Math.floor(n / 100)) + ' Ratus ' + angkaKeKata(n % 100);
  } else if (n < 2000) {
    return 'Seribu ' + angkaKeKata(n - 1000);
  } else if (n < 1000000) {
    return angkaKeKata(Math.floor(n / 1000)) + ' Ribu ' + angkaKeKata(n % 1000);
  } else if (n < 1000000000) {
    return angkaKeKata(Math.floor(n / 1000000)) + ' Juta ' + angkaKeKata(n % 1000000);
  } else if (n < 1000000000000) {
    return angkaKeKata(Math.floor(n / 1000000000)) + ' Miliar ' + angkaKeKata(n % 1000000000);
  } else {
    return angkaKeKata(Math.floor(n / 1000000000000)) + ' Triliun ' + angkaKeKata(n % 1000000000000);
  }
}

export function terbilang(nominal: number): string {
  if (nominal === 0) return 'Nol Rupiah';
  const hasil = angkaKeKata(Math.floor(Math.abs(nominal))).replace(/\s+/g, ' ').trim();
  return `# ${hasil} Rupiah #`;
}
