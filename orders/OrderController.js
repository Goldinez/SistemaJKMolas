const express = require("express");
const router = express.Router();
const { Op } = require('sequelize');
const Order = require("./Order.js")
const ItemOrder = require("./ItemOrder.js")
const InstallmentOrder = require("./InstallmentOrder.js");
const Customer = require("../customers/Customer.js");

router.get("/orders/cadastrar",(req, res) =>{
    res.render("./admin/orders/new.ejs")
})

router.post('/orders/save', async (req, res) => {
  const {
    clienteId,
    clienteName,
    clienteCpfCnpj,
    clienteContato,
    placa_veiculo,
    metodo_pagamento,
    observacoes,
    parcela,
    itens,
  } = req.body;

  try {
    // Cliente
    let customerIdFinal = clienteId;
    if (clienteId === 'novo') {
      const novoCliente = await Customer.create({
        name: clienteName,
        cpf_cnpj: clienteCpfCnpj,
        phone: clienteContato,
      });
      customerIdFinal = novoCliente.id;
    }

    // Calcular valor total
    let valorTotal = 0;
    for (const item of itens) {
      valorTotal += parseFloat(item.valor) * parseInt(item.quantidade);
    }

    // Criar pedido
    const newOrder = await Order.create({
      customer_id: customerIdFinal,
      data_pedido: new Date(),
      placa_veiculo,
      valor_total: valorTotal.toFixed(2),
      parcelas_total: parseInt(parcela),
      status_pagamento: 'pendente',
      status_pedido: 'em andamento',
      metodo_pagamento,
      observacoes,
      parcelas_pagas: 0,
    });

    // Criar itens do pedido
    for (const item of itens) {
      const descricao = typeof item.descricao === 'string'
        ? item.descricao
        : item.descricao_hidden || '';

      await ItemOrder.create({
        order_id: newOrder.id,
        descricao,
        valor: parseFloat(item.valor),
        tipo: item.tipo,
        quantidade: parseInt(item.quantidade),
      });
    }

    // Criar parcelas do pedido (installments)
    const totalParcelas = parseInt(parcela);
    const valorParcela = (valorTotal / totalParcelas).toFixed(2);
    const dataBase = new Date();

    for (let i = 1; i <= totalParcelas; i++) {
      const vencimento = new Date(dataBase);
      vencimento.setMonth(vencimento.getMonth() + (i - 1));

      await InstallmentOrder.create({
        order_id: newOrder.id,
        numero_parcela: i,
        valor: valorParcela,
        data_vencimento: vencimento,
        status_pagamento: 'pendente',
      });
    }

    res.redirect('/orders');
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    res.status(500).send('Erro ao salvar pedido: ' + error.message);
  }
});

router.get("/orders", async (req, res) => {
  try {
    const filtros = req.query || {};

    // Página atual e limite de itens por página
    const page = parseInt(filtros.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Construção dos filtros
    const where = {};
    const customerWhere = {};

    // Filtros fixos
    if (filtros.status_pagamento && filtros.status_pagamento !== "") {
      where.status_pagamento = filtros.status_pagamento;
    }
    if (filtros.status_pedido && filtros.status_pedido !== "") {
      where.status_pedido = filtros.status_pedido;
    }
    if (filtros.metodo_pagamento && filtros.metodo_pagamento !== "") {
      where.metodo_pagamento = filtros.metodo_pagamento;
    }

    // Filtro de data entre duas datas
    if (filtros.data_inicio && filtros.data_fim) {
      where.data_pedido = {
        [Op.between]: [new Date(filtros.data_inicio), new Date(filtros.data_fim)],
      };
    }

    const { count: totalPedidos, rows: pedidos } = await Order.findAndCountAll({
      where,
      include: [{
        model: Customer,
        required: true,
        where: Object.keys(customerWhere).length ? customerWhere : undefined,
      }],
      limit,
      offset,
      order: [["data_pedido", "DESC"]],
    });

    const totalPages = Math.ceil(totalPedidos / limit);

    res.render("./admin/orders/index.ejs", {
      pedidos,
      filtros,
      page,
      totalPages
    });

  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).send("Erro interno ao buscar pedidos.");
  }
});

router.get("/orders/editar/:id", async (req, res) =>{
   var id = req.params.id;
   try{
      const order = await Order.findByPk(id, {
         include: [Customer, ItemOrder, InstallmentOrder]
      });

      if(order){
         res.render("./admin/orders/edit.ejs",{
            order: order,
         });
      }else{
         res.redirect("/admin/orders");
      }
   }catch(error){
      console.error(error);
      res.redirect("/admin/orders");
   }
});

module.exports = router;