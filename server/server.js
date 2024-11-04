const express = require("express");
const ping = require("ping");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = 3001;

mongoose.connect("mongodb://localhost:27017/deviceManager", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const deviceSchema = new mongoose.Schema({
  ipAddress: String,
  deviceName: String,
  online: Boolean,
  userId: String,
  startTime: Date,
  endTime: Date,
});

const Device = mongoose.model("Device", deviceSchema);

app.use(cors());
app.use(express.json());

app.post("/addDevice", async (req, res) => {
  const { ipAddress, deviceName, userId } = req.body;
  const newDevice = new Device({
    ipAddress,
    deviceName,
    userId,
    online: false,
  });
  await newDevice.save();
  res.json(newDevice);
});

const updateDeviceStatuses = async () => {
  const devices = await Device.find();
  const now = new Date();
  devices.forEach(async (device) => {
    const response = await ping.promise.probe(device.ipAddress);
    if (response.alive) {
      if (!device.online) {
        device.online = true;
        device.startTime = now;
      }
    } else {
      if (device.online) {
        device.online = false;
        device.endTime = now;
      }
    }
    await device.save();
  });
};

app.delete("/deleteDevice/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Device.findByIdAndDelete(id);
    res.json({ message: "Device deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/editDevice/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ipAddress, deviceName, userId } = req.body;
    const updatedDevice = await Device.findByIdAndUpdate(
      id,
      { ipAddress, deviceName, userId },
      { new: true }
    );
    res.json(updatedDevice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

setInterval(updateDeviceStatuses, 5000);

app.get("/devices", async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
