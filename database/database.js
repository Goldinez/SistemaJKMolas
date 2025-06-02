const {Sequelize} = require("sequelize");
const connection = new Sequelize({
    dialect: "sqlite",
    storage: "./JkMolas.db"
});

module.exports = connection;