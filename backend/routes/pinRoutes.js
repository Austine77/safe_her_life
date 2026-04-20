import express from 'express';
import UserPin from '../models/UserPin.js';

const router = express.Router();

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/create-pin', async (_req, res) => {
  try {
    let pin = generatePin();
    while (await UserPin.exists({ pin })) {
      pin = generatePin();
    }

    await UserPin.create({ pin, isActive: true });
    res.status(201).json({ pin, message: 'Access PIN created successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Unable to create access PIN.', error: err.message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { pin } = req.body;
    const pinRecord = await UserPin.findOne({ pin: String(pin || '').trim(), isActive: true }).lean();

    if (!pinRecord) {
      return res.status(404).json({ valid: false, message: 'Access PIN not found.' });
    }

    return res.json({ valid: true, message: 'Access PIN accepted.' });
  } catch (err) {
    return res.status(500).json({ valid: false, message: 'Unable to validate access PIN.', error: err.message });
  }
});

export default router;
