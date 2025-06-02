const express = require("express");
const app = express();
const connection = require("./database/database.js");

const TypePartController = require("./parts/TypePartController.js");
const CompatibilityPartController = require("./parts/CompatibilityPartController.js");
const PartController = require("./parts/PartController.js");
const CustomerController = require("./customers/CustomerController.js");
const OrderController = require("./orders/OrderController.js");

app.set("view engine", "ejs");
app.use(express.static("public"));

connection.authenticate().then(() =>{
    console.log("Conexão feita com sucesso!");
}).catch((error) =>{
    console.log(error);
});


app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use("/", TypePartController);
app.use("/", CompatibilityPartController);
app.use("/", PartController);
app.use("/", CustomerController);
app.use("/", OrderController);

app.use("/", (req, res) =>{
    res.render("index.ejs");
});

app.listen(8080, () =>{
    console.log("O servidor está rodando");
});