const { DataTypes } = require("sequelize"); // Usando DataTypes corretamente
const connection = require("../database/database.js");

const CompatibilityPart = connection.define("compatibility_parts", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: {
    type: DataTypes.STRING(255), // Tamanho do campo ajustado para 255 caracteres
    allowNull: false
  }
}, {
  timestamps: false, // Não cria createdAt/updatedAt
  underscored: true // Usar snake_case nas colunas (ex: name)
});

module.exports = CompatibilityPart;