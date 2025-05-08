import { v4 as uuidv4 } from "uuid";
import { encode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

Cypress.Commands.add("loginNextAuth", ({ id, name, email, image }) => {
  Cypress.log({
    displayName: "NEXT-AUTH LOGIN",
    message: [`🔐 Authenticating | ${name}`],
  });

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 30 * 24 * 60 * 60; // 30 days
  const cookieName = "next-auth.session-token";

  // Only include the exact fields NextAuth expects:
  const tokenPayload: JWT = {
    id,
    name,
    email,
    picture: image,
    iat: now,
    exp: expiry,
    jti: uuidv4(),
  };

  return cy
    .wrap(encode({ token: tokenPayload, secret: Cypress.env("NEXTAUTH_SECRET") }))
    .then((encrypted) => {
      return cy.setCookie(cookieName, encrypted as string, {
        log: false,
        httpOnly: true,
        path: "/",
        expiry,
      });
    });
});


/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
declare global {
  namespace Cypress {
    interface Chainable {
      loginNextAuth({ id, name, email, image }: { id: string, name: string, email: string, image: string }): Chainable<Cookie>
      // login(email: string, password: string): Chainable<void>
      // drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}
