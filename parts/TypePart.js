const { DataTypes } = require("sequelize"); // Usando DataTypes corretamente
const connection = require("../database/database.js");

const TypePart = connection.define("type_parts", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: {
    type: DataTypes.STRING(255), // Limitei o campo para 255 caracteres
    allowNull: false
  }
}, {
  timestamps: false, // Não cria createdAt/updatedAt
  underscored: true // Usar snake_case nas colunas
});

module.exports = TypePart;