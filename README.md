# Energy Monitoring

Project ini digunakan untuk monitoring data energi dan integrasi ke InfluxDB Cloud.

## Fitur
- Koneksi ke InfluxDB Cloud
- Penyimpanan data monitoring energi
- Konfigurasi environment terpisah melalui file `.env`

## Prasyarat
- Node.js (disarankan versi LTS)
- npm / pnpm / yarn
- Akun InfluxDB Cloud

## Konfigurasi Environment
Buat/ubah file `.env` dengan format berikut:

```env
INFLUXDB_TOKEN=
INFLUXDB_HOST=
INFLUXDB_DATABASE=
```

## Instalasi
```bash
npm install
```

## Menjalankan Project
> Sesuaikan command di bawah dengan script pada `package.json` Anda.

data.js untuk import data ke influxdb
```bash
node data.js
```
sensor
```bash
nodemon sensore.js
server
```
```bash
nodemon server.js
```