<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
<!-- [![project_license][license-shield]][license-url] -->
[![LinkedIn][linkedin-shield]][linkedin-url]

<br />
<div align="center">
  <a href="https://sociial.vercel.app/home">
    <img src="https://sociial.vercel.app/logo.svg" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Sociial</h3>

  <p align="center">
    This is the backend for Sociial, a social media app built with Node.js, Express.js, Socket.IO, and MongoDB. The backend handles user authentication, real-time messaging (chats, group chats, reacts), media management (posts, videos, comments, likes), audio/video calls (WebRTC) and much more.
    <br />
    <a href="https://github.com/sethshivam11/social-media-backend"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://sociial.vercel.app/home">View Demo</a>
    &middot;
    <a href="https://github.com/sethshivam11/social-media-backend/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/sethshivam11/social-media-backend/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <!-- <li><a href="#license">License</a></li> -->
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

[![Product Name Screen Shot][product-screenshot]](https://sociial.vercel.app/home)

### Built With

- ![Node.js Badge](https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=fff&style=for-the-badge)
- ![MongoDB Badge](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=fff&style=for-the-badge)
- ![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)
- ![Socket.io Badge](https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=fff&style=for-the-badge)
- ![Cloudinary Badge](https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=fff&style=for-the-badge)
- ![Passport Badge](https://img.shields.io/badge/Passport-34E27A?logo=passport&logoColor=000&style=for-the-badge)
- ![JSON Web Tokens Badge](https://img.shields.io/badge/JSON%20Web%20Tokens-000?logo=jsonwebtokens&logoColor=fff&style=for-the-badge)
- ![Firebase Badge](https://img.shields.io/badge/Firebase-DD2C00?logo=firebase&logoColor=fff&style=for-the-badge)
- ![Google Authenticator Badge](https://img.shields.io/badge/Google%20Authenticator-4285F4?logo=googleauthenticator&logoColor=fff&style=for-the-badge)

## Getting Started

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/sethshivam11/social-media-backend.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Enter your environment variables in `nodemon.json`

   ```js
   {
    "env": {
      "MONGODB_URI": "YOUR_MONGODB_URI",
      "DB_NAME": "ANY_DB_NAME",
      "PORT": 3000,
      "CLOUDINARY_CLOUD_NAME": "YOUR_CLOUD_NAME",
      "CLOUDINARY_API_KEY": "YOUR_API_KEY",
      "CLOUDINARY_API_SECRET": "YOUR_API_SECRET",
      "CLOUDINARY_UPLOAD_PRESET": "YOUR_CLOUDINARY_UPLOAD_PRESET",
      "TOKEN_SECRET": "YOUR_TOKEN_SECRET",
      "CORS_ORIGIN": "YOUR_CORS_ORIGIN",
      "MAIL_USER": "YOUR_MAIL_ID",
      "MAIL_PASSWORD": "YOUR_MAIL_PASSWORD",
      "ICON_URL": "YOUR_ICON_URL",
      "PUBLIC_URL": "YOUR_PUBLIC_URL",
      "FIREBASE_ADMIN": "YOUR_FIREBASE_ADMIN_JSON",
      "IMAGE_URL": "YOUR_LOGO_IMAGE_URL",
      "RELOAD_INTERVAL": "YOUR_RELOAD_INTERVAL",
      "COOKIE_EXPIRY": "ANY_COOKIE_EXPIRY",
      "NODE_ENV": "production",
      "GOOGLE_CLIENT_ID": "YOUR_GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET": "YOUR_GOOGLE_CLIENT_SECRET",
      "GOOGLE_CALLBACK_URL": "YOUR_GOOGLE_CALLBACK_URL",
      "CLIENT_SSO_REDIRECT_URL": "YOUR_CLIENT_SSO_REDIRECT_URL",
    }
   }

   ```

4. Change git remote url to avoid accidental pushes to base project
   ```sh
   git remote set-url origin github-username/repo-url
   git remote -v # confirm the changes
   ```

## Usage

You can get the API documentation [here](https://documenter.getpostman.com/view/37731620/2sAY4rGR2L).

For frontend code visit https://github.com/sethshivam11/sociial

You can test them and use it in your projects as well.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Top contributors:

<a href="https://github.com/sethshivam11/social-media-backend/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=sethshivam11/social-media-backend" alt="contrib.rocks image" />
</a>

<!-- ## License

Distributed under the project_license. See `LICENSE.txt` for more information. -->

## Contact

Shivam - [@sethshivam11](https://x.com/sethshivam11) - sociial@gmail.com

Project Link: [https://github.com/sethshivam11/social-media-backend](https://github.com/sethshivam11/social-media-backend)

[contributors-shield]: https://img.shields.io/github/contributors/sethshivam11/social-media-backend.svg?style=for-the-badge
[contributors-url]: https://github.com/sethshivam11/social-media-backend/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/sethshivam11/social-media-backend.svg?style=for-the-badge
[forks-url]: https://github.com/sethshivam11/social-media-backend/network/members
[stars-shield]: https://img.shields.io/github/stars/sethshivam11/social-media-backend.svg?style=for-the-badge
[stars-url]: https://github.com/sethshivam11/social-media-backend/stargazers
[issues-shield]: https://img.shields.io/github/issues/sethshivam11/social-media-backend.svg?style=for-the-badge
[issues-url]: https://github.com/sethshivam11/social-media-backend/issues
[license-shield]: https://img.shields.io/github/license/sethshivam11/social-media-backend.svg?style=for-the-badge
[license-url]: https://github.com/sethshivam11/social-media-backend/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&colorB=555
[linkedin-url]: https://linkedin.com/in/sethshivam11
[product-screenshot]: https://sociial.vercel.app/hero-light.png

