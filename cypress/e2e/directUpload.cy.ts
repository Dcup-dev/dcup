import { ConnectionTable, ProcessedFilesTable } from "@/db/schemas/connections"

interface FileConnectionQuery extends ConnectionTable {
  files: ProcessedFilesTable[]
}

describe("Direct Upload UI", () => {

  const fakeUser = {
    name: "test man",
    email: "tester@dcup.dev",
    provider: "google",
    image: `https://via.placeholder.com/200/7732bb/c0392b.png?text=tester`,
    plan: "OS"
  }

  beforeEach(() => {
    cy.visit('/')
    cy.wait(1000)
    cy.task("createCollection")
    // login 
    cy.loginNextAuth(fakeUser)
      .visit('/')
      .location('pathname')
      .should('eq', '/')

    cy.visit('/connections')
      .get('[data-test="btn-upload-files"]')
      .click()
  })

  afterEach(() => {
    cy.task('deleteUser', { email: fakeUser.email })
    cy.task("deleteCollection")
  })

  it('should handle file upload, addition, and removal with database synchronization', () => {

    // Upload 1 pdf  
    cy.uploadFiles({ files: ['invo.pdf'] })
    cy.wait(5000)

    // Check 
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
      })
    cy.wait(1000)

    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 3)

    // add new pdf file 
    cy.get('[data-test="btn-config"]')
      .click()

    cy.uploadFiles({ files: ["sample.pdf"] })
    cy.wait(5000)

    //Check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }, { name: "sample.pdf", totalPages: 1 }] })
      })
    cy.wait(1000)

    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 2)
    cy.get('[data-test="processedPage"]').should('contain.text', 4)


    // remove one pdf file
    cy.get('[data-test="btn-config"]')
      .click()

    cy.get('[data-test="btn-remove-invo.pdf"]')
      .click()

    cy.get('[data-test="btn-upload"]')
      .click({ force: true })
    cy.wait(5000)

    // check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "sample.pdf", totalPages: 1 }] })
      })

    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 1)
  })

  it('should update and clear connection metadata for indexed files', () => {
    cy.get('input[name="identifier"]')
      .clear()
      .type("testing_connection")
      .get('textarea[name="metadata"]')
      .clear()
      .type('{"job": "my test files"}', { parseSpecialCharSequences: false })
    cy.uploadFiles({ files: ['invo.pdf'] })
    cy.wait(5000)

    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.identifier).eq("testing_connection")
        expect(conn.metadata).eq('{"job": "my test files"}')
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
      })
    cy.wait(1000)

    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 3)

    // update metadata 
    cy.get('[data-test="btn-config"]')
      .click()

    cy.get('input[name="identifier"]')
      .clear()
      .type("other_testing_connection")
      .get('textarea[name="metadata"]')
      .clear()
      .type('{"job": "other tests"}', { parseSpecialCharSequences: false })

    cy.get('[data-test="btn-upload"]')
      .click({ force: true })

    cy.wait(5000)
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.identifier).eq("other_testing_connection")
        expect(conn.metadata).eq('{"job": "other tests"}')
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
      })
    cy.wait(1000)
    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 3)

    cy.get('[data-test="btn-config"]')
      .click()

    cy.get('textarea[name="metadata"]')
      .clear()

    cy.get('[data-test="btn-upload"]')
      .click({ force: true })

    cy.wait(5000)
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.identifier).eq("other_testing_connection")
        expect(conn.metadata).eq('{}')
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
      })
    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 3)
  })

  it('should enforce page limits during file operations and maintain constraints', () => {

    // Upload 1 pdf  with 3 pages, it should process only 2 
    cy.get('input[name="pageLimit"]')
      .type('2')
    cy.uploadFiles({ files: ['invo.pdf'] })
    cy.wait(5000)

    // Check 
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.folderName).eq("*")
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).eq(2)
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 2 }] })
      })
    cy.task("getPointsNumberByFileName", { fileName: "invo.pdf" })
      .then(points => {
        expect(points).to.be.greaterThan(0)
      })
    cy.wait(1000)

    // check the UI
    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 2)


    // add new pdf file with 1 page, it should not index it or store it 
    cy.get('[data-test="btn-config"]')
      .click()

    cy.uploadFiles({ files: ["sample.pdf"] })
    cy.wait(5000)

    //Check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).eq(2)
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 2 }] })
      })
    cy.task("getPointsNumberByFileName", { fileName: "invo.pdf" })
      .then(points => {
        expect(points).to.be.greaterThan(0)
      })
    cy.task("getPointsNumberByFileName", { fileName: "sample.pdf" })
      .then(points => {
        expect(points).eq(0)
      })
    cy.wait(1000)

    // check the UI
    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 2)

    // remove the only pdf file 
    // with 3 pages and now we have space it should processed smail one
    cy.get('[data-test="btn-config"]')
      .click()

    cy.get('[data-test="btn-remove-invo.pdf"]')
      .click()

    cy.get('[data-test="btn-upload"]')
      .click({ force: true })
    cy.wait(5000)

    // check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).eq(2)
        expect(conn.limitFiles).to.be.null
        expect(conn.files.length).eq(0)
      })
    cy.task("getPointsNumberByFileName", { fileName: "invo.pdf" })
      .then(points => {
        expect(points).eq(0)
      })
    cy.task("getPointsNumberByFileName", { fileName: "sample.pdf" })
      .then(points => {
        expect(points).eq(0)
      })
    cy.wait(1000)

    // check the UI
    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 0)
    cy.get('[data-test="processedPage"]').should('contain.text', 0)
  })

  it('should distribute page processing across files to respect page limits', () => {
    // Upload 1 pdf  with 1 page, it should process only 1
    cy.get('input[name="pageLimit"]')
      .type('2')
    cy.uploadFiles({ files: ['sample.pdf'] })
    cy.wait(5000)

    // Check 
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.folderName).eq("*")
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).eq(2)
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "sample.pdf", totalPages: 1 }] })
      })
    cy.task("getPointsNumberByFileName", { fileName: "sample.pdf" })
      .then(points => {
        expect(points).to.be.greaterThan(0)
      })
    cy.wait(1000)

    // check the UI
    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 1)
    cy.get('[data-test="processedPage"]').should('contain.text', 1)


    // add new pdf file with 3 pages, it should process 2 from this file 
    cy.get('[data-test="btn-config"]')
      .click()

    cy.uploadFiles({ files: ["invo.pdf"] })
    cy.wait(5000)

    //Check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).eq(2)
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 1 }, { name: "sample.pdf", totalPages: 1 }] })
      })
    cy.task("getPointsNumberByFileName", { fileName: "invo.pdf" })
      .then(points => {
        expect(points).to.be.greaterThan(0)
      })
    cy.task("getPointsNumberByFileName", { fileName: "sample.pdf" })
      .then(points => {
        expect(points).to.be.greaterThan(0)
      })
    cy.wait(1000)

    // check the UI
    cy.get('[data-test="folderName"]').should('contain.text', "*")
    cy.get('[data-test="processedFile"]').should('contain.text', 2)
    cy.get('[data-test="processedPage"]').should('contain.text', 2)

    // Delete connection
    cy.task('getConnections', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: ConnectionTable[] }
        cy.get(`[data-test="btn-delete-${conns[0].identifier}"]`)
          .click()
          .get(`[data-test="delete-connection-btn"]`)
          .click()

        cy.get('[data-test="delete-connection-btn"]', { timeout: 15000 })
          .should('not.exist');
        cy.get(`[data-test="btn-delete-${conns[0].identifier}"]`, { timeout: 15000 })
          .should('not.exist')
      })
    cy.wait(1000)

    // check
    cy.task('getConnections', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: ConnectionTable[] }
        expect(conns).to.have.length(0);
      })
    cy.task("getPointsNumberByFileName", { fileName: "invo.pdf" })
      .then(points => {
        expect(points).eq(0)
      })
    cy.task("getPointsNumberByFileName", { fileName: "sample.pdf" })
      .then(points => {
        expect(points).eq(0)
      })
  })

  it("should remove all files that related to the connection when user delete the connection", () => {
    // Upload 2 pdf  
    cy.uploadFiles({ files: ['invo.pdf', "sample.pdf"] })
    cy.wait(5000)

    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }, { name: "sample.pdf", totalPages: 1 }] })
      })
    cy.wait(1000)

    // check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.files.length).eq(2)
      })
    cy.task("getPointsNumberByFileName", { fileName: "invo.pdf" })
      .then(points => {
        expect(points).greaterThan(0)
      })
    cy.task("getPointsNumberByFileName", { fileName: "sample.pdf" })
      .then(points => {
        expect(points).greaterThan(0)
      })

    // Delete connection
    cy.task('getConnections', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: ConnectionTable[] }
        cy.get(`[data-test="btn-delete-${conns[0].identifier}"]`)
          .click()
          .get(`[data-test="delete-connection-btn"]`)
          .click()

        cy.get('[data-test="delete-connection-btn"]', { timeout: 15000 })
          .should('not.exist');
        cy.get(`[data-test="btn-delete-${conns[0].identifier}"]`, { timeout: 15000 })
          .should('not.exist')
      })
    cy.wait(1000)

    // check
    cy.task('getConnections', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: ConnectionTable[] }
        expect(conns).to.have.length(0);
      })
    cy.task("getPointsNumberByFileName", { fileName: "invo.pdf" })
      .then(points => {
        expect(points).eq(0)
      })
    cy.task("getPointsNumberByFileName", { fileName: "sample.pdf" })
      .then(points => {
        expect(points).eq(0)
      })
  })
})
