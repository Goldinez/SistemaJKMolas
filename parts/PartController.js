const express = require("express");
const router = express.Router();
const sequelize = require("../database/database.js");
const CompatibilityPart = require("./CompatibilityPart.js");
const TypePart = require("./TypePart.js");
const Part = require("./Part.js");
const Part_Compatibility = require("./Part_Compatibility.js");
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

router.post("/parts/save", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let { name, seller, value, type, newType, compatibility, newCompatibility } = req.body;

    // Garante arrays (mesmo que venha um único valor)
    if (!Array.isArray(compatibility)) compatibility = compatibility ? [compatibility] : [];
    if (!Array.isArray(newCompatibility)) newCompatibility = newCompatibility ? [newCompatibility] : [];

    // Tipo novo
    if (type === "novo" && newType) {
      const novoTipo = await TypePart.create({ name: newType }, { transaction: t });
      type = novoTipo.id;
    }

    // Cria a peça (sem compatibility_id!)
    const part = await Part.create(
      { name, seller, value, type_id: type },
      { transaction: t }
    );

    // Monta lista de IDs de compatibilidade
    const compatIds = [];

    // Percorre os selects na mesma ordem dos inputs "newCompatibility[]"
    for (let i = 0; i < compatibility.length; i++) {
      const comp = compatibility[i];
      const maybeNew = (newCompatibility[i] || "").trim();

      if (comp === "novo" && maybeNew) {
        const created = await CompatibilityPart.create(
          { name: maybeNew },
          { transaction: t }
        );
        compatIds.push(created.id);
      } else if (comp && comp !== "novo") {
        const id = Number(comp);
        if (!Number.isNaN(id)) compatIds.push(id);
      }
    }

    // Associa N:N (substitui o conjunto atual)
    if (compatIds.length > 0) {
      await part.setCompatibilities(compatIds, { transaction: t });
    }

    await t.commit();
    return res.redirect("/parts/");
  } catch (error) {
    console.error(error);
    await t.rollback();
    return res.status(500).send("Erro ao salvar a peça");
  }
});


router.get("/parts/", async (req, res) => {
  try {
    const parts = await Part.findAll({
      include: [
        TypePart,
        {
          model: CompatibilityPart,
          as: "compatibilities"   // <- usar o mesmo alias do relacionamento
        }
      ]
    });

    res.render("./admin/parts/index.ejs", { parts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao buscar peças");
  }
});

router.get("/parts/editar/:id", async (req, res) =>{
   var id = req.params.id;
   try{
      const part = await Part.findByPk(id, {
         include: [
            TypePart,
            {
               model: CompatibilityPart,
               as: "compatibilities" // usar o alias correto
            }
         ]
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

router.post("/parts/update", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let { id, name, seller, value, type, newType, compatibility, newCompatibility } = req.body;

    // Garante arrays
    if (!Array.isArray(compatibility)) compatibility = compatibility ? [compatibility] : [];
    if (!Array.isArray(newCompatibility)) newCompatibility = newCompatibility ? [newCompatibility] : [];

    // Tipo novo
    if (type === "novo" && newType) {
      const novotipo = await TypePart.create({ name: newType }, { transaction: t });
      type = novotipo.id;
    }

    // Atualiza a peça
    const part = await Part.findByPk(id, { transaction: t });
    if (!part) {
      await t.rollback();
      return res.redirect("/parts");
    }

    await part.update(
      { name, seller, value, type_id: type },
      { transaction: t }
    );

    // Processa compatibilidades
    const compatIds = [];

    for (let i = 0; i < compatibility.length; i++) {
      const comp = compatibility[i];
      const maybeNew = (newCompatibility[i] || "").trim();

      if (comp === "novo" && maybeNew) {
        const created = await CompatibilityPart.create(
          { name: maybeNew },
          { transaction: t }
        );
        compatIds.push(created.id);
      } else if (comp && comp !== "novo") {
        const id = Number(comp);
        if (!Number.isNaN(id)) compatIds.push(id);
      }
    }

    // Atualiza associação N:N
    await part.setCompatibilities(compatIds, { transaction: t });

    await t.commit();
    res.redirect("/parts");
  } catch (error) {
    console.error(error);
    await t.rollback();
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