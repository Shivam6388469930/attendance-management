export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('AttendanceRecords', 'date', {
    type: Sequelize.DATEONLY,
    allowNull: false,
  });

  await queryInterface.changeColumn('CorrectionRequests', 'date', {
    type: Sequelize.DATEONLY,
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('AttendanceRecords', 'date', {
    type: Sequelize.DATE,
    allowNull: false,
  });

  await queryInterface.changeColumn('CorrectionRequests', 'date', {
    type: Sequelize.DATE,
    allowNull: false,
  });
}