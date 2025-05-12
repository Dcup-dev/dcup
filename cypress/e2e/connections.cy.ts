import { connections } from "@/db/schemas/connections"

describe('connect to google drive', () => {
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
    // create new connection 
    cy.intercept("GET", "https://accounts.google.com/o/oauth2/v2/auth*", (res) => {
      res.reply(200, "OK")
    }).as("googleAuth")


    // Perform the user flow, 
    cy.visit('/connections/new')
      .get('[data-test="connection-card"]')
      .contains('Google Drive', { matchCase: false })
      .get('[data-test="btn-google-drive"]')
      .click();

    cy.wait("@googleAuth")
    cy.request("/api/connections/google-drive/callback?code=FAKE_CODE")
      .then(res => cy.log(`status: ${res.status}`))
  })

  afterEach(() => {
    cy.task('deleteUser', { email: fakeUser.email })
  })


  it('connect and config with no settings and delete ( 0 file ) , check the database', () => {
    cy.task('getConnection', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: typeof connections.$inferSelect[] }
        cy.visit('/connections')
          .get(`[data-test="btn-config-${conns[0].identifier}"]`)
          .click()
          .get(`[data-test="btn-config-connection"]`)
          .click()
      }).wait(10000)

    cy.task('getConnection', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: typeof connections.$inferSelect[] }
        cy.visit("/")
          .contains(/google drive/i)
          .should('exist')
          .parent()
          .within(() => {
            cy.contains(conns[0].identifier).should('exist');
          });

        expect(conns[0].service).eq("GOOGLE_DRIVE")
        expect(conns[0].metadata).eq("{}")
        expect(conns[0].limitPages).to.be.null
        expect(conns[0].limitFiles).to.be.null

        cy.visit('/connections')
          .get(`[data-test="btn-delete-${conns[0].identifier}"]`)
          .click()
          .get(`[data-test="delete-connection-btn"]`)
          .click()

        cy.get('[data-test="delete-connection-btn"]', { timeout: 15000 })
          .should('not.exist');
        cy.get(`[data-test="btn-delete-${conns[0].identifier}"]`, { timeout: 15000 })
          .should('not.exist')
      })
    cy.task('getConnection', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: typeof connections.$inferSelect[] }
        expect(conns).to.have.length(0);
      })
    cy.visit("/")
      .contains(/google drive/i)
      .should('not.exist')
  });

  it("connect and config with settings and delete (0 file), check the database", () => {
    cy.task('getConnection', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: typeof connections.$inferSelect[] }
        cy.visit('/connections')
          .get(`[data-test="btn-config-${conns[0].identifier}"]`)
          .click()
          .get('input[name="connectionName"]')
          .clear()
          .type("testing_connection")
          .get('textarea[name="metadata"]')
          .clear()
          .type('{"job": "my test files"}', { parseSpecialCharSequences: false })
          .get('input[name="filestLimit"]')
          .type('2')
          .get('input[name="pageLimit"]')
          .type('5')
          .get(`[data-test="btn-config-connection"]`)
          .click()
      }).wait(10000)
    cy.task('getConnection', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: typeof connections.$inferSelect[] }
        cy.visit("/")
          .contains(/google drive/i)
          .should('exist')
          .parent()
          .within(() => {
            cy.contains(conns[0].identifier).should('exist');
          });

        expect(conns[0].service).eq("GOOGLE_DRIVE")
        expect(conns[0].metadata).eq('{"job": "my test files"}')
        expect(conns[0].limitPages).eq(5)
        expect(conns[0].limitFiles).eq(2)

        cy.visit('/connections')
          .get(`[data-test="btn-delete-${conns[0].identifier}"]`)
          .click()
          .get(`[data-test="delete-connection-btn"]`)
          .click()

        cy.get('[data-test="delete-connection-btn"]', { timeout: 15000 })
          .should('not.exist');
        cy.get(`[data-test="btn-delete-${conns[0].identifier}"]`, { timeout: 15000 })
          .should('not.exist')
      })

    cy.task('getConnection', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: typeof connections.$inferSelect[] }
        expect(conns).to.have.length(0);
      })
    cy.visit("/")
      .contains(/google drive/i)
      .should('not.exist')
  })
})
