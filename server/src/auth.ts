import type { CookieOptions, RequestHandler } from "express";

import argon2 from "argon2";
import cookieParser from "cookie-parser";

// Import access to data
import userRepository from "./modules/user/userRepository";

import jwt from "jsonwebtoken";

import type { JwtPayload } from "jsonwebtoken";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 3600000 /* 1h */,
};

const login: RequestHandler = async (req, res, next) => {
  try {
    // Fetch a specific user from the database based on the provided email
    const user = await userRepository.readByEmailWithPassword(req.body.email);

    if (user == null) {
      res.sendStatus(422);

      return;
    }

    const verified = await argon2.verify(
      user.hashed_password,
      req.body.password,
    );

    if (verified === false) {
      res.sendStatus(422);

      return;
    }

    // Respond with the user and a signed token in JSON format (but without the hashed password)
    const token = await jwt.sign(
      { sub: user.id },
      process.env.APP_SECRET as string,
      {
        expiresIn: "1h",
      },
    );

    res.cookie("token", token, cookieOptions);

    const { hashed_password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

const logout: RequestHandler = async (req, res, next) => {
  // Web browsers and other compliant clients will only clear the cookie
  // if the given options is identical to those given to res.cookie(),
  // excluding expires and maxAge
  const { expires, maxAge, ...cookieOptionsExcludingExpiresAndMaxAge } =
    cookieOptions;

  res.clearCookie("token", cookieOptionsExcludingExpiresAndMaxAge);
  res.sendStatus(200);
};

// Options de hachage (voir documentation : https://github.com/ranisalt/node-argon2/wiki/Options)
// Recommandations **minimales** de l'OWASP : https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const hashingOptions = {
  type: argon2.argon2id,
  memoryCost: 19 * 2 ** 10 /* 19 Mio en kio (19 * 1024 kio) */,
  timeCost: 2,
  parallelism: 1,
};

const hashPassword: RequestHandler = async (req, res, next) => {
  try {
    // Extraction du mot de passe de la requête
    const { password } = req.body;

    // Hachage du mot de passe avec les options spécifiées
    const hashedPassword = await argon2.hash(password, hashingOptions);

    // Remplacement du mot de passe non haché par le mot de passe haché dans la requête
    req.body.hashed_password = hashedPassword;

    // Suppression du mot de passe non haché de la requête par mesure de sécurité
    req.body.password = null;

    next();
  } catch (err) {
    next(err);
  }
};

const addUser: RequestHandler = async (req, res, next) => {
  try {
    // Extract the user data from the request body
    const newUser = {
      email: req.body.email,
      hashed_password: req.body.hashed_password,
    };

    // Create the user
    const insertId = await userRepository.create(newUser);

    // Respond with HTTP 201 (Created) and the ID of the newly inserted user
    res.status(201).json({ insertId });
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

const verifyToken: RequestHandler = (req, res, next) => {
  try {
    // Vérifier la validité du token (son authenticité et sa date d'expériation)
    // En cas de succès, le payload est extrait et décodé
    let payload = jwt.verify(
      req.cookies.token,
      process.env.APP_SECRET as string,
    );

    if (typeof payload === "string") {
      payload = JSON.parse(payload) as JwtPayload;
    }

    if (payload.sub == null) {
      res.sendStatus(422);

      return;
    }

    req.auth = { ...payload, sub: payload.sub };

    next();
  } catch (err) {
    console.error(err);
    res.sendStatus(401);
  }
};

export default {
  login,
  logout,
  register: [hashPassword, addUser],
  wall: [cookieParser(), verifyToken],
};
