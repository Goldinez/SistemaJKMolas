const { DataTypes } = require("sequelize"); // Usando DataTypes
const connection = require("../database/database.js");
const Order = require("./Order.js");

const ItemOrder = connection.define("item_orders", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  order_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: "orders", key: "id" } 
  },
  descricao: { 
    type: DataTypes.STRING(255), // Limitei o tamanho da string para 255
    allowNull: false 
  },
  valor: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  tipo: { 
    type: DataTypes.ENUM("peca", "mao_de_obra"), 
    allowNull: false 
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  timestamps: false, // Não cria createdAt/updatedAt
  underscored: true // Usa snake_case para os campos (ex: order_id)
});

// Relacionamento com Pedido
ItemOrder.belongsTo(Order, { foreignKey: "order_id", onDelete: "CASCADE" });
Order.hasMany(ItemOrder, { foreignKey: "order_id" });

module.exports = ItemOrder;