const { DataTypes } = require("sequelize"); // Usando DataTypes corretamente
const connection = require("../database/database.js");
const TypePart = require("./TypePart.js");
const CompatibilityPart = require("./CompatibilityPart.js");

const Part = connection.define("parts", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: {
    type: DataTypes.STRING(255), // Limitei o campo para 255 caracteres
    allowNull: false
  },
  seller: {
    type: DataTypes.STRING(255), // Limitei o campo para 255 caracteres
    allowNull: true
  },
  value: {
    type: DataTypes.DECIMAL(10, 2), // Usando DECIMAL para valores monetários
    allowNull: false
  },
  type_id: { // Ajustei o nome da coluna para snake_case
    type: DataTypes.INTEGER,
    allowNull: false
  },
  compatibility_id: { // Ajustei o nome da coluna para snake_case
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false, // Não cria createdAt/updatedAt
  underscored: true // Usar snake_case nas colunas
});

// Relacionamento com TypePart
TypePart.hasMany(Part, {
  foreignKey: "type_id"
});
Part.belongsTo(TypePart, {
  foreignKey: "type_id"
});

// Relacionamento com CompatibilityPart
CompatibilityPart.hasMany(Part, {
  foreignKey: "compatibility_id"
});
Part.belongsTo(CompatibilityPart, {
  foreignKey: "compatibility_id"
});

module.exports = Part;