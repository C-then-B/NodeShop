"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const pgSession = require('connect-pg-simple')(express_session_1.default);
const csurf_1 = __importDefault(require("csurf"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const admin_1 = __importDefault(require("./routes/admin"));
const shop_1 = __importDefault(require("./routes/shop"));
const auth_1 = __importDefault(require("./routes/auth"));
const errorController = __importStar(require("./controllers/error"));
const database_1 = require("./controllers/database");
const mailer_1 = require("./controllers/mailer");
const user_1 = require("./models/user");
const auth_2 = require("./controllers/auth");
// Init dotenv
dotenv_1.default.config({
    path: path_1.default.join(path_1.default.dirname(process.mainModule.filename), '../', '.env')
});
const app = express_1.default();
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_session_1.default({
    store: new pgSession({
        pool: database_1.DatabaseController.pool
    }),
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));
// Every browser will be a guest by default, the guest gets deleted
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.user === undefined) {
        yield user_1.User.createGuest().then((guest) => __awaiter(void 0, void 0, void 0, function* () {
            yield auth_2.setUser(req.session, guest);
        }));
    }
    next();
}));
app.use(csurf_1.default());
app.use(connect_flash_1.default());
// Set a new csrfToken for every single request.
// The csrfToken only gets checked on every POST request through the views
// such as on navigation.ejs (logout button), add-to-cart.ejs and so on.
app.use((req, res, next) => {
    (res.locals.isLoggedIn = req.session.isLoggedIn),
        (res.locals.csrfToken = req.csrfToken()),
        next();
});
app.use(admin_1.default);
app.use(shop_1.default);
app.use(auth_1.default);
app.use('/', errorController.get404);
mailer_1.init();
database_1.DatabaseController.init()
    .then(() => {
    app.listen(3000, () => console.log('Node server listening!'));
})
    .catch(err => console.log(err));
//# sourceMappingURL=app.js.map