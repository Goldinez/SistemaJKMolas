const {Sequelize} = require("sequelize");
const path = require("path");

const connection = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "JkMolas.db")
});

module.exports = connection;