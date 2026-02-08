import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/UserSchema.js";


passport.use(
    new LocalStrategy(
        // letting the LocalStrategy know that we are using 'username' as email
        { usernameField: 'email', passwordField: 'password' },
        async (email, password, done) => {
        try {
            const user = await User.findOne({ email : email, isDeleted: false }).select("+password");

            if (!user) {
                return done(null, false, { message: "User not found" });
            }

            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                return done(null, false, { message: "Incorrect Password" });
            }

            return done(null, user);
        }
        catch(err) {
           return done(err);
        }
    })
);
const localAuthMiddleware = passport.authenticate('local', { session: false });

export default localAuthMiddleware;