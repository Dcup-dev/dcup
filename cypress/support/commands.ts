import { v4 as uuidv4 } from "uuid";
import { encode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { ConnectionTable, ProcessedFilesTable } from "@/db/schemas/connections";

interface FileConnectionQuery extends ConnectionTable {
  files: ProcessedFilesTable[]
}

Cypress.Commands.add("loginNextAuth", (fakeUser) => {
  cy.visit('/')
    .location('pathname')
    .should('eq', '/login')
    .task('addNewUser', fakeUser)
    .then(({ id, name, email, image }: any) => {
      Cypress.log({
        displayName: "NEXT-AUTH LOGIN",
        message: [`🔐 Authenticating | ${fakeUser.name}`],
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
    })
});

Cypress.Commands.add("uploadFiles", ({ files }) => {
  const filesPaths = files.map(fn => `cypress/fixtures/${fn}`)
  cy.get('input[name="fileUpload"]')
    .selectFile(filesPaths)
    .get('[data-test="btn-upload"]')
    .scrollIntoView()
    .get('[data-test="btn-upload"]')
    .click({ force: true })
})

Cypress.Commands.add("checkIndexedFiles", ({ conn, files }) => {
  Cypress.log({
    displayName: "INDEX Files",
    message: files.map(f => `name:${f.name}, totalPages: ${f.totalPages}`),
  });
  expect(conn.files.length).eq(files.length)
  cy.wrap(conn.files).each((file: { name: string, totalPages: number }, index: number) => {
    expect(conn.files[index].name).eq(file.name)
    expect(conn.files[index].totalPages).to.eq(file.totalPages)
    cy.task("getPointsById", { chunkIds: conn.files[index].chunksIds }).then(points => {
      const ps = points as any[]
      expect(ps.length).eq(conn.files[index].chunksIds.length)
      ps.map(p => {
        expect(p.payload._document_id).eq(file.name)
        expect(p.payload._metadata.source).eq('DIRECT_UPLOAD')
      })
    })
  })
})


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
      loginNextAuth({ name, email, image }: { name: string, email: string, image: string }): Chainable<Cookie>
      uploadFiles({ files }: { files: string[] }): Chainable<void>
      checkIndexedFiles({ conn, files }: { conn: FileConnectionQuery, files: { name: string, totalPages: number }[] }): Chainable<void>
      // login(email: string, password: string): Chainable<void>
      // drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}
