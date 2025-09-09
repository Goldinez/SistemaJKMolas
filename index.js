const express = require("express");
const app = express();
const connection = require("./database/database.js");

const TypePartController = require("./parts/TypePartController.js");
const CompatibilityPartController = require("./parts/CompatibilityPartController.js");
const PartController = require("./parts/PartController.js");
const CustomerController = require("./customers/CustomerController.js");
const OrderController = require("./orders/OrderController.js");
const Order = require("./orders/Order");
const Customer = require("./customers/Customer");
const Part = require("./parts/Part");

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

app.get("/", async (req, res) =>{
    try {
    const totalPedidos = await Order.count();
    const totalClientes = await Customer.count();
    const totalPecas = await Part.count();

    const ultimosPedidos = await Order.findAll({
      include: [Customer],
      order: [["data_pedido", "DESC"]],
      limit: 5
    });

    res.render("index", {
      totalPedidos,
      totalClientes,
      totalPecas,
      ultimosPedidos
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    res.status(500).send("Erro ao carregar dashboard");
  }
});

app.listen(8080, () =>{
    console.log("O servidor está rodando");
});