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
    cy.intercept("GET", "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&prompt=consent&response_type=code&client_id=195646197640-f2guf0p5q1ueb7jpu1tarrcvlr2bvn65.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fconnections%2Fgoogle-drive%2Fcallback", (res) => {
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

  it('should create a new Google Drive connection, show it on the dashboard, and delete it', () => {
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

  it("should start processing without configuration", () => {
    cy.task('getConnection', { email: fakeUser.email })
      .then(res => {
        const { conns } = res as { conns: typeof connections.$inferSelect[] }

        cy.visit('/connections')
          .get(`[data-test="btn-config-${conns[0].identifier}"]`)
          .click()
          .get(`[data-test="btn-config-connection"]`)
          .click()
        // todo intercept with msw https://www.googleapis.com/drive/v3/files
      })
  })
})
