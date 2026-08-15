import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || "3388000000023185021";
    const clientEmail =
      process.env.GOOGLE_WALLET_CLIENT_EMAIL ||
      "mitesh-wallet-pass@gen-lang-client-0031781396.iam.gserviceaccount.com";
    let privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY || "";

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
