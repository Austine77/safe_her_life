import { Router } from "express";
import { findNearbyPoliceStations, geocodeNigeriaLocation } from "../services/policeGeoService.js";
import {
  findPoliceStateContact,
  getAllPoliceContacts,
  getPoliceHierarchy,
  getPoliceStates,
  searchPoliceContacts,
} from "../services/policeDirectoryService.js";

const router = Router();

router.get("/states", (_req, res) => {
  res.json({ success: true, states: getPoliceStates() });
});

router.get("/hierarchy", (_req, res) => {
  const results = getPoliceHierarchy();
  res.json({ success: true, count: results.length, results });
});

router.get("/directory", (req, res) => {
  const query = String(req.query.q || "").trim();
  const results = searchPoliceContacts(query);
  res.json({ success: true, count: results.length, results });
});

router.get("/directory/all", (_req, res) => {
  const results = getAllPoliceContacts();
  res.json({ success: true, count: results.length, results });
});

router.get("/state/:state", (req, res) => {
  const contact = findPoliceStateContact(req.params.state || "");
  if (!contact) {
    return res.status(404).json({ success: false, message: "State command contact not found." });
  }
  return res.json({ success: true, contact });
});

router.get("/lookup", async (req, res) => {
  try {
    const location = String(req.query.location || "").trim();
    const radiusMeters = Math.max(5000, Math.min(100000, Number(req.query.radiusMeters || 30000)));
    if (!location) {
      return res.status(400).json({ success: false, message: "location query is required." });
    }

    const geo = await geocodeNigeriaLocation(location);
    const stations = await findNearbyPoliceStations(geo.lat, geo.lon, radiusMeters);
    const fallbackContact =
      findPoliceStateContact(geo.address?.state || "") ||
      findPoliceStateContact(geo.address?.city || "") ||
      findPoliceStateContact(location);

    return res.json({
      success: true,
      searchedLocation: location,
      geocodedLocation: geo,
      fallbackContact,
      count: stations.length,
      results: stations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to complete police lookup." });
  }
});

export default router;
