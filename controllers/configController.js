const { saveConfig: saveConfigToDB, loadConfig: loadConfigFromDB } = require('../helpers/dbHelpers');

async function saveConfig(req, res) {
  try {
    const configData = req.body;
    await saveConfigToDB(configData);
    res.json({
      success: true,
      message: 'Configuration saved successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving configuration', error: error.message });
  }
}

async function getConfig(req, res) {
  try {
    const config = await loadConfigFromDB();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading configuration', error: error.message });
  }
}

module.exports = { saveConfig, getConfig };
