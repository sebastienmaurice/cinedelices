export function mockAdmin(req, res, next) {
  req.userRole = "admin"; // Simule que l'utilisateur est admin
  next();
}
