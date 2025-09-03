const sequelize = require("../database/database.js");
const Part = require("./Part");                     // <- correto agora
const CompatibilityPart = require("./CompatibilityPart"); // <- correto agora

// Tabela de junção: PartCompatibility (criada automaticamente se não existir)
Part.belongsToMany(CompatibilityPart, {
  as: "compatibilities",               // part.getCompatibilities / setCompatibilities
  through: "PartCompatibility",        // nome da TABELA de junção
  foreignKey: "part_id",               // FK que aponta para Part
  otherKey: "compatibility_id",        // FK que aponta para CompatibilityPart
  timestamps: false
});

CompatibilityPart.belongsToMany(Part, {
  as: "parts",
  through: "PartCompatibility",
  foreignKey: "compatibility_id",
  otherKey: "part_id",
  timestamps: false
});

module.exports = { sequelize, Part, CompatibilityPart };