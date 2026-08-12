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
      callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback",
      scope: ["user:email", "public_repo"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.username}@github.com`;
        
        if (!user) {
          user = await User.findOne({ email });
        }
        
        if (!user) {
          user = new User({
            name: profile.displayName || profile.username,
            email: email,
            githubId: profile.id,
            githubUsername: profile.username,
            profilePic: profile.photos?.[0]?.value,
          });
        } else {
          user.githubId = profile.id;
          user.githubUsername = profile.username;
        }

        user._tempAccessToken = accessToken;
        await user.save();
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
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || "http://localhost:5000/api/auth/linkedin/callback",
    scope: ["openid", "profile", "email"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ linkedinId: profile.id });
      let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

      if (!user && email) {
        user = await User.findOne({ email });
      }

      const profilePicUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
      const computedProfileUrl = profilePicUrl || `https://linkedin.com/in/${(profile.displayName || "user").toLowerCase().replace(/\s+/g, '-')}`;

      if (user) {
        user.linkedinId = profile.id;
        user.linkedinData = profile._json;
        user.linkedinProfileUrl = user.linkedinProfileUrl || computedProfileUrl;
        if (profilePicUrl) {
          user.profilePic = profilePicUrl;
        }
        user.linkedinLocked = true;
        await user.save();
      } else {
        user = new User({
          name: profile.displayName || "LinkedIn User",
          email: email || `linkedin_${profile.id}@lnbti.edu.lk`,
          linkedinId: profile.id,
          profilePic: profilePicUrl,
          linkedinProfileUrl: computedProfileUrl,
          linkedinLocked: true,
          linkedinData: profile._json,
        });
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
  this._oauth2.setAccessTokenName("access_token");
  this._oauth2._useAuthorizationHeaderForGET = true;
  this._oauth2.get(




    "https://api.linkedin.com/v2/userinfo",
    accessToken,
    function(err, body, res) {
      if (err) {
        console.error("❌ LinkedIn OIDC profile fetch error:", err);
        return done(new Error("Failed to fetch user profile: " + (err.message || JSON.stringify(err) || err)));
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
