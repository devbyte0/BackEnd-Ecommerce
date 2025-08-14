const Unit = require('../models/MeasureType');

// Create a new unit
exports.createUnit = async (req, res) => {
  try {
    const { measureType, unitName } = req.body;

    if (!measureType || !unitName) {
      return res.status(400).json({ message: 'measureType and unitName are required' });
    }

    const newUnit = new Unit({ measureType, unitName });
    await newUnit.save();

    res.status(201).json(newUnit);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ message: 'Server error creating unit' });
  }
};

// Get all units
exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.find();
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ message: 'Server error fetching units' });
  }
};

// Get a single unit by ID
exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ message: 'Server error fetching unit' });
  }
};

// Update a unit by ID
exports.updateUnit = async (req, res) => {
  try {
    const { measureType, unitName } = req.body;
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    if (measureType) unit.measureType = measureType;
    if (unitName) unit.unitName = unitName;

    await unit.save();
    res.json(unit);
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ message: 'Server error updating unit' });
  }
};

// Delete a unit by ID
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ message: 'Server error deleting unit' });
  }
};
