import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const DEFAULT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDGda/5m9DL0yo5
XRObX9aouHQUs6EzPUXGCpg+P0OYmdtTvVpKOinLGdTBZoajltA+INsBWVkgV5fj
FVtj0tYH4YNqsgseE9KrDqLtnOPael1p0JheMTOqEqiDaWOELV1HZF/5FLi4zB+U
Xbf1zOqknmHQ6bsT4gv2IvG8k3jwDL/XeAXb4oVLhy/fXGNOicx9cKxKhxri0S0F
KtKQB2zngt34aRnsMPwkMmgSy4Du0GPcMbQnTjH41zWgTAH9Miz6sDwqG9n/4yck
jcyzwWanGH4IQZsbryNFeTLr78Vx7yBperfYT9MEHKKLMC3wzaxNt7wahUdYNms8
B/JuRslJAgMBAAECggEAPh260R0QaqNy3VaBGwoRtWhaSNp6U3/TlWtegGkrvpk1
eU3Uc1QmHaA9o7Tz4kMDddaxxYfSKhnQe+6E1sc4X2oZyGzmpujccNbZbxbCiHDx
SPvVnPG4cnx5ivwS/l12izBjC6KNOKYHIlh9Ci2zqYe7JPjrKYuAY+9HC1d7LGK7
2iu0Ypv6A6pLxv4koKJDnkeUyEs6GLeH0WdhV9vNE/fYiPzcNa7/LSncJWWbXp0+
IHXHgv+EmT4vhLA65dP2g2/Ihu8r+ZTrKnnotYLtekMWUO8jFRf8qBJ3yesmlJ/Y
2emAtDKYCnRJn2mbLftX4E5vD2GzO2Fnxew//BPQ4wKBgQDusya8M4rx6xRadnxH
8wPU8r8j8v+cnVXdkzJVowAvssm3OjjdgdD4ciUuvP+vdVLI6Joq4E4JNnEjK3xk
sYw/un0LkK4pWivP+Tx7qcu/fTHKbARCsWREq39C1FW5vKxK5ZW59GUdPaufHdu5
+crp42T8z/Ti6RZL4vTdePpJSwKBgQDU1+tXsaKkfD6MbzKX3NtfPTn3HiBiHE07
pwWActU4IR/B2U8nOT6DWnpI1q0NHvOgojwWhLvJBtrzvOS8cGkJscQapNoDVOob
WlrEm0PJDrmI6LgGhgXIRHXhYr1QlTNKTtFr3pi369DHedg8iHLNWjOBNfmGKSqB
Ce/1H5WPOwKBgGGmwvL9dxtPG62CiYd5wJiOkmmnkLDGoQkbndzw6TOaRfGCjR75
a78oG1QKl+N08OAmYGOoDeSw9An6UVJ0XDb6GQvxLX7XV9MmWHsS1LrLAeKY3AlY
vvdk3ZQ+f6+TozykveMsO22B/EMFGQ31RfD3SSov/TQTPT7gY2JzipkPAoGAePJt
aHqnmmKDxJeXn1ZATmFjY/p5mmbMuH4TkUcvxGKGQkhzQy2zST8LyAI9efxBouEt
1fn9H6HGn8SSEkaqWXjrn9xXipchJQP2GkzEeybj5Vmg4QwdkwzcE4RhYb421B3v
wSVPkQvuqruhVdyPqAN+ywjZzxPrdEIqWhdljGsCgYAK6SuHPSddkdmxMXjz5zMs
IsmG4XSSykO1peXJjDIQ7+ejh9RrZcQ5VcjXAmwjw7aVEiUwbaLA2NS86jfup2Xa
RyCBQtDu4NvDWq7ppQrSLqXzyYhPlCjVinqHOAHlpSOcvgYr0HqntsyFtQL54R0l
t3Sn/9jDZq5TE9TOElRb1A==
-----END PRIVATE KEY-----`;

export async function GET() {
  try {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || "3388000000023185021";
    const clientEmail =
      process.env.GOOGLE_WALLET_CLIENT_EMAIL ||
      "mitesh-wallet-pass@gen-lang-client-0031781396.iam.gserviceaccount.com";
    let privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

    if (!privateKey) {
      return NextResponse.json({ error: "Missing private key" }, { status: 500 });
    }

    // Replace escaped newlines if passed via single-line env string
    privateKey = privateKey.replace(/\\n/g, "\n");

    const classId = `${issuerId}.mitesh_executive_pass_v1`;
    const objectId = `${issuerId}.mitesh_pass_${Date.now()}`;

    // Define the Generic Pass Template (Class + Object)
    const genericClass = {
      id: classId,
      issuerName: "Mitesh Shah",
      reviewStatus: "UNDER_REVIEW",
    };

    const genericObject = {
      id: objectId,
      classId: classId,
      logo: {
        sourceUri: {
          uri: "https://miteshshah.xyz/opengraph-image.jpg",
        },
        contentDescription: {
          defaultValue: {
            language: "en",
            value: "Mitesh Shah Logo",
          },
        },
      },
      cardTitle: {
        defaultValue: {
          language: "en",
          value: "MITESH SHAH",
        },
      },
      header: {
        defaultValue: {
          language: "en",
          value: "THE ARCHITECT",
        },
      },
      subheader: {
        defaultValue: {
          language: "en",
          value: "ENTERPRISE IT ARCHITECTURE · MAJOR INCIDENT COMMAND",
        },
      },
      hexBackgroundColor: "#020204",
      barcode: {
        type: "QR_CODE",
        value: "https://miteshshah.xyz",
        alternateText: "miteshshah.xyz",
      },
      textModulesData: [
        {
          id: "role_1",
          header: "DISCIPLINE",
          body: "Enterprise IT Architecture & Strategy",
        },
        {
          id: "role_2",
          header: "OPERATIONS",
          body: "Major Incident Command & Project Management",
        },
        {
          id: "contact_phone",
          header: "DIRECT LINE",
          body: "+1 639 590 4445",
        },
        {
          id: "contact_email",
          header: "ENCRYPTED EMAIL",
          body: "mitesh@miteshshah.xyz",
        },
      ],
      linksModuleData: {
        uris: [
          {
            uri: "https://miteshshah.xyz",
            description: "Official Portfolio & Systems Hub",
          },
          {
            uri: "https://www.linkedin.com/in/mitesh-shah-6415777a/",
            description: "Executive LinkedIn Profile",
          },
          {
            uri: "https://wa.me/16395904445",
            description: "Direct WhatsApp Line",
          },
        ],
      },
    };

    const claims = {
      iss: clientEmail,
      aud: "google",
      origins: ["https://miteshshah.xyz", "https://www.miteshshah.xyz", "http://localhost:3000"],
      typ: "savetowallet",
      payload: {
        genericClasses: [genericClass],
        genericObjects: [genericObject],
      },
    };

    const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.json({ saveUrl });
  } catch (error: any) {
    console.error("Google Wallet generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate pass" }, { status: 500 });
  }
}
