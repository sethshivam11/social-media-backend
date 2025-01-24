export function Email(
  code: number,
  username: string,
  publicLink: string,
  isRandom?: boolean
) {
  return `
      <html
    lang="en"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:v="urn:schemas-microsoft-com:vml"
    >
    <head>
      <title></title>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <meta content="width=device-width, initial-scale=1.0" name="viewport" />
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Lobster+Two:wght@700&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          font-family: "Inter", serif;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: white;
        }

        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: inherit !important;
        }

        #MessageViewBody a {
          color: inherit;
          text-decoration: none;
        }

        p {
          line-height: inherit;
        }

        .desktop_hide,
        .desktop_hide table {
          mso-hide: all;
          display: none;
          max-height: 0px;
          overflow: hidden;
        }

        .image_block img + div {
          display: none;
        }

        @media (max-width: 520px) {
          .desktop_hide table.icons-inner {
            display: inline-block !important;
          }

          .icons-inner {
            text-align: center;
          }

          .icons-inner td {
            margin: 0 auto;
          }

          .mobile_hide {
            display: none;
          }

          .row-content {
            width: 100% !important;
          }

          .stack .column {
            width: 100%;
            display: block;
          }

          .mobile_hide {
            min-height: 0;
            max-height: 0;
            max-width: 0;
            overflow: hidden;
            font-size: 0px;
          }

          .desktop_hide,
          .desktop_hide table {
            display: table !important;
            max-height: none !important;
          }
        }
        #main-heading {
          font-size: 30px;
        }
        #sub-heading {
          font-size: 18px;
        }
      </style>
    </head>
    <body
      style="
        background-color: #ffffff;
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: none;
        text-size-adjust: none;
      "
    >
      <table
        border="0"
        cellpadding="0"
        cellspacing="0"
        class="nl-container"
        role="presentation"
        style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          background-color: #ffffff;
          background-image: none;
          background-position: top left;
          background-size: auto;
          background-repeat: no-repeat;
        "
        width="100%"
      >
        <tbody>
          <tr>
            <td>
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                class="row row-1"
                role="presentation"
                style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                width="100%"
              >
                <tbody>
                  <tr>
                    <td>
                      <table
                        align="center"
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        class="row-content stack"
                        role="presentation"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-radius: 0;
                          color: #000000;
                          width: 500px;
                          margin: 0 auto;
                        "
                        width="500"
                      >
                        <tbody>
                          <tr>
                            <td
                              class="column column-1"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                font-weight: 400;
                                text-align: left;
                                padding-bottom: 5px;
                                padding-top: 5px;
                                vertical-align: top;
                                border-top: 0px;
                                border-right: 0px;
                                border-bottom: 0px;
                                border-left: 0px;
                                font-family: Arial, 'Helvetica Neue', Helvetica,
                                  sans-serif;
                                text-align: center;
                                border-bottom: 2px solid grey;
                                width: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: start;
                              "
                              width="100%"
                            >
                              <img
                                src="https://res.cloudinary.com/dv3qbj0bn/image/upload/v1723703398/sociial/settings/vwrj1vvzzvvvbgzc8fdn.png"
                                style="
                                  width: 50px;
                                  object-fit: contain;
                                  margin: 10px 15px;
                                "
                              />
                              <span
                                style="
                                  font-size: 2.25rem;
                                  font-weight: 700;
                                  letter-spacing: -0.05em;
                                  margin: 20px 0;
                                  font-family: 'Lobster Two', serif;
                                "
                                >Sociial</span
                              >
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                class="row row-2"
                role="presentation"
                style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                width="100%"
              >
                <tbody>
                  <tr>
                    <td>
                      <table
                        align="center"
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        class="row-content stack"
                        role="presentation"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          color: #000000;
                          width: 500px;
                          margin: 0 auto;
                        "
                        width="500"
                      >
                        <tbody>
                          <tr>
                            <td
                              class="column column-1"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                font-weight: 400;
                                text-align: left;
                                padding-bottom: 5px;
                                padding-top: 5px;
                                vertical-align: top;
                                border-top: 0px;
                                border-right: 0px;
                                border-bottom: 0px;
                                border-left: 0px;
                              "
                              width="100%"
                            >
                              <table
                                border="0"
                                cellpadding="10"
                                cellspacing="0"
                                class="heading_block block-1"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td class="pad">
                                    <h1
                                      style="
                                        margin: 0;
                                        color: #1e0e4b;
                                        direction: ltr;
                                        font-family: 'Bitter', Georgia, Times,
                                          'Times New Roman', serif;
                                        font-weight: 700;
                                        letter-spacing: -1px;
                                        line-height: 200%;
                                        text-align: center;
                                        margin-top: 0;
                                        margin-bottom: 0;
                                        mso-line-height-alt: 80px;
                                      "
                                      id="main-heading"
                                    >
                                      <span class="tinyMce-placeholder"
                                        >Verify your account</span
                                      >
                                    </h1>
                                  </td>
                                </tr>
                              </table>
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="html_block block-2"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td class="pad">
                                    <div
                                      align="center"
                                      style="
                                        font-family: Arial, 'Helvetica Neue',
                                          Helvetica, sans-serif;
                                        text-align: center;
                                      "
                                      id="sub-heading"
                                    >
                                      <p style="margin: 10px 0; color: grey">
                                        Start your exciting journey!
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="html_block block-3"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td class="pad">
                                    <div
                                      align="center"
                                      style="
                                        font-family: Arial, 'Helvetica Neue',
                                          Helvetica, sans-serif;
                                        text-align: center;
                                      "
                                    >
                                      <div>
                                        <img
                                          src="https://res.cloudinary.com/dv3qbj0bn/image/upload/v1723483416/sociial/settings/xi8j95procutxupugtqi.jpg"
                                          style="width: 100%; object-fit: contain"
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table
                                border="0"
                                cellpadding="10"
                                cellspacing="0"
                                class="button_block block-4"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td class="pad">
                                    <div align="center" class="alignment">
                                    <p
                                        style="
                                          font-family: sans-serif;
                                          font-size: 0.8rem;
                                          color: grey;
                                        "
                                      >
                                        This code is valid for 5 minutes.
                                      </p>
                                      <a
                                        href=${
                                          isRandom
                                            ? `#`
                                            : `${publicLink}/verify?code=${code}&username=${username}`
                                        }
                                        style="
                                          text-decoration: none;
                                          display: block;
                                          color: #ffffff;
                                          background-color: #000000;
                                          border-radius: 4px;
                                          width: 50%;
                                          border-top: 0px solid transparent;
                                          font-weight: 400;
                                          border-right: 0px solid transparent;
                                          border-bottom: 0px solid transparent;
                                          border-left: 0px solid transparent;
                                          padding-top: 5px;
                                          padding-bottom: 5px;
                                          font-family: Arial, 'Helvetica Neue',
                                            Helvetica, sans-serif;
                                          font-size: 20px;
                                          text-align: center;
                                          mso-border-alt: none;
                                          word-break: keep-all;
                                        "
                                        target="_blank"
                                        ><span
                                          style="
                                            padding-left: 20px;
                                            padding-right: 20px;
                                            font-size: 20px;
                                            display: inline-block;
                                            letter-spacing: normal;
                                          "
                                          ><span
                                            style="
                                              word-break: break-word;
                                              line-height: 40px;
                                            "
                                            >${code}</span
                                          ></span
                                        ></a
                                      >
                                      <p
                                        style="
                                          font-family: sans-serif;
                                          font-size: 0.8rem;
                                        "
                                      >
                                        If you did not request for this code,
                                        please ignore this mail.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}
