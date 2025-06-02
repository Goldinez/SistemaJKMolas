const express = require("express");
const router = express.Router();
const CompatibilityPart = require("./CompatibilityPart.js");

router.get("/parts/compativel/cadastrar",(req, res) =>{
    res.render("./admin/parts/compatibility/new.ejs")
})

router.post("/admin/parts/compatibility/save", (req, res) =>{
    var name = req.body.name;
    if(name != undefined){
        CompatibilityPart.create({
            name: name
        }).then(() =>{
            res.redirect("/parts/compativeis");
        });
    }else{
        res.redirect("/parts/compativel/cadastrar");
    }
});

router.get("/parts/compativeis", (req, res) =>{
    CompatibilityPart.findAll().then(compatibilityPart =>{
        res.render("./admin/parts/compatibility/index.ejs", {compatibilityPart: compatibilityPart}); 
    });
});

router.get("/parts/compativel/editar/:id", (req, res) =>{
    var id = req.params.id;
    if(isNaN(id)){
        res.redirect("/parts/compativeis");
    }
    CompatibilityPart.findByPk(id).then(compatibilityPart =>{
        if(compatibilityPart != undefined){
            res.render("./admin/parts/compatibility/edit.ejs",{compatibilityPart: compatibilityPart});
        }else{
            res.redirect("/parts/compativeis");
        }
    }).catch(err =>{
        res.redirect("/parts/compativeis");
    })
});

router.post("/parts/compativel/update", (req,res) =>{
    var id = req.body.id;
    var name = req.body.name;

    CompatibilityPart.update({name: name},{
        where:{
            id: id
        }
    }).then(() =>{
        res.redirect("/parts/compativeis");
    })
});

router.post("/parts/compativel/deletar", (req, res) =>{
    var id = req.body.id;
    if(id != undefined){
        if(!isNaN(id)){
            CompatibilityPart.destroy({
                where: {
                    id: id
                }
            }).then(() =>{
                res.redirect("/parts/compativeis");
            })
        }else{
            res.redirect("/parts/compativeis");
        }
    }else{
        res.redirect("/parts/compativeis");
    }
})

module.exports = router;