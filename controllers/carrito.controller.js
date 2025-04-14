const mostrarCarrito = (req, res) => {
    const cart = req.session.cart || [];
    res.render('carrito', {
      title: 'Carrito',
      cart
    });
  };
  
  const agregarCarrito = (req, res) => {
    const { id, name, price } = req.body;
  
    if (!req.session.cart) {
      req.session.cart = [];
    }
  
    const index = req.session.cart.findIndex(p => p.id == id);
  
    if (index !== -1) {
      req.session.cart[index].qty += 1;
    } else {
      req.session.cart.push({ id, name, price, qty: 1 });
    }
  
    res.redirect('/carrito');
  };
  
  const eliminarProducto = (req, res) => {
    const { id } = req.body;
    req.session.cart = req.session.cart.filter(p => p.id != id);
    res.redirect('/carrito');
  };
  
  const vaciarCarrito = (req, res) => {
    req.session.cart = [];
    res.redirect('/carrito');
  };
  
  const actualizarCantidad = (req, res) => {
    const { id, qty } = req.body;
    if (!req.session.cart) return res.redirect('/carrito');
  
    const product = req.session.cart.find(p => p.id == id);
    if (product) {
      product.qty = parseInt(qty);
      if (product.qty < 1) {
        req.session.cart = req.session.cart.filter(p => p.id != id);
      }
    }
  
    res.redirect('/carrito');
  };
  
  const finalizarCompra = (req, res) => {
    const cart = req.session.cart || [];
  
    if (cart.length === 0) {
      return res.redirect('/carrito');
    }
  
    const ticketId = 'TCKT-' + Date.now();
    const fecha = new Date().toLocaleString('es-MX');
    let total = 0;
  
    cart.forEach(item => {
      total += item.price * item.qty;
    });
  
    const ticket = {
      id: ticketId,
      fecha,
      productos: cart,
      total
    };
  
    req.session.cart = [];
  
    res.render('ticket', {
      title: 'Ticket de Compra',
      ticket
    });
  };
  
  module.exports = {
    mostrarCarrito,
    agregarCarrito,
    eliminarProducto,
    vaciarCarrito,
    actualizarCantidad,
    finalizarCompra
  };
  