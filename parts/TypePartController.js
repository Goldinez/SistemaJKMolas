const express = require("express");
const router = express.Router();
const TypePart = require("./TypePart.js");

router.get("/parts/tipo/cadastrar",(req, res) =>{
    res.render("./admin/parts/type/new.ejs")
})

router.post("/admin/parts/tipo/save", (req, res) =>{
    var name = req.body.name;
    if(name != undefined){
        TypePart.create({
            name: name
        }).then(() =>{
            res.redirect("/parts/tipos");
        });
    }else{
        res.redirect("/parts/tipo/cadastrar");
    }
});

router.get("/parts/tipos", (req, res) =>{
    TypePart.findAll().then(typeParts =>{
        res.render("./admin/parts/type/index.ejs", {typeParts: typeParts}); 
    });
});

router.get("/parts/tipo/editar/:id", (req, res) =>{
    var id = req.params.id;
    if(isNaN(id)){
        res.redirect("/parts/tipos");
    }
    TypePart.findByPk(id).then(typePart =>{
        if(typePart != undefined){
            res.render("./admin/parts/type/edit.ejs",{typePart: typePart})
        }else{
            res.redirect("/parts/tipos");
        }
    }).catch(err =>{
        res.redirect("/parts/tipos");
    })
});

router.post("/parts/tipo/update", (req,res) =>{
    var id = req.body.id;
    var name = req.body.name;

    TypePart.update({name: name},{
        where:{
            id: id
        }
    }).then(() =>{
        res.redirect("/parts/tipos");
    })
});

router.post("/parts/tipo/deletar", (req, res) =>{
    var id = req.body.id;
    if(id != undefined){
        if(!isNaN(id)){
            TypePart.destroy({
                where: {
                    id: id
                }
            }).then(() =>{
                res.redirect("/parts/tipos");
            })
        }else{
            res.redirect("/parts/tipos");
        }
    }else{
        res.redirect("/parts/tipos");
    }
})

module.exports = router;