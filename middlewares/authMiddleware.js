const authMiddleware = (req, res, next) => {
    if (!req.session.usuario) {
      return res.status(401).redirect('/login');  
    }
    next(); 
  };
  
  module.exports = authMiddleware;
  