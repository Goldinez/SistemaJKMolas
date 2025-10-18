const express = require("express");
const router = express.Router();
const { Op } = require('sequelize');
const Order = require("./Order.js")
const ItemOrder = require("./ItemOrder.js")
const InstallmentOrder = require("./InstallmentOrder.js");
const Customer = require("../customers/Customer.js");
const connection = require("../database/database.js");

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
        descricao: item.descricao || item.descricao_hidden || '',
        valor: parseFloat(item.valor),
        tipo: item.tipo,
        quantidade: parseInt(item.quantidade),
      });
    }

    // Criar parcelas do pedido (installments)
    const totalParcelas = parseInt(parcela);
    const valorParcelaNum = parseFloat((valorTotal / totalParcelas).toFixed(2));
    const valorUltimaParcela = (valorTotal - (valorParcelaNum * (totalParcelas - 1))).toFixed(2);
    const dataBase = new Date(newOrder.data_pedido);

    for (let i = 1; i <= totalParcelas; i++) {
      const vencimento = new Date(dataBase);
      vencimento.setMonth(vencimento.getMonth() + (i - 1));

      await InstallmentOrder.create({
        order_id: newOrder.id,
        numero_parcela: i,
        valor: (i === totalParcelas) ? valorUltimaParcela : valorParcelaNum, // Lógica aplicada
        data_vencimento: vencimento,
        // status: 'pendente', // 'status_pagamento' não existe no seu model, o nome é 'status'
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

router.post("/orders/update/:id", async (req, res) => {
  const { id } = req.params;
  const {
    placa_veiculo,
    metodo_pagamento,
    observacoes,
    status_pedido,
    itens,
    parcela, // novo número de parcelas
  } = req.body;

  const t = await connection.transaction();

  try {
    // 1. Calcular novo valor_total
    let valorTotal = 0;
    if (itens && itens.length > 0) {
      valorTotal = itens.reduce((acc, item) => {
        return acc + (parseFloat(item.valor) * parseInt(item.quantidade));
      }, 0);
    }

    const totalParcelas = parseInt(parcela) || 1;

    // 2. Buscar pedido atual
    const pedidoAtual = await Order.findByPk(id, { transaction: t });
    if (!pedidoAtual) {
      await t.rollback();
      return res.status(404).send("Pedido não encontrado");
    }

    const valorAntigo = parseFloat(pedidoAtual.valor_total);

    // 3. Preparar campos para atualizar
    const camposParaAtualizar = {};

    if (placa_veiculo !== pedidoAtual.placa_veiculo) camposParaAtualizar.placa_veiculo = placa_veiculo;
    if (metodo_pagamento !== pedidoAtual.metodo_pagamento) camposParaAtualizar.metodo_pagamento = metodo_pagamento;
    if (observacoes !== pedidoAtual.observacoes) camposParaAtualizar.observacoes = observacoes;
    if (status_pedido !== pedidoAtual.status_pedido) camposParaAtualizar.status_pedido = status_pedido;
    if (totalParcelas !== pedidoAtual.parcelas_total) camposParaAtualizar.parcelas_total = totalParcelas;
    if (valorTotal.toFixed(2) !== valorAntigo.toFixed(2)) camposParaAtualizar.valor_total = valorTotal.toFixed(2);

    // 4. Verifica se há algo para atualizar
    if (Object.keys(camposParaAtualizar).length === 0) {
      await t.rollback();
      return res.redirect("/orders");
    }

    // 5. Atualiza o pedido
    await Order.update(camposParaAtualizar, { where: { id }, transaction: t });

    // 6. Atualizar itens somente se o valor_total mudou
    if (valorTotal.toFixed(2) !== valorAntigo.toFixed(2)) {
      // Remover itens antigos
      await ItemOrder.destroy({ where: { order_id: id }, transaction: t });

      // Criar novos itens
      const itensParaCriar = itens.map(item => ({
        order_id: id,
        descricao: item.descricao || item.descricao_hidden || '',
        valor: parseFloat(item.valor),
        tipo: item.tipo,
        quantidade: parseInt(item.quantidade),
      }));
      await ItemOrder.bulkCreate(itensParaCriar, { transaction: t });
    }

    // 7. Atualizar parcelas somente se valor_total ou número de parcelas mudou
    if (valorTotal.toFixed(2) !== valorAntigo.toFixed(2) || totalParcelas !== pedidoAtual.parcelas_total) {
      // Remove parcelas antigas (status antigo será perdido apenas aqui)
      await InstallmentOrder.destroy({ where: { order_id: id }, transaction: t });

      const valorParcelaNum = parseFloat((valorTotal / totalParcelas).toFixed(2));
      const valorUltimaParcela = (valorTotal - (valorParcelaNum * (totalParcelas - 1))).toFixed(2);
      const parcelasParaCriar = [];
      const dataBase = new Date();

      for (let i = 1; i <= totalParcelas; i++) {
        const vencimento = new Date(dataBase);
        vencimento.setMonth(vencimento.getMonth() + (i - 1));

        parcelasParaCriar.push({
          order_id: id,
          numero_parcela: i,
          valor: (i === totalParcelas) ? valorUltimaParcela : valorParcelaNum,
          data_vencimento: vencimento,
          status: 'pendente',
        });
      }

      await InstallmentOrder.bulkCreate(parcelasParaCriar, { transaction: t });
    }

    // 8. Commit da transação
    await t.commit();
    res.redirect("/orders");

  } catch (error) {
    await t.rollback();
    console.error("Erro ao atualizar pedido:", error);
    res.status(500).send("Erro ao atualizar pedido: " + error.message);
  }
});

router.get("/orders/pagamentos/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [Customer, InstallmentOrder]
    });

    if (!order) {
      return res.redirect("/orders");
    }

    res.render("./admin/orders/payments.ejs", { order });
  } catch (error) {
    console.error("Erro ao carregar pagamentos:", error);
    res.status(500).send("Erro ao carregar pagamentos");
  }
});

router.post("/orders/pagamentos/:orderId/baixa/:installmentId", async (req, res) => {
  try {
    const { orderId, installmentId } = req.params;

    // Atualiza a parcela para "pago"
    await InstallmentOrder.update(
      { status: "pago" },
      { where: { id: installmentId, order_id: orderId } }
    );

    // Recalcular parcelas pagas
    const parcelasPagas = await InstallmentOrder.count({
      where: { order_id: orderId, status: "pago" }
    });

    const order = await Order.findByPk(orderId);

    let statusPagamento = "pendente";
    if (parcelasPagas === order.parcelas_total) {
      statusPagamento = "pago";
    } else if (parcelasPagas > 0) {
      statusPagamento = "parcial";
    }

    await Order.update(
      { parcelas_pagas: parcelasPagas, status_pagamento: statusPagamento },
      { where: { id: orderId } }
    );

    res.redirect(`/orders/pagamentos/${orderId}`);
  } catch (error) {
    console.error("Erro ao dar baixa na parcela:", error);
    res.status(500).send("Erro ao dar baixa na parcela");
  }
});

router.post("/orders/cancel/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o pedido existe
    const order = await Order.findByPk(id, {
      include: [ItemOrder, InstallmentOrder]
    });

    if (!order) {
      return res.status(404).send("Pedido não encontrado");
    }

    // Remove itens vinculados
    await ItemOrder.destroy({ where: { order_id: id } });

    // Remove parcelas vinculadas
    await InstallmentOrder.destroy({ where: { order_id: id } });

    // Atualiza o pedido para cancelado
    await Order.update(
      {
        status_pedido: "cancelado",
        status_pagamento: "cancelado",
        valor_total: 0,
        parcelas_total: 0,
        parcelas_pagas: 0
      },
      { where: { id } }
    );

    res.redirect("/orders");
  } catch (error) {
    console.error("Erro ao cancelar pedido:", error);
    res.status(500).send("Erro ao cancelar pedido");
  }
});

module.exports = router;