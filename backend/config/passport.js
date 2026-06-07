const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const User = require("../models/user");


// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            await user.save();
          } else {
            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              profilePic: profile.photos[0]?.value,
            });
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "dummy",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "dummy",
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.username}@github.com`;
        
        if (!user) {
          user = await User.findOne({ email });
          if (user) {
            user.githubId = profile.id;
            await user.save();
          } else {
            user = new User({
              name: profile.displayName || profile.username,
              email: email,
              githubId: profile.id,
              profilePic: profile.photos[0]?.value,
            });
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// LinkedIn Strategy
const linkedinStrategy = new LinkedInStrategy(
  {
    clientID: process.env.LINKEDIN_CLIENT_ID || "dummy",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "dummy",
    callbackURL: "/api/auth/linkedin/callback",
    scope: ["openid", "profile", "email"],
    state: true,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ linkedinId: profile.id });
      let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          user.linkedinId = profile.id;
          user.linkedinData = profile._json; // Store all raw data
          await user.save();
        } else {
          user = new User({
            name: profile.displayName,
            email: email,
            linkedinId: profile.id,
            profilePic: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            linkedinData: profile._json, // Store all raw data from LinkedIn
          });
          await user.save();
        }
      } else {
         // update linkedin data on every login
         user.linkedinData = profile._json;
         await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
);

// Override userProfile to fetch from LinkedIn OpenID Connect UserInfo endpoint
linkedinStrategy.userProfile = function(accessToken, done) {
  this._oauth2.get(
    "https://api.linkedin.com/v2/userinfo",
    accessToken,
    function(err, body, res) {
      if (err) {
        return done(new Error("Failed to fetch user profile: " + err.message));
      }
      try {
        const json = JSON.parse(body);
        const profile = {
          provider: "linkedin",
          id: json.sub,
          displayName: json.name,
          name: {
            familyName: json.family_name,
            givenName: json.given_name
          },
          emails: [{ value: json.email }],
          photos: json.picture ? [{ value: json.picture }] : [],
          _raw: body,
          _json: json
        };
        done(null, profile);
      } catch (e) {
        done(e);
      }
    }
  );
};

passport.use(linkedinStrategy);


// Serialize / Deserialize User
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
