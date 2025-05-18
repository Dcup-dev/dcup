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

Cypress.Commands.add("checkIndexedFiles", ({ conn, files, source }) => {
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
        expect(p.payload._metadata.source).eq( source ?? 'DIRECT_UPLOAD')
      })
    })
  })
})

type UploadRequest = {
  fileName?: string,
  links?: string[],
  pageLimit?: string,
  metadata?: string,
  identifier?: string,
  apiKey: string,
  url?: string,
  method?: string,
  response: {
    code: string,
    message: string
  }
}
Cypress.Commands.add("uploadFileWithApi", ({ fileName, apiKey, url, method, links, response, metadata, identifier, pageLimit }) => {
  cy.fixture(fileName ?? "sample.pdf", 'base64').then(base64pdf => {
    cy.window().then(win => {
      const buffer = Buffer.from(base64pdf, 'base64')
      const formData = new win.FormData()
      fileName && formData.append('files', new Blob([buffer], { type: 'application/pdf' }), fileName)
      links?.map(link => formData.append("links", link))
      metadata && formData.set("metadata", metadata)
      identifier && formData.set("identifier", identifier)
      pageLimit && formData.set('pageLimit', pageLimit)
      return win.fetch(url ?? '/api/upload', {
        method: method ?? 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: formData
      })
    }).then(res => {
      expect(res.status).to.equal(200)
      return res.json()
    }).then(body => {
      expect(body.code).eq(response.code)
      expect(body.message).eq(response.message)
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
//
//
declare global {
  namespace Cypress {
    interface Chainable {
      loginNextAuth({ name, email, image }: { name: string, email: string, image: string }): Chainable<Cookie>
      uploadFiles({ files }: { files: string[] }): Chainable<void>
      checkIndexedFiles({ conn, files, source }: { conn: FileConnectionQuery, files: { name: string, totalPages: number }[], source?:string }): Chainable<void>
      uploadFileWithApi({ fileName, apiKey, response, url }: UploadRequest): Chainable<void>
      // login(email: string, password: string): Chainable<void>
      // drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}
