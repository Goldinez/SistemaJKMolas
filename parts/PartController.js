const express = require("express");
const router = express.Router();
const CompatibilityPart = require("./CompatibilityPart.js");
const TypePart = require("./TypePart.js");
const Part = require("./Part.js");
const { Op } = require("sequelize");

router.get("/parts/cadastrar", async (req, res) =>{
   try{
      const tipos = await TypePart.findAll();
      const compativel = await CompatibilityPart.findAll();
      res.render("./admin/parts/new.ejs",{tipos: tipos, compativel: compativel});
   }catch(err){
      console.error(err);
   }
});

router.post("/parts/save", async (req, res) =>{

   try{
      let {name, seller, value, type, newType, compatibility, newCompatibility} = req.body;

      if(type == "novo" && newType){
         const novotipo = await TypePart.create({name: newType});
         type = novotipo.id;
      }

      if(compatibility == "novo" && newCompatibility){
         const novocompativel = await CompatibilityPart.create({name: newCompatibility});
         compatibility = novocompativel.id;
      }

      await Part.create({name: name, seller: seller, value: value, type_id: type, compatibility_id: compatibility});

      res.redirect("/parts/");
   }catch (error) {
      console.error(error);
   }
});


router.get("/parts/", async (req, res) =>{
   try{
      const parts = await Part.findAll({
         include: [TypePart, CompatibilityPart]
      });

      res.render("./admin/parts/index.ejs", {parts});
   }catch(error){
      console.error(error);
   }
});

router.get("/parts/editar/:id", async (req, res) =>{
   var id = req.params.id;
   try{
      const part = await Part.findByPk(id, {
         include: [TypePart, CompatibilityPart]
      });

      if(part){
         const types = await TypePart.findAll();
         const compatibilities = await CompatibilityPart.findAll();
         res.render("./admin/parts/edit.ejs",{
            part: part,
            types: types,
            compatibilities: compatibilities
         });
      }else{
         res.redirect("/admin/parts");
      }
   }catch(error){
      console.error(error);
      res.redirect("/admin/parts");
   }
});

router.post("/parts/update", async (req, res) =>{
   let {id, name, seller, value, type, newType, compatibility, newCompatibility} = req.body;
   try{
      if(type == "novo" && newType){
         const novotipo = await TypePart.create({name: newType});
         type = novotipo.id;
      }

      if(compatibility == "novo" && newCompatibility){
         const novocompativel = await CompatibilityPart.create({name: newCompatibility});
         compatibility = novocompativel.id;
      }
      await Part.update({name: name, seller: seller, value: value, type_id: type, compatibility_id: compatibility},{
         where: {id: id}
      });
      res.redirect("/parts");
   }catch (error) {
      console.error(error);
      res.redirect("/parts");
   }
});

router.post("/parts/deletar", async (req, res) =>{
   var id = req.body.id;
   if(id != undefined){
       if(!isNaN(id)){
           Part.destroy({
               where: {
                   id: id
               }
           }).then(() =>{
               res.redirect("/parts/");
           })
       }else{
           res.redirect("/parts/");
       }
   }else{
       res.redirect("/parts/");
   }
})

router.get('/parts/buscar', async (req, res) => {
    const termo = req.query.termo || "";

    try {
        const partes = await Part.findAll({
            where: {
                name: {
                    [require("sequelize").Op.like]: `%${termo}%`
                }
            },
            limit: 10
        });

        const results = partes.map(part => ({
            id: part.id,
            text: part.name,
            valor: part.value
        }));

        res.json(results);
    } catch (err) {
        console.error("Erro na busca de peças:", err);
        res.status(500).json({ error: "Erro na busca" });
    }
});

module.exports = router;