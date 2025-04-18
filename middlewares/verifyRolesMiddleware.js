const verifyUserRoles = (authorized_user_role) => {
  return (req, res, next) => {
    // Check either roles (set by verifyJWT) or user_role (custom property)
    if (!req?.roles && !req?.user_role) {
      return res.status(401).send("roles cannot be found");
    }
    
    let result = false;
    const userRole = req.roles || req.user_role;

    if (userRole == authorized_user_role) {
      result = true;
    }

    if (!result) {
      return res.status(401).send("Your user role is not authorized to access");
    }

    next();
  };
};

module.exports = verifyUserRoles;