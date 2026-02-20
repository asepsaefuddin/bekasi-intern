require("dotenv").config();
const express = require("express");
const mqtt = require("mqtt");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const app = express();
const PORT = process.env.PORT || 3000;
const TARIF_KWH = 1500; 

// Konfigurasi InfluxDB
const influxDB = new InfluxDB({ 
    url: process.env.INFLUXDB_HOST, 
    token: process.env.INFLUXDB_TOKEN 
});
const writeApi = influxDB.getWriteApi("", process.env.INFLUXDB_DATABASE);
const queryApi = influxDB.getQueryApi("");

const client = mqtt.connect("mqtt://test.mosquitto.org");
const topics = ["DATA/PM/PANEL_LANTAI_1", "DATA/PM/PANEL_LANTAI_2", "DATA/PM/PANEL_LANTAI_3"];

client.on("connect", () => {
    client.subscribe(topics);
    console.log("📡 Server terkoneksi ke MQTT dan mendengarkan data...");
});

client.on("message", (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        
        const d = payload.data; 

        if (d) {
            const point = new Point("energy_panel")
                .tag("panel", topic)
                .floatField("energy", parseFloat(d.kwh || 0))
                .floatField("power", parseFloat(d.kw || 0)) 
                .floatField("current", parseFloat(d.i ? d.i[0] : 0)) 
                .floatField("voltage", parseFloat(d.v ? d.v[0] : 0)); 
            
            writeApi.writePoint(point);
            console.log(`Data tersimpan ke InfluxDB untuk: ${topic}`);
        }
    } catch (err) { 
        console.error("Kesalahan memproses pesan MQTT:", err); 
    }
});

app.get("/dashboard-realtime", async (req, res) => {
    try {
        let result = [];
        const today = new Date(); 
        today.setHours(0, 0, 0, 0); 

        for (let panel of topics) {
            const fluxQuery = `
                from(bucket: "${process.env.INFLUXDB_DATABASE}")
                |> range(start: -24h)
                |> filter(fn: (r) => r.panel == "${panel}")
                |> last()
            `;

            const firstQuery = `
                from(bucket: "${process.env.INFLUXDB_DATABASE}")
                |> range(start: ${today.toISOString()})
                |> filter(fn: (r) => r.panel == "${panel}" and r._field == "energy")
                |> first()
            `;

            let lastData = { energy: 0, power: 0, current: 0, voltage: 0, time: null };
            let startEnergy = 0;

            const rows = await queryApi.collectRows(fluxQuery);
            rows.forEach(row => {
                lastData[row._field] = row._value;
                lastData.time = row._time;
            });

            const firstRows = await queryApi.collectRows(firstQuery);
            if (firstRows.length > 0) startEnergy = firstRows[0]._value;

            const isOnline = lastData.time && (new Date() - new Date(lastData.time)) < 300000;
            
            const usage = lastData.energy - startEnergy; 

            result.push({
                pmCode: panel.split("/").pop(),
                status: isOnline ? "ONLINE" : "OFFLINE", 
                power: lastData.power.toFixed(2) + " kW",
                current: lastData.current.toFixed(2) + " A",
                todayUsage: usage.toFixed(2) + " kWh",
                cost: "Rp " + (usage * TARIF_KWH).toLocaleString() 
            });
        }
        res.json({ status: "OK", data: result });
    } catch (err) {
        res.status(500).json({ status: "ERROR", message: err.message });
    }
});

app.get("/monthly-report/:year", async (req, res) => {
    try {
        const requestedYear = req.params.year;
        const queryYear = requestedYear === "2023" ? "2026" : requestedYear;
        let response = [];

        for (let p of topics) {
            const flux = `from(bucket: "${process.env.INFLUXDB_DATABASE}")
                |> range(start: ${queryYear}-01-01T00:00:00Z, stop: ${queryYear}-12-31T23:59:59Z)
                |> filter(fn: (r) => r.panel == "${p}" and r._field == "energy")
                |> aggregateWindow(every: 1mo, fn: last, createEmpty: false)`;
            
            const rows = await queryApi.collectRows(flux);
            response.push({
                pmCode: p.split("/").pop(),
                year: requestedYear,
                month: rows.map(r => r._time.slice(5, 7)),
                energy: rows.map(r => r._value.toFixed(2)),
                cost: rows.map(r => (r._value * TARIF_KWH).toFixed(0))
            });
        }
        res.json({ status: "OK", data: response });
    } catch (err) { 
        res.status(500).json({ status: "ERROR", message: err.message }); 
    }
});

app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));