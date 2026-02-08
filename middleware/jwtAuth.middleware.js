import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/UserSchema.js";

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select("-password");
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } 
      catch (err) {
        return done(err, false);
      }
    }
  )
);
const jwtAuth = passport.authenticate("jwt", { session: false });

export default jwtAuth;
