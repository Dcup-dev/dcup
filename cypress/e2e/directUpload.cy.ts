import { ConnectionTable, ProcessedFilesTable } from "@/db/schemas/connections"
import { users } from "@/db/schemas/users"

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
describe("Direct Upload UI", () => {
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

  context("basic .pdf ops", () => {
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
      // check
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.files.length).eq(2)
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).greaterThan(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
            .then(points => {
              expect(points).greaterThan(0)
            })
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
      // check
      cy.task('getConnections', { email: fakeUser.email })
        .then(res => {
          const { conns } = res as { conns: ConnectionTable[] }
          expect(conns).to.have.length(0);
        })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId })
            .then(points => {
              expect(points).eq(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
  })
  context("basic .txt ops", () => {
    it('should handle file upload, addition, and removal with database synchronization', () => {

      // Upload 1 pdf  
      cy.uploadFiles({ files: ['dcup_Introduction.txt'] })
      cy.wait(5000)

      // Check 
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "dcup_Introduction.txt", totalPages: 1 }] })
        })
      cy.get('[data-test="folderName"]').should('contain.text', "*")
      cy.get('[data-test="processedFile"]').should('contain.text', 1)
      cy.get('[data-test="processedPage"]').should('contain.text', 1)

      // add new pdf file 
      cy.get('[data-test="btn-config"]')
        .click()

      cy.uploadFiles({ files: ["dcup_how_it_works.txt"] })
      cy.wait(5000)

      //Check
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "dcup_Introduction.txt", totalPages: 1 }, { name: "dcup_how_it_works.txt", totalPages: 1 }] })
        })
      cy.get('[data-test="folderName"]').should('contain.text', "*")
      cy.get('[data-test="processedFile"]').should('contain.text', 2)
      cy.get('[data-test="processedPage"]').should('contain.text', 2)
      // remove one file
      cy.get('[data-test="btn-config"]')
        .click()
      cy.get('[data-test="btn-remove-dcup_Introduction.txt"]')
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
          cy.checkIndexedFiles({ conn, files: [{ name: "dcup_how_it_works.txt", totalPages: 1 }] })
        })
      cy.get('[data-test="folderName"]').should('contain.text', "*")
      cy.get('[data-test="processedFile"]').should('contain.text', 1)
      cy.get('[data-test="processedPage"]').should('contain.text', 1)
    })
    it("should remove all files that related to the connection when user delete the connection", () => {
      // Upload 2 pdf  
      cy.uploadFiles({ files: ['dcup_how_it_works.txt', "dcup_Introduction.txt"] })
      cy.wait(5000)

      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "dcup_how_it_works.txt", totalPages: 1 }, { name: "dcup_Introduction.txt", totalPages: 1 }] })
        })
      // check
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.files.length).eq(2)
          cy.task("getPointsNumberByFileName", { fileName: "dcup_how_it_works.txt", userId: conn.userId })
            .then(points => {
              expect(points).greaterThan(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "dcup_Introduction.txt", userId: conn.userId })
            .then(points => {
              expect(points).greaterThan(0)
            })
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
      // check
      cy.task('getConnections', { email: fakeUser.email })
        .then(res => {
          const { conns } = res as { conns: ConnectionTable[] }
          expect(conns).to.have.length(0);
        })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "dcup_how_it_works.txt", userId })
            .then(points => {
              expect(points).eq(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "dcup_Introduction.txt", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
    it('should process Direct text without file', () => {
      cy.get('[data-test="btn-texts"]')
        .click()
      cy.get('textarea[name="text"]')
        .type("Connect your app to user data in minutes with self-hostable RAG pipelines. Harness AI-powered retrieval with enterprise-grade scalability")

      cy.get('[data-test="btn-upload"]')
        .click({ force: true })
      cy.wait(5000)
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "TEXT", totalPages: 1 }] })
          expect(conn.files.length).eq(1)
          cy.task("getPointsNumberByFileName", { fileName: "TEXT", userId: conn.userId })
            .then(points => {
              expect(points).greaterThan(0)
            })
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
      // check
      cy.task('getConnections', { email: fakeUser.email })
        .then(res => {
          const { conns } = res as { conns: ConnectionTable[] }
          expect(conns).to.have.length(0);
        })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "TEXT", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
  })
  context("max .pdf and .txt", ()=>{
    it('should handle file upload, addition, and removal with database synchronization', () => {

      // Upload 1 txt 
      cy.uploadFiles({ files: ['dcup_Introduction.txt'] })
      cy.wait(5000)

      // Check 
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "dcup_Introduction.txt", totalPages: 1 }] })
        })
      cy.get('[data-test="folderName"]').should('contain.text', "*")
      cy.get('[data-test="processedFile"]').should('contain.text', 1)
      cy.get('[data-test="processedPage"]').should('contain.text', 1)

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
          cy.checkIndexedFiles({ conn, files: [{ name: "dcup_Introduction.txt", totalPages: 1 }, { name: "sample.pdf", totalPages: 1 }] })
        })
      cy.get('[data-test="folderName"]').should('contain.text', "*")
      cy.get('[data-test="processedFile"]').should('contain.text', 2)
      cy.get('[data-test="processedPage"]').should('contain.text', 2)
      // remove one file
      cy.get('[data-test="btn-config"]')
        .click()
      cy.get('[data-test="btn-remove-dcup_Introduction.txt"]')
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
  })
  context("direct upload functionality", () => {
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
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
        })
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
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
      // check the UI
      cy.get('[data-test="folderName"]').should('contain.text', "*")
      cy.get('[data-test="processedFile"]').should('contain.text', 1)
      cy.get('[data-test="processedPage"]').should('contain.text', 2)
      // remove the only stored pdf file  
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
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).eq(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
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
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
        })
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
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
        })
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
      // check
      cy.task('getConnections', { email: fakeUser.email })
        .then(res => {
          const { conns } = res as { conns: ConnectionTable[] }
          expect(conns).to.have.length(0);
        })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId })
            .then(points => {
              expect(points).eq(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
    it('should handle processing cancellation with progress preservation', () => {
      cy.uploadFiles({ files: ['invo.pdf', "sample.pdf"] })
      cy.wait(1000)

      const targetState = { file: 1, page: 2 }
      let found = false

      const checkProgress = (retries = 0) => {
        cy.get('[data-test="processedFile"]').invoke('text').then(fileText => {
          cy.get('[data-test="processedPage"]').invoke('text').then(pageText => {
            const currentFile = parseInt(fileText)
            const currentPage = parseInt(pageText)

            if (currentFile >= targetState.file && currentPage >= targetState.page) {
              found = true
              cy.get('[data-test="stop-connection"]').click()
              return
            }

            if (!found) {
              cy.wait(1000) // Check every 500ms
              checkProgress(retries + 1)
            }
          })
        })
      }
      checkProgress()

      // UI assertions
      cy.get('[data-test="processedFile"]').should('contain', targetState.file)
      cy.get('[data-test="processedPage"]').should('contain', targetState.page)

      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 2 }, { name: "sample.pdf", totalPages: 0 }] })
        })
    })
  })
})

describe("Direct Upload API", () => {
  const otherUser = {
    name: "test man2",
    email: "tester2x@dcup.dev",
    provider: "google",
    image: `https://via.placeholder.com/200/7732bb/c0392b.png?text=tester`,
    plan: "OS"
  }
  beforeEach(() => {
    cy.visit('/')
    cy.task("createCollection")
    cy.wait(1000)
  })
  afterEach(() => {
    cy.task('deleteUser', { email: fakeUser.email })
    cy.task('deleteUser', { email: otherUser.email })
    cy.task("deleteCollection")
  })

  context("basic .pdf ops", () => {
    it('should handle file upload, addition, and removal with database synchronization', () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "invo.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
              // add new pdf file 
              cy.uploadFileWithApi({
                apiKey: key as string,
                method: 'PUT',
                url: `/api/connections/${conn.id}`,
                fileName: "sample.pdf",
                response: {
                  code: "ok",
                  message: 'Connection has been successfully updated and queued for processing.'
                }
              })
            })
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
              // remove one pdf file
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}/files`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
                body: {
                  file: "invo.pdf"
                }
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Deleted 'invo.pdf' successfully")
              })
            })
        })
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
      })
    })
    it("should remove all files that related to the connection when user delete the connection", () => {
      // Upload 2 pdf  
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "invo.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({
                conn, files: [
                  { name: "invo.pdf", totalPages: 3 },
                ]
              })
              // check
              cy.task("getConnection", { email: fakeUser.email })
                .then(({ conns }: any) => {
                  const conn = (conns as FileConnectionQuery[])[0]
                  expect(conn.files.length).eq(1)
                  cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                    .then(points => {
                      expect(points).greaterThan(0)
                    })
                  // Delete connection
                  cy.request({
                    method: "DELETE",
                    url: `/api/connections/${conn.id}`,
                    headers: {
                      "Authorization": `Bearer ${key}`
                    },
                  }).then(res => {
                    expect(res.status).eq(200)
                    expect(res.body.code).eq("ok")
                    expect(res.body.message).eq("Connection has been successfully deleted")
                  })
                })
            })
        })
      })
      // check
      cy.task('getConnections', { email: fakeUser.email })
        .then(res => {
          const { conns } = res as { conns: ConnectionTable[] }
          expect(conns).to.have.length(0);
        })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
  })
  context("basic .txt ops", () => {
    it('should handle file upload, addition, and removal with database synchronization', () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "dcup_Introduction.txt",
            type: "text/plain",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "dcup_Introduction.txt", totalPages: 1 }] })
              // add new pdf file 
              cy.uploadFileWithApi({
                apiKey: key as string,
                method: 'PUT',
                type: "text/plain",
                url: `/api/connections/${conn.id}`,
                fileName: "dcup_how_it_works.txt",
                response: {
                  code: "ok",
                  message: 'Connection has been successfully updated and queued for processing.'
                }
              })
            })
          cy.wait(8000)
          //Check
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({
                conn, files: [
                  { name: "dcup_how_it_works.txt", totalPages: 4 },
                  { name: "dcup_Introduction.txt", totalPages: 1 }
                ]
              })
              // remove one pdf file
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}/files`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
                body: {
                  file: "dcup_Introduction.txt"
                }
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Deleted 'dcup_Introduction.txt' successfully")
              })
            })
        })
        cy.wait(5000)
        // check
        cy.task("getConnection", { email: fakeUser.email })
          .then(({ conns }: any) => {
            const conn = (conns as FileConnectionQuery[])[0]
            expect(conn.service).eq("DIRECT_UPLOAD")
            expect(conn.metadata).eq("{}")
            expect(conn.limitPages).to.be.null
            expect(conn.limitFiles).to.be.null
            cy.checkIndexedFiles({ conn, files: [{ name: "dcup_how_it_works.txt", totalPages: 4 }] })
          })
      })
    })
    it("should remove all files that related to the connection when user delete the connection", () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "dcup_Introduction.txt",
            type: "text/plain",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({
                conn, files: [
                  { name: "dcup_Introduction.txt", totalPages: 1 }
                ]
              })
            })
          // check
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.files.length).eq(1)
              cy.task("getPointsNumberByFileName", { fileName: "dcup_Introduction.txt", userId: conn.userId })
                .then(points => {
                  expect(points).greaterThan(0)
                })
              //  Delete connection
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Connection has been successfully deleted")
              })
            })
        })
      })
      // check
      cy.task('getConnections', { email: fakeUser.email })
        .then(res => {
          const { conns } = res as { conns: ConnectionTable[] }
          expect(conns).to.have.length(0);
        })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "dcup_Introduction.txt", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
    it('should process Direct text without file', () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            texts: ["Connect your app to user data in minutes with self-hostable RAG pipelines. Harness AI-powered retrieval with enterprise-grade scalability"],
            type: "text/plain",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "TEXT", totalPages: 1 }] })
              expect(conn.files.length).eq(1)
              cy.task("getPointsNumberByFileName", { fileName: "TEXT", userId: conn.userId })
                .then(points => {
                  expect(points).greaterThan(0)
                })
              // Delete connection
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Connection has been successfully deleted")
              })
            })
        })
      })
      cy.wait(5000)
      // check
      cy.task('getConnections', { email: fakeUser.email })
        .then(res => {
          const { conns } = res as { conns: ConnectionTable[] }
          expect(conns).to.have.length(0);
        })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "TEXT", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
  })
  context("privacy", () => {
    it("should not remove the same file from user, when Deleting a file from other user", () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "invo.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
            })
        })
      })
      cy.task('addNewUser', otherUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "invo.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: otherUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}/files`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
                body: {
                  file: "invo.pdf"
                }
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Deleted 'invo.pdf' successfully")
              })
            })
        })
      })
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
        })
      cy.task("getConnection", { email: otherUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [] })
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
    it("should not affect another user's connection, when Deleting a connection from one user", () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "invo.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
            })
        })
      })

      cy.task('addNewUser', otherUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "invo.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: otherUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Connection has been successfully deleted")
              })
            })
        })
      })
      cy.wait(5000)
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).to.be.null
          expect(conn.limitFiles).to.be.null
          cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
        })
      cy.task("getUserId", { email: otherUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
    it("should not share files between users", () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "invo.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: fakeUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "invo.pdf", totalPages: 3 }] })
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
            })
        })
      })

      cy.task('addNewUser', otherUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          // upload pdf
          cy.uploadFileWithApi({
            apiKey: key as string,
            fileName: "sample.pdf",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
          cy.wait(5000)
          // // Check 
          cy.task("getConnection", { email: otherUser.email })
            .then(({ conns }: any) => {
              const conn = (conns as FileConnectionQuery[])[0]
              expect(conn.service).eq("DIRECT_UPLOAD")
              expect(conn.metadata).eq("{}")
              expect(conn.limitPages).to.be.null
              expect(conn.limitFiles).to.be.null
              cy.checkIndexedFiles({ conn, files: [{ name: "sample.pdf", totalPages: 1 }] })
              cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
            })
        })
      })
      cy.task("getUserId", { email: fakeUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId })
            .then(points => {
              expect(points).to.eq(0)
            })
        })
      cy.task("getUserId", { email: otherUser.email })
        .then(userId => {
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId })
            .then(points => {
              expect(points).to.be.greaterThan(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId })
            .then(points => {
              expect(points).to.eq(0)
            })
        })
    })
  })
  context("direct upload functionality", () => {
    it('should update and clear connection metadata for indexed files', () => {
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          cy.uploadFileWithApi({
            fileName: 'invo.pdf',
            apiKey: key as string,
            identifier: "testing_connection",
            metadata: '{"job": "my test files"}',
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
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
              cy.uploadFileWithApi({
                apiKey: key as string,
                method: 'PUT',
                url: `/api/connections/${conn.id}`,
                identifier: "other_testing_connection",
                metadata: '{"job": "other tests"}',
                response: {
                  code: "ok",
                  message: 'Connection has been successfully updated and queued for processing.'
                }
              })
            })
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
              cy.uploadFileWithApi({
                apiKey: key as string,
                method: 'PUT',
                url: `/api/connections/${conn.id}`,
                identifier: "other_testing_connection",
                metadata: '',
                response: {
                  code: "ok",
                  message: 'Connection has been successfully updated and queued for processing.'
                }
              })
            })
        })
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
      })
    })
    it('should enforce page limits during file operations and maintain constraints', () => {
      // Upload 1 pdf  with 3 pages, it should process only 2 
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          cy.uploadFileWithApi({
            fileName: 'invo.pdf',
            apiKey: key as string,
            pageLimit: "2",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
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
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
              // add new pdf file with 1 page, it should not index it or store it 
              cy.uploadFileWithApi({
                apiKey: key as string,
                method: 'PUT',
                url: `/api/connections/${conn.id}`,
                fileName: "sample.pdf",
                response: {
                  code: "ok",
                  message: 'Connection has been successfully updated and queued for processing.'
                }
              })
            })
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
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
              cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).eq(0)
                })
              // remove the only pdf file 
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}/files`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
                body: {
                  file: "invo.pdf"
                }
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Deleted 'invo.pdf' successfully")
              })
            })
        })
      })
      cy.wait(5000)
      //Check
      cy.task("getConnection", { email: fakeUser.email })
        .then(({ conns }: any) => {
          const conn = (conns as FileConnectionQuery[])[0]
          expect(conn.service).eq("DIRECT_UPLOAD")
          expect(conn.metadata).eq("{}")
          expect(conn.limitPages).eq(2)
          expect(conn.limitFiles).to.be.null
          expect(conn.files.length).eq(0)
          cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
            .then(points => {
              expect(points).eq(0)
            })
          cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
            .then(points => {
              expect(points).eq(0)
            })
        })
    })
    it('should distribute page processing across files to respect page limits', () => {
      // Upload 1 pdf  with 1 page, it should process only 1
      cy.task('addNewUser', fakeUser).then(user => {
        const u = user as typeof users.$inferSelect
        cy.task('createApiKey', { id: u.id }).then(key => {
          cy.uploadFileWithApi({
            fileName: 'sample.pdf',
            apiKey: key as string,
            pageLimit: "2",
            response: {
              code: "ok",
              message: 'Your file was successfully uploaded and processed.'
            }
          })
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
              cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
              // add new pdf file with 3 pages, it should process 2 from this file
              cy.uploadFileWithApi({
                apiKey: key as string,
                method: 'PUT',
                url: `/api/connections/${conn.id}`,
                fileName: "invo.pdf",
                response: {
                  code: "ok",
                  message: 'Connection has been successfully updated and queued for processing.'
                }
              })
            })
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
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
              cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId: conn.userId })
                .then(points => {
                  expect(points).to.be.greaterThan(0)
                })
              //  Delete connection
              cy.request({
                method: "DELETE",
                url: `/api/connections/${conn.id}`,
                headers: {
                  "Authorization": `Bearer ${key}`
                },
              }).then(res => {
                expect(res.status).eq(200)
                expect(res.body.code).eq("ok")
                expect(res.body.message).eq("Connection has been successfully deleted")
              })
            })
          cy.wait(5000)
          // check
          cy.task('getConnections', { email: fakeUser.email })
            .then(res => {
              const { conns } = res as { conns: ConnectionTable[] }
              expect(conns).to.have.length(0);
            })
          cy.task("getUserId", { email: fakeUser.email })
            .then(userId => {
              cy.task("getPointsNumberByFileName", { fileName: "invo.pdf", userId })
                .then(points => {
                  expect(points).eq(0)
                })
              cy.task("getPointsNumberByFileName", { fileName: "sample.pdf", userId })
                .then(points => {
                  expect(points).eq(0)
                })
            })
        })
      })
    })
  })
})
