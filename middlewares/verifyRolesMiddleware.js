const verifyUserRoles = (authorized_user_role) => {
  return (req, res, next) => {
    if (!req?.user_role) {
      return res.status(401).send("roles can not be found");
    }
    let result = false;

    if(req.user_role == authorized_user_role){
      result = true;
    }

    if (!result)
      return res.status(401).send("Your user role is not authorized to access");

    next();
  };
};

module.exports = verifyUserRoles;
