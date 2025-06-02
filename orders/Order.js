const { DataTypes } = require("sequelize"); // Usando DataTypes corretamente
const connection = require("../database/database.js");
const Customer = require("../customers/Customer.js");

const Order = connection.define("orders", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  data_pedido: { 
    type: DataTypes.DATE, 
    allowNull: false 
  },
  placa_veiculo: { 
    type: DataTypes.STRING(20), // Tamanho ajustado para o número da placa
    allowNull: false 
  },
  valor_total: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  parcelas_total: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  parcelas_pagas: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 0 
  },
  status_pagamento: { 
    type: DataTypes.ENUM("pendente", "parcial", "pago"), 
    allowNull: false, 
    defaultValue: "pendente" 
  },
  status_pedido: { 
    type: DataTypes.ENUM("em andamento", "concluido"), 
    allowNull: false, 
    defaultValue: "em andamento" 
  },
  metodo_pagamento: { 
    type: DataTypes.ENUM("dinheiro", "cartao", "boleto", "pix"), 
    allowNull: false 
  },
  observacoes: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  }
}, {
  timestamps: false, // Não cria createdAt/updatedAt
  underscored: true // Usar snake_case nas colunas
});

// Relacionamento com Cliente
Order.belongsTo(Customer, { foreignKey: "customer_id" });
Customer.hasMany(Order, { foreignKey: "customer_id" });

module.exports = Order;