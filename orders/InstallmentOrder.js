const { DataTypes } = require("sequelize"); // Correção para usar DataTypes
const connection = require("../database/database.js");
const Order = require("./Order.js");

const InstallmentOrder = connection.define("installment_orders", {
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
  numero_parcela: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  valor: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  data_vencimento: { 
    type: DataTypes.DATE, 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM("pendente", "pago"), 
    allowNull: false, 
    defaultValue: "pendente" 
  }
}, {
  timestamps: false, // Não cria os campos createdAt/updatedAt
  underscored: true // Usa snake_case para os campos (ex: order_id)
});

// Relacionamento com Pedido
InstallmentOrder.belongsTo(Order, { foreignKey: "order_id", onDelete: "CASCADE" });
Order.hasMany(InstallmentOrder, { foreignKey: "order_id" });

module.exports = InstallmentOrder;
