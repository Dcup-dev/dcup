import { ConnectionTable, ProcessedFilesTable } from "@/db/schemas/connections"


interface FileConnectionQuery extends ConnectionTable {
  files: ProcessedFilesTable[]
}
const fakeUser = {
  name: "test man",
  email: "tester@dcup.dev",
  provider: "google",
  image: `https://via.placeholder.com/200/7732bb/c0392b.png?text=tester`,
  plan: "OS"
}
describe.only("Dropbox connection UI Testing", () => {
  beforeEach(() => {

    // create Collection
    cy.visit('/')
    cy.wait(1000)
    cy.task("createCollection")

    // login 
    cy.loginNextAuth(fakeUser)
      .visit('/')
      .location('pathname')
      .should('eq', '/')
      .visit('/')
      .location('pathname')
      .should('eq', '/')

    // create new connection 
    cy.intercept("GET", "https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=reqn50m9i1xnewd&redirect_uri=http://localhost:3000/api/connections/dropbox/callback&token_access_type=offline&scope=files.metadata.read%20files.content.read%20email%20openid%20account_info.read&force_reapprove=true", (res) => {
      res.reply(200, "OK")
    }).as("dropboxAuth")

    cy.visit('/connections/new')
      .get('[data-test="connection-card"]')
      .contains('Dropbox', { matchCase: false })
      .get('[data-test="btn-dropbox"]')
      .click();

    cy.wait("@dropboxAuth")
    cy.request("/api/connections/dropbox/callback?code=FAKE_CODE")
      .then(res => cy.log(`status: ${res.status}`))
  })

  afterEach(() => {
    cy.task('deleteUser', { email: fakeUser.email })
    cy.task("deleteCollection")
  })

  it("It should handle file upload, addition, and removal with database synchronization", () => {
    cy.task('getConnections', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: ConnectionTable[] }
        cy.visit('/connections')
          .get(`[data-test="btn-config-${conns[0].identifier}"]`)
          .click()
          .get('input[name="folderName"]')
          .clear()
          .type('_TEST_/invo.pdf')
          .get(`[data-test="btn-config-connection"]`)
          .click()
      })
    cy.wait(5_000)
    // Check 
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DROPBOX")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, source: "DROPBOX", files: [{ name: "invo.pdf", totalPages: 3 }] })

        cy.get('[data-test="folderName"]').should('contain.text', "_TEST_/invo.pdf")
        cy.get('[data-test="processedFile"]').should('contain.text', 1)
        cy.get('[data-test="processedPage"]').should('contain.text', 3)

        cy.get(`[data-test="btn-config-${conn.identifier}"]`)
          .click()
          .get('input[name="folderName"]')
          .clear()
          .type('_TEST_/invo.pdf/sample.pdf')
          .get(`[data-test="btn-config-connection"]`)
          .click()
      })

    cy.wait(5_000)
    //Check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DROPBOX")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({
          conn,
          source: "DROPBOX",
          files: [{ name: "sample.pdf", totalPages: 1 }, { name: "invo.pdf", totalPages: 3 }]
        })

        cy.get('[data-test="folderName"]').should('contain.text', '_TEST_/invo.pdf/sample.pdf')
        cy.get('[data-test="processedFile"]').should('contain.text', 2)
        cy.get('[data-test="processedPage"]').should('contain.text', 4)

        cy.get(`[data-test="btn-config-${conn.identifier}"]`)
          .click()
          .get('input[name="folderName"]')
          .clear()
          .type('_TEST_/sample.pdf')
          .get(`[data-test="btn-config-connection"]`)
          .click()
      })

    cy.wait(5_000)
    // check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DROPBOX")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, source: "DROPBOX", files: [{ name: "sample.pdf", totalPages: 1 }] })
      })

    cy.get('[data-test="folderName"]').should('contain.text', '_TEST_/sample.pdf')
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 1)
  })
})
