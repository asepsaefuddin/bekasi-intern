const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://test.mosquitto.org");

// Simulasi nilai awal energy dalam kWh
let energy1 = 100.0;
let energy2 = 200.0;
let energy3 = 300.0;

client.on("connect", () => {
  console.log("📡 Sensor connected ke MQTT");

  setInterval(() => {
    // Simulasi kenaikan energy
    energy1 += Math.random() * 0.1;
    energy2 += Math.random() * 0.1;
    energy3 += Math.random() * 0.1;

    const createPayload = (energyVal) => ({
      status: "OK", 
      data: {
        v: [220.5, 221.2, 219.8],
        i: [1.4, 1.2, 1.3, 0.07],
        kw: (7.6 + Math.random()).toFixed(2),
        kVA: "0.18",
        kwh: energyVal.toFixed(2), 
        time: new Date().toISOString().replace('T', ' ').split('.')[0] 
      }
    });

    
    client.publish("DATA/PM/PANEL_LANTAI_1", JSON.stringify(createPayload(energy1)));
    client.publish("DATA/PM/PANEL_LANTAI_2", JSON.stringify(createPayload(energy2)));
    client.publish("DATA/PM/PANEL_LANTAI_3", JSON.stringify(createPayload(energy3)));

    console.log(`📤 Data terkirim pada ${new Date().toLocaleTimeString()}`);
  }, 5000);
});