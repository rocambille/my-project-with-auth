import express from "express";

const router = express.Router();

/* ************************************************************************* */
// Define Your API Routes Here
/* ************************************************************************* */

// Define item-related routes
import itemActions from "./modules/item/itemActions";

router.get("/api/items", itemActions.browse);
router.get("/api/items/:id", itemActions.read);

// Define user-related routes
import userActions from "./modules/user/userActions";

router.get("/api/users", userActions.browse);
router.get("/api/users/:id", userActions.read);

// Define auth-related routes
import auth from "./auth";

router.post("/api/login", auth.login);
router.post("/api/logout", auth.logout);
router.post("/api/register", auth.register);

router.use(auth.wall);

router.post("/api/items", itemActions.add);

/* ************************************************************************* */

export default router;
