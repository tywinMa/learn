const { Unit, UnitProgress, sequelize } = require('../models');

exports.batchUnlockUnits = async (req, res) => {
  const { unitIds, userId } = req.body;

  if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0 || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: unitIds array (non-empty) and userId.'
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const unlockedUnitsInfo = [];
    const failedUnits = [];

    for (const unitId of unitIds) {
      const unit = await Unit.findByPk(unitId, { transaction });
      if (!unit) {
        console.warn(`Batch Unlock: Unit with id ${unitId} not found. Skipping.`);
        failedUnits.push({ unitId, reason: 'Not found' });
        continue;
      }

      const [progressEntry, created] = await UnitProgress.findOrCreate({
        where: { userId, unitId },
        defaults: {
          stars: 0,
          completed: true,
          completedAt: new Date()
        },
        transaction
      });

      if (!created) {
        if (progressEntry.stars !== 0 || !progressEntry.completed) {
          progressEntry.stars = 0;
          progressEntry.completed = true;
          progressEntry.completedAt = progressEntry.completedAt || new Date();
          await progressEntry.save({ transaction });
        } else {
          // Already in desired state, do nothing to avoid unnecessary save
        }
      }
      unlockedUnitsInfo.push({
        unitId: progressEntry.unitId,
        stars: progressEntry.stars,
        completed: progressEntry.completed
      });
    }

    await transaction.commit();

    let message = `${unlockedUnitsInfo.length} units processed successfully for unlock.`;
    if (failedUnits.length > 0) {
      message += ` ${failedUnits.length} units failed.`;
    }

    res.json({
      success: true,
      message: message,
      data: { unlocked: unlockedUnitsInfo, failed: failedUnits }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Batch unlock units controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch unlock units due to a server error.',
      error: error.message
    });
  }
}; 