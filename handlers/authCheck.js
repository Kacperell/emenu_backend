
const admin = require('firebase-admin');


function auth(req, res, next) {

    const idToken = req.header('x-auth-token');
    if (!idToken) {
        res.status(400).json({ msg: 'Token is not valid' });
        return;;
    }
    admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            let uid = decodedToken.uid;
            req.user = uid;
            next();

        }).catch(function (error) {
            res.status(400).json({ msg: 'Token is not valid' });
            // return 
        });

}

module.exports = auth;
