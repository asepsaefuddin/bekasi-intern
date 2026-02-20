require("dotenv").config();
const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_HOST,
  token: process.env.INFLUXDB_TOKEN
});
const writeApi = influxDB.getWriteApi("", process.env.INFLUXDB_DATABASE);
writeApi.useDefaultTags({ host: "data-js" });

const panels = [
  "DATA/PM/PANEL_LANTAI_1",
  "DATA/PM/PANEL_LANTAI_2",
  "DATA/PM/PANEL_LANTAI_3"
];

const currentYear = 2026;

async function seedData() {
  console.log("⏳ Mengirim data ke InfluxDB Cloud...");

  for (let month = 0; month <= 1; month++) {
    const day = (month === 0) ? 25 : 15;
    const monthDate = new Date(currentYear, month, day, 12, 0, 0);

    panels.forEach(panel => {
      const point = new Point("energy_panel")
        .tag("panel", panel)
        .floatField("energy", 500 + (month * 100) + Math.random() * 20)
        .timestamp(monthDate);
      writeApi.writePoint(point);
    });
  }

  const morning = new Date("2026-02-20T00:00:00Z");
  const now = new Date("2026-02-20T10:00:00Z");

  panels.forEach(panel => {
    writeApi.writePoint(new Point("energy_panel").tag("panel", panel).floatField("energy", 100.0).timestamp(morning));
    writeApi.writePoint(new Point("energy_panel")
      .tag("panel", panel)
      .floatField("energy", 132.1)
      .floatField("power", 7.6)  
      .floatField("current", 1.4) 
      .timestamp(now));
  });

  try {
    await writeApi.close();
    console.log("✅ Berhasil! Data 2026 (Mapping 2023) telah masuk.");
  } catch (e) {
    console.error("❌ Gagal:", e);
  }
}

seedData();