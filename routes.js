var express = require("express");
var passport = require("passport");
var User = require("./models/user");
var router = express.Router();
var mongoose = require("mongoose");
var nev = require('email-verification')(mongoose);

//템플릿용 변수 설정
router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
});
//컬렉션을 쿼리하고 가장 최근 사용자를 먼저 반환(descending)
router.get("/", function (req, res, next) {
    User.find().sort({createAt: "descending"})
        .exec(function (err, users) {
            if (err) {
                return next(err)
            }
            res.render("index", {users: users});
        });
});

router.get("/signup", function (req, res) {
    res.render("signup");
});

router.post('/signup', passport.authenticate('signup', {
    successRedirect : '/',
    failureRedirect : '/signup', //가입 실패시 redirect할 url주소
    failureFlash : true
}))

router.get("/users/:username", function (req, res, next) {
    User.findOne({username: req.params.username}, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(404);
        }
        res.render("profile", {user: user});
    });
});

router.get("/login", function (req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash("info", "먼저 로그인해야 합니다.");
        res.redirect("/login");
    }
}

router.get("/edit", ensureAuthenticated, function (req, res) {
    res.render("edit");
});

router.post("/edit", ensureAuthenticated, function (req, res, next) {
    req.user.displayName = req.body.displayname;
    req.user.save(function (err) {
        if (err) {
            next(err);
            return;
        }
        req.flash("info", "Profile updated!");
        res.redirect("/edit");
    });
});

router.get('/email-verification/:URL', function(req, res){
    var url = req.params.URL;
    nev.confirmTempUser(url, function(err, user){
        console.log("confirmed user " + user);
        if(err) console.log(err);
        if (user) {
            nev.sendConfirmationEmail(user.email, function(err, info) {
                if (err) {
                    return res.status(404).send('ERROR: sending confirmation email FAILED');
                }
                res.send({
                    msg: 'CONFIRMED!',
                    info: info
                });
            });
        } else {
            return res.status(404).send('ERROR: confirming temp user FAILED');
        }
    });
});

module.exports = router;
