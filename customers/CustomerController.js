const express = require("express");
const router = express.Router();
const Customer = require("./Customer.js");
const { Op } = require("sequelize");

router.get("/customers/cadastrar",(req, res) =>{
    res.render("./admin/customers/new.ejs")
});

router.post("/customers/save", (req, res) =>{
    var {name, cpf, phone} = req.body;
    if(name != undefined){
        Customer.create({
            name: name,
            cpf_cnpj: cpf,
            phone: phone
        }).then(() => {
            res.redirect("/customers/")
        });
    }else{
        res.redirect("/customers/cadastrar");
    }
    
});

router.get("/customers/", (req, res) =>{
    Customer.findAll().then(customers =>{
        res.render("./admin/customers/index.ejs", {customers: customers});
    });
});

router.get("/customers/editar/:id", (req, res) =>{
    var id = req.params.id;

    if(isNaN(id)){
        res.redirect("/customers/");
    }
    Customer.findByPk(id).then(customer => {
        if(customer != undefined){
            res.render("./admin/customers/edit.ejs", {customer: customer})
        }else{
            res.redirect("/customers/");
        }
    }).catch(err =>{
        res.redirect("/customers/");
    })
});

router.post("/customers/update", (req, res) =>{
    var {id, name, cpfcnpj, phone } = req.body;
    Customer.update({name: name, cpf_cnpj: cpfcnpj, phone: phone},{
        where:{
            id: id
        }
    }).then(() =>{
        res.redirect("/customers/");
    });
});

router.post("/customers/deletar", (req,res) =>{
    var id = req.body.id;
    if(id != undefined){
        if(!isNaN(id)){
            Customer.destroy({
                where: {
                    id: id
                }
            }).then(() =>{
                res.redirect("/customers/");
            })
        }else{
            res.redirect("/customers/");
        }
    }else{
        res.redirect("/customers/");
    }
})

router.get("/customers/buscar", async(req, res) =>{
    const termo = req.query.term || "";

    try{
        const clientes = await Customer.findAll({
            where:{
                name: { [Op.like]: `%${termo}%` }
            },
            limit: 10
        });
        res.json(clientes)
    }catch (error){
        console.error("Erro ao buscar clientes:", error);
        res.status(500).json({ error: "Erro ao buscar clientes" });
    }
});

module.exports = router;