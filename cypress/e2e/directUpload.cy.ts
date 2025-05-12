import { ConnectionTable, ProcessedFilesTable } from "@/db/schemas/connections"

interface FileConnectionQuery extends ConnectionTable {
  files: ProcessedFilesTable[]
}

describe("Direct Upload", () => {

  const fakeUser = {
    name: "test man",
    email: "tester@dcup.dev",
    provider: "google",
    image: `https://via.placeholder.com/200/7732bb/c0392b.png?text=tester`,
    plan: "OS"
  }

  beforeEach(() => {
    // login
    cy.visit('/')
      .location('pathname')
      .should('eq', '/login')
      .task('addNewUser', fakeUser)
      .then((result) => {
        cy.loginNextAuth(result as any)
      })
      .visit('/')
      .location('pathname')
      .should('eq', '/')
  })

  afterEach(() => {
    cy.task('deleteUser', { email: fakeUser.email })
    cy.task("deleteCollection")
  })

  it("should process files successfully with File Connection Management: Upload, Add, and Remove Files", () => {

    // Upload 1 pdf  
    cy.visit('/connections')
      .get('[data-test="btn-upload-files"]')
      .click()
      .get('input[name="fileUpload"]')
      .selectFile(["cypress/fixtures/invo.pdf"])
      .get('[data-test="btn-upload"]')
      .scrollIntoView()
      .get('[data-test="btn-upload"]')
      .click({ force: true })
    cy.wait(20000)

    // Check 
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        expect(conn.files.length).eq(1)
        expect(conn.files[0].name).eq("invo.pdf")
        expect(conn.files[0].totalPages).to.eq(3)
        cy.task("getPointsById", { chunkIds: conn.files[0].chunksIds }).then(points => {
          const ps = points as any[]
          expect(ps.length).eq(conn.files[0].chunksIds.length)
          ps.map(p => {
            expect(p.payload._document_id).eq('invo.pdf')
            expect(p.payload._metadata.source).eq('DIRECT_UPLOAD')
          })
        })
      })
    cy.wait(1000)
    // add new pdf file 
    cy.get('[data-test="btn-config"]').as("btn-config")

    cy.get("@btn-config")
      .click()
      .get('input[name="fileUpload"]')
      .selectFile(["cypress/fixtures/sample.pdf"])
      .get('[data-test="btn-upload"]')
      .scrollIntoView()
      .get('[data-test="btn-upload"]')
      .click({ force: true })
    cy.wait(20000)
    //Check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        expect(conn.files.length).eq(2)
        expect(conn.files[0].name).eq("invo.pdf")
        expect(conn.files[1].name).eq("sample.pdf")
        expect(conn.files[0].totalPages).to.eq(3)
        expect(conn.files[1].totalPages).to.eq(1)
        cy.task("getPointsById", { chunkIds: conn.files[1].chunksIds }).then(points => {
          const ps = points as any[]
          expect(ps.length).eq(conn.files[1].chunksIds.length)
          ps.map(p => {
            expect(p.payload._document_id).eq('sample.pdf')
            expect(p.payload._metadata.source).eq('DIRECT_UPLOAD')
          })
        })
      })

    // remove one pdf file
    cy.wait(1000)
    cy.get("@btn-config")
      .click()

    cy.get('[data-test="btn-remove-invo.pdf"]')
      .click()

    cy.get('[data-test="btn-upload"]')
      .click({ force: true })
    cy.wait(20000)
    // check
    cy.task("getConnection", { email: fakeUser.email })
      .then(({ conns }: any) => {
        const conn = (conns as FileConnectionQuery[])[0]
        expect(conn.service).eq("DIRECT_UPLOAD")
        expect(conn.metadata).eq("{}")
        expect(conn.limitPages).to.be.null
        expect(conn.limitFiles).to.be.null
        expect(conn.files.length).eq(1)
        expect(conn.files[0].name).eq("sample.pdf")
        expect(conn.files[0].totalPages).to.eq(1)
        cy.task("getPointsById", { chunkIds: conn.files[0].chunksIds }).then(points => {
          const ps = points as any[]
          expect(ps.length).eq(conn.files[0].chunksIds.length)
          ps.map(p => {
            expect(p.payload._document_id).eq('sample.pdf')
            expect(p.payload._metadata.source).eq('DIRECT_UPLOAD')
          })
        })
      })
  })
})
