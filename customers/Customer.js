const { DataTypes } = require("sequelize"); // Correção para usar DataTypes
const connection = require("../database/database.js");

const Customer = connection.define("customers", {
    id: {
        type: DataTypes.INTEGER, // Tipo inteiro para o ID
        autoIncrement: true, // Incrementa automaticamente
        primaryKey: true // Define como chave primária
    },
    name: {
        type: DataTypes.STRING(100), // Define o tipo STRING com limite de 100 caracteres
        allowNull: false // Nome obrigatório
    },
    cpf_cnpj: {
        type: DataTypes.STRING(18), // Definição de tipo STRING com limite de 18 caracteres
        allowNull: true, // CPF ou CNPJ é opcional
        unique: true
    },
    phone: {
        type: DataTypes.STRING(20), // Define o telefone como STRING com limite de 20 caracteres
        allowNull: true // Telefone opcional
    }
}, {
    timestamps: false, // Remover createdAt/updatedAt
    underscored: true // Usar snake_case (cpf_cnpj ao invés de cpfCnpj)
});

module.exports = Customer;
