const mostrarVistaConsultor = (req, res) => {
    res.render('consultorDB', {
      title: 'Consultor'
    });
  };
  
  module.exports = {
    mostrarVistaConsultor
  };
  