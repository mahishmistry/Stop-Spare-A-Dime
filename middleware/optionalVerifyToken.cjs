const optionalVerifyToken = async function optionalVerifyToken(req, res, next) {
 const authHeader = req.headers.authorization;


 if (!authHeader?.startsWith("Bearer ")) {
   req.user = null;
   return next();
 }


 try {
   const token = authHeader.split("Bearer ")[1];
   req.user = await admin.auth().verifyIdToken(token);
 } catch (err) {
   req.user = null;
 }


 next();
}
module.exports = optionalVerifyToken;