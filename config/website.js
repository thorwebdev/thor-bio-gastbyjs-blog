const tailwind = require("../tailwind");

module.exports = {
  pathPrefix: "/", // Prefix for all links. If you deploy your site to example.com/portfolio your pathPrefix should be "/portfolio"

  siteTitle: "News from Thor", // Navigation and Site Title
  siteTitleAlt: "Thor News", // Alternative Site title for SEO
  siteTitleShort: "Thor News", // short_name for manifest
  siteUrl: "http://thor.news", // Domain of your site. No trailing slash!
  siteLanguage: "en", // Language Tag on <html> element
  siteLogo: "/logo.png", // Used for SEO and manifest
  siteDescription: "Portfolio and Blog by Thorsten Schaeff",

  // siteFBAppID: '123456789', // Facebook App ID - Optional
  userTwitter: "@thorwebdev", // Twitter Username
  ogSiteName: "Thorsten Schaeff", // Facebook Site Name
  ogLanguage: "en_US", // Facebook Language

  // Manifest and Progress color
  themeColor: tailwind.colors.orange,
  backgroundColor: tailwind.colors.blue
};
